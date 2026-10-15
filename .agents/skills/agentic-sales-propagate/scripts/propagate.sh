#!/usr/bin/env bash
set -eo pipefail

CHAIN=(
  "a2ui:main"
  "a2ui-custom:a2ui"
  "a2ui-subagent:a2ui-custom"
  "mcp-apps:a2ui-custom"
  "bonus:mcp-apps"
  "ag-ui-starter:main"
)
TSCONFIGS=(agent/tsconfig.json tsconfig.app.json server/tsconfig.json mcp-server/tsconfig.json)

usage() {
  cat <<'USAGE'
usage: propagate.sh <plan|run|verify> <topic>

  plan    print the chain, each branch's own commits and a merge-tree dry run
          (no refs are touched)
  run     back up every chain branch as backup/<branch>-pre-<topic>, then rebase
          parent before child in the worktree .worktrees/propagate and typecheck
          each branch right after its rebase; stops at a conflict or at new type
          errors and can be re-run with the same topic
  verify  per branch: files changed vs backup, range-diff of the own commits,
          conflict markers, new type errors, topology; removes the worktree
USAGE
  exit 2
}

[ $# -eq 2 ] || usage
CMD="$1"
TOPIC="$2"

COMMON="$(git rev-parse --path-format=absolute --git-common-dir)"
ROOT="$(dirname "$COMMON")"
cd "$ROOT"
WT="$ROOT/.worktrees/propagate"
STATE="$COMMON/propagate-$TOPIC"
TSC="$ROOT/node_modules/.bin/tsc"

has_ref() { git rev-parse --verify -q "refs/heads/$1" >/dev/null; }
short() { echo "${1:0:8}"; }
branch_of() { echo "${1%%:*}"; }
parent_of_entry() { echo "${1#*:}"; }

for entry in "${CHAIN[@]}"; do
  has_ref "$(branch_of "$entry")" || { echo "branch $(branch_of "$entry") not found; run this inside the agentic-sales repo" >&2; exit 1; }
done

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
mkdir -p "$WORK/sim"

parent_of() {
  local entry
  for entry in "${CHAIN[@]}"; do
    [ "$(branch_of "$entry")" = "$1" ] && { parent_of_entry "$entry"; return; }
  done
}
in_chain() { [ -n "$(parent_of "$1")" ]; }
backup_of() { echo "backup/$1-pre-$TOPIC"; }

old_tip() {
  if has_ref "$(backup_of "$1")"; then git rev-parse "$(backup_of "$1")"; else git rev-parse "$1"; fi
}

old_base() {
  local b="$1" p tip fp
  p="$(parent_of "$b")"
  tip="$(old_tip "$b")"
  if fp="$(git merge-base --fork-point "$p" "$tip" 2>/dev/null)" && [ -n "$fp" ]; then
    echo "$fp"
  else
    git merge-base "$(old_tip_or_ref "$p")" "$tip"
  fi
}
old_tip_or_ref() { if in_chain "$1"; then old_tip "$1"; else git rev-parse "$1"; fi; }

print_chain() {
  local entry b p base tip
  echo "== chain (old tips)"
  echo "  main @ $(short "$(git rev-parse main)")"
  for entry in "${CHAIN[@]}"; do
    b="$(branch_of "$entry")"
    p="$(parent_of_entry "$entry")"
    tip="$(old_tip "$b")"
    base="$(old_base "$b")"
    echo "  $b @ $(short "$tip") sits on $p @ $(short "$base") ($(git rev-list --count "$base..$tip") own commits)"
    git log --format='      %h %s' "$base..$tip"
  done
  local others
  others="$(git for-each-ref --format='%(refname:short)' refs/heads | grep -v -e '^main$' -e '^backup/' | while read -r b; do in_chain "$b" || echo "$b"; done | tr '\n' ' ')"
  [ -z "$others" ] || echo "  not managed by the chain: $others"
  local busy
  busy="$(foreign_checkouts)"
  [ -z "$busy" ] || { echo "  blocking checkouts (run and verify refuse to start):"; echo "$busy" | sed 's/^/  /'; }
}

dry_run_merge() {
  local base="$1" ours="$2" theirs="$3" label="$4" out tree files
  if out="$(git merge-tree --write-tree --name-only --merge-base "$base" "$ours" "$theirs" 2>&1)"; then
    tree="$(echo "$out" | head -1)"
    echo "  $label: clean" >&2
  else
    tree="$(echo "$out" | head -1)"
    files="$(echo "$out" | sed -n '2,$p' | sed '/^$/,$d')"
    echo "  $label: CONFLICTS in" >&2
    echo "$files" | sed 's/^/      /' >&2
  fi
  git commit-tree "$tree" -p "$ours" -m "sim $label" </dev/null
}

sim_of() { if in_chain "$1"; then cat "$WORK/sim/$1"; else git rev-parse "$1"; fi; }

cmd_plan() {
  print_chain
  echo
  echo "== dry run (merge-tree, refs untouched)"
  local entry b p ours tip
  for entry in "${CHAIN[@]}"; do
    b="$(branch_of "$entry")"
    p="$(parent_of_entry "$entry")"
    ours="$(sim_of "$p")"
    tip="$(old_tip "$b")"
    if git merge-base --is-ancestor "$ours" "$tip"; then
      echo "  $b: already on $p, nothing to do"
      echo "$tip" >"$WORK/sim/$b"
    else
      dry_run_merge "$(old_base "$b")" "$ours" "$tip" "$b -> $p" >"$WORK/sim/$b"
    fi
  done
}

ensure_worktree() {
  [ -x "$TSC" ] || { echo "$TSC not found; run npm install in $ROOT first" >&2; exit 1; }
  grep -qxF '/.worktrees/' "$COMMON/info/exclude" 2>/dev/null || echo '/.worktrees/' >>"$COMMON/info/exclude"
  if [ ! -e "$WT/.git" ]; then
    git worktree prune
    git worktree add -q --detach "$WT" main
  fi
  mkdir -p "$STATE"
}

rebase_in_progress() {
  local gd
  gd="$(git -C "$WT" rev-parse --absolute-git-dir)"
  [ -d "$gd/rebase-merge" ] || [ -d "$gd/rebase-apply" ]
}

foreign_checkouts() {
  local entry b path
  for entry in "${CHAIN[@]}"; do
    b="$(branch_of "$entry")"
    path="$(git worktree list --porcelain | awk -v ref="refs/heads/$b" '/^worktree /{wt=substr($0,10)} $0=="branch " ref {print wt}')"
    if [ -n "$path" ] && [ "$path" != "$WT" ]; then echo "  $b is checked out in $path"; fi
  done
}

check_foreign_checkouts() {
  local busy
  busy="$(foreign_checkouts)"
  if [ -n "$busy" ]; then
    echo "$busy" >&2
    echo "switch those worktrees to main (or another branch outside the chain) first; ask the user" >&2
    exit 1
  fi
}

typecheck() {
  local sha cache cfg
  sha="$(git rev-parse "$1^{commit}")"
  cache="$STATE/tc-$sha"
  if [ ! -f "$cache" ]; then
    git -C "$WT" checkout -q --detach "$sha"
    : >"$cache.tmp"
    for cfg in "${TSCONFIGS[@]}"; do
      [ -f "$WT/$cfg" ] || continue
      { (cd "$WT" && "$TSC" -p "$cfg" --noEmit 2>&1) || true; } | { grep -E 'error TS[0-9]+' || true; } | sed -E 's/\([0-9]+,[0-9]+\)//' >>"$cache.tmp"
    done
    sort -u "$cache.tmp" >"$cache"
    rm "$cache.tmp"
  fi
  cat "$cache"
}

new_type_errors() {
  local b="$1"
  typecheck "$(backup_of "$b")" >"$WORK/tc-old"
  typecheck "$b" >"$WORK/tc-new"
  comm -13 "$WORK/tc-old" "$WORK/tc-new"
}

rebase_branch() {
  local b="$1" p base
  p="$(parent_of "$b")"
  if git merge-base --is-ancestor "$p" "$b"; then
    echo "  $b: already on $p, no rebase"
  else
    base="$(old_base "$b")"
    echo "  $b: rebase --onto $p $(short "$base") ($(git rev-list --count "$base..$b") commits)"
    if ! git -C "$WT" -c rerere.enabled=false rebase --onto "$p" "$base" "$b" >"$WORK/rebase.log" 2>&1; then
      echo
      echo "CONFLICT while rebasing $b onto $p, in commit:"
      git -C "$WT" log -1 --format='  %h %s' REBASE_HEAD 2>/dev/null || true
      echo "Unmerged files (relative to $WT):"
      git -C "$WT" diff --name-only --diff-filter=U | sed 's/^/  /'
      echo
      echo "Resolve them in $WT, 'git -C $WT add/rm' each, 'GIT_EDITOR=true git -C $WT rebase --continue', then re-run:"
      echo "  $0 run $TOPIC"
      exit 1
    fi
  fi
  local errors
  errors="$(new_type_errors "$b")"
  if [ -n "$errors" ]; then
    git -C "$WT" checkout -q "$b"
    echo
    echo "NEW TYPE ERRORS on $b (not present on $(backup_of "$b")):"
    echo "$errors" | sed 's/^/  /'
    echo
    echo "$b is checked out in $WT. Fix it there, commit on $b, then re-run:"
    echo "  $0 run $TOPIC"
    exit 1
  fi
  echo "  $b: typecheck ok (no new errors)"
}

cmd_run() {
  check_foreign_checkouts
  ensure_worktree
  if rebase_in_progress; then
    echo "a rebase is in progress in $WT; finish it with 'GIT_EDITOR=true git -C $WT rebase --continue' (or --abort) first" >&2
    exit 1
  fi
  if [ -n "$(git -C "$WT" status --porcelain --untracked-files=no)" ]; then
    echo "$WT has uncommitted changes; commit them on the branch or discard them first" >&2
    exit 1
  fi
  local entry b
  echo "== backups (backup/<branch>-pre-$TOPIC)"
  for entry in "${CHAIN[@]}"; do
    b="$(branch_of "$entry")"
    if has_ref "$(backup_of "$b")"; then
      echo "  $(backup_of "$b") exists, kept"
    else
      git branch "$(backup_of "$b")" "$b"
      echo "  $(backup_of "$b") created"
    fi
  done
  echo
  echo "== rebase + typecheck (in $WT)"
  for entry in "${CHAIN[@]}"; do
    rebase_branch "$(branch_of "$entry")"
  done
  git -C "$WT" checkout -q --detach main
  echo
  echo "done; now run: $0 verify $TOPIC"
}

count_markers() { { git grep -l -E '^(<<<<<<<|>>>>>>>) ' "$1" -- 2>/dev/null || true; } | wc -l | tr -d ' '; }

cmd_verify() {
  check_foreign_checkouts
  ensure_worktree
  if rebase_in_progress; then
    echo "a rebase is in progress in $WT; finish run first" >&2
    exit 1
  fi
  local entry b p bk base unexpected kept errors
  echo "== verify"
  for entry in "${CHAIN[@]}"; do
    b="$(branch_of "$entry")"
    p="$(parent_of_entry "$entry")"
    bk="$(backup_of "$b")"
    has_ref "$bk" || { echo "  $b: no backup $bk, skipped"; continue; }
    base="$(old_base "$b")"
    git diff --name-only "$base" "$p" | sort >"$WORK/expected"
    git diff --name-only "$bk" "$b" | sort >"$WORK/actual"
    unexpected="$(comm -13 "$WORK/expected" "$WORK/actual" | tr '\n' ' ')"
    kept="$(comm -23 "$WORK/expected" "$WORK/actual" | tr '\n' ' ')"
    echo
    echo "  $b (on $p)"
    if [ -z "$unexpected" ]; then
      echo "    diff vs backup: OK (only files the parent changed)"
    else
      echo "    diff vs backup: CHECK unexpected=[$unexpected]"
    fi
    [ -z "$kept" ] || echo "    parent changes not visible on $b (branch version kept or file deleted): $kept"
    echo "    own commits (range-diff; '=' unchanged, '!' changed by a resolution, '<' dropped, '>' new):"
    git range-diff --no-color "$base..$bk" "$p..$b" | grep -E '^ *[0-9-]+: +[0-9a-f-]+ [=!<>]' | sed 's/^/      /'
    echo "    conflict markers: $(count_markers "$b")"
    errors="$(new_type_errors "$b")"
    if [ -z "$errors" ]; then
      echo "    typecheck: no new errors ($(wc -l <"$WORK/tc-new" | tr -d ' ') total, same as backup)"
    else
      echo "    typecheck: NEW ERRORS"
      echo "$errors" | sed 's/^/      /'
    fi
    echo "    contains $p tip: $(git merge-base --is-ancestor "$p" "$b" && echo yes || echo NO)"
    if git rev-parse --verify -q "$b@{upstream}" >/dev/null 2>&1; then
      echo "    upstream: $(git rev-parse --abbrev-ref "$b@{upstream}") (push needs --force-with-lease, only when asked)"
    fi
  done
  git worktree remove --force "$WT"
  echo
  echo "worktree $WT removed"
}

case "$CMD" in
  plan)   cmd_plan ;;
  run)    cmd_run ;;
  verify) cmd_verify ;;
  *)      usage ;;
esac
