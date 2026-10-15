---
name: agentic-sales-propagate
description: >-
  Propagate a change through the stacked branches of the agentic-sales repo
  (main → a2ui → a2ui-custom → a2ui-subagent / mcp-apps → bonus, plus the lab
  starter main → ag-ui-starter) by rebasing each branch onto its parent in a separate
  worktree, resolving conflicts, typechecking every branch and verifying the result
  against backup refs. Use this whenever the user changed main (or any branch in the
  chain) and wants the branches on top updated, asks to rebase a2ui, a2ui-custom,
  a2ui-subagent, mcp-apps, bonus or ag-ui-starter, or says "die anderen Branches
  rebasen", "Branches nachziehen", "auf main rebasen", "Kette rebasen", "Starter
  nachziehen", "main hat sich geändert" — even when only one branch is named.
---

# agentic-sales branch propagation

## The chain

| Branch          | Parent        | What it adds                                                                                                                                                        |
| --------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `main`          | —             | Base app: sales and dashboard agents (Mastra), query path (`runQuery`); code shared by Angular and the agent lives in the top-level `shared/` (`@shared/*`), tiles as `{ id, spec }` in `shared/dashboard-schema.ts` |
| `a2ui`          | `main`        | A2UI-only variant: `render_a2ui`, `validate-surface.ts`, A2UI surfaces in chat and dashboard, tiles as `{ surfaceId, messages }`                                     |
| `a2ui-custom`   | `a2ui`        | Custom catalog: product carousel, bar/pie chart and pivot table as A2UI components in `src/app/shared/a2ui/`, their schemas and catalog definitions in `shared/a2ui/`, agent-side `sales-catalog.ts`                            |
| `a2ui-subagent` | `a2ui-custom` | Designer subagent: `a2ui-designer.ts` + prompt, `generate-a2ui.ts`, `render_a2ui` delegates; `updateDashboard` in `dashboard-api.ts`                                  |
| `mcp-apps`      | `a2ui-custom` | MCP apps: `mcp-server/` (sources only, `dist` is ignored), A2UI MCP app bridge, `mcp-apps.config.ts`                                                                   |
| `bonus`         | `mcp-apps`    | Tiles stay up to date: add-to-dashboard button, surface/MCP-app widgets, `a2ui-data-model.ts`, `dashboard-tile/`                                                      |
| `ag-ui-starter` | `main`        | Lab starter, one commit "feat: prepare starter": solution code in `bar-chart-schema.ts` and `bar-chart-widget.ts` replaced by `// TODO #n` stubs, Peacock colors in `.vscode/settings.json` |

`a2ui-subagent` and `mcp-apps` are siblings, so `bonus` does not contain the designer
subagent. Never bring subagent code into `mcp-apps` or `bonus` while resolving.

`ag-ui-starter` is a sibling of `a2ui`; `main` is its solution. Its `// TODO #n`
comments are deliberate (the exception to the no-comments rule in `AGENTS.md`), and so
are the leftovers the stubs cause (unused imports, unused helpers, a placeholder like
`computed(() => true)`). Keep the stubs. If upstream changes code the starter stubs
out, keep the stub and update the TODO text so it still describes the solution on
`main`; if it changes code next to a stub (e.g. the widget template), take the upstream
version.

The commit "refactor: simplify a2ui solution by not using ag-ui based components" on
`a2ui` deliberately deletes the query path: `run-query.ts`, `shared/query-schema.ts`,
`query-client.ts`, `dashboard-widget.ts`, `dashboard-widget-schema.ts`,
`dashboard-tile.ts`, `query-result-view.ts`, `a2ui-model.ts`, `deep-equal.ts` and
`public/icons/plus.svg` (`bonus` re-adds `plus.svg`). These deletions must survive.

The chain lives in `CHAIN` at the top of `scripts/propagate.sh`. If the user adds,
removes or re-parents a branch, update `CHAIN` and the table above together. This skill
is committed on `main` (`.agents/skills/agentic-sales-propagate`, linked from
`.claude/skills`); change it there and propagate it like any other change.

## Procedure

Pick a short kebab-case topic from the upstream change (for "refactor: simplification
for article" use `simplification`). It names the backups `backup/<branch>-pre-<topic>`
and ties the three steps together. Use a new topic for every propagation.

1. The change must be committed on its branch (usually `main`). If it is still in the
   working tree, ask the user before committing.
2. `bash <skill-dir>/scripts/propagate.sh plan <topic>` prints each branch's own
   commits, a merge-tree dry run and the branches that block a run. Check the own
   commits: each list must contain only that branch's feature commits. A list that
   contains a parent's commits means the topology changed; stop and ask. Dry-run
   results below a conflicting branch are approximate.
3. `run` and `verify` refuse to start while a chain branch is checked out in the
   user's worktree (they typically sit on one with `npm run dev` running). Ask the user
   to switch to `main` (or check out nothing from the chain); never switch it for them.
4. `bash <skill-dir>/scripts/propagate.sh run <topic>` creates the backups and rebases
   parent before child in the worktree `.worktrees/propagate` (excluded via
   `.git/info/exclude`), so the user's checkout and dev servers stay untouched. The
   base of each branch comes from `git merge-base --fork-point`, so an amended or
   rebased parent works too. After each rebase it typechecks the branch
   (`agent`, `tsconfig.app.json`, `server`, `mcp-server` where present) and compares
   the errors with the backup. It stops at a conflict or at new type errors. Fix the
   problem (see below) and re-run `run` with the same topic; finished branches are
   skipped.
5. `bash <skill-dir>/scripts/propagate.sh verify <topic>` prints per branch: files
   changed vs backup, the range-diff of the own commits, conflict markers, new type
   errors and whether the parent tip is contained. Then it removes the worktree.
   Expect `OK`, 0 markers, no new errors, `yes`. `!` in the range-diff marks commits
   changed by a resolution; explain each one. `CHECK unexpected=[…]` means a file
   changed that the parent did not touch; inspect it, it is usually a mistake.

## Resolving conflicts

Work in `.worktrees/propagate` (inside the repo, so the normal file tools work). In a
rebase, `HEAD`/"ours" is the new parent including the upstream change, "theirs" is the
branch commit being replayed (`git -C .worktrees/propagate show REBASE_HEAD`). See
what upstream changed with `git log -p <old base>..<parent> -- <file>`.

The rule: keep what the branch deliberately does, and apply the upstream change wherever
the code it touches still exists on the branch.

- Modify/delete, branch deleted the file (the a2ui query path): keep the deletion with
  `git rm`. If the upstream change moved something that surviving files need, carry
  that part over.
- Upstream deleted or moved a file the branch modifies: port the branch's change to the
  new location and `git rm` the old path.
- Renames and moves upstream (identifiers, paths like `@shared/...`) also hit code the
  branch adds without conflicting. Before `rebase --continue`, grep the worktree for
  the old names and paths. The typecheck in `run` catches what slips through.
- `*.prompt.ts` files are prose: merge both sides sentence by sentence and keep every
  instruction. On `a2ui-subagent`, A2UI design guidance belongs in
  `a2ui-designer.prompt.ts`, not in `dashboard-agent.prompt.ts`.
- `package.json`: merge dependencies by hand. `package-lock.json`: never merge by hand;
  `git checkout --ours package-lock.json`, then
  `npm install --package-lock-only --ignore-scripts` in the worktree, then `git add`.
- Additive files (`app.config.ts`, `styles.css`, `example-prompts.ts`,
  `route-utils.ts`, `dashboard-agent.ts` tool registrations): keep both sides'
  additions.
- Usual hotspots: `dashboard-tools.ts`, `shared/dashboard-schema.ts`
  (main uses `{ id, spec }`, the a2ui chain `{ surfaceId, messages }`; take the branch's
  version and re-apply only the upstream edits that still make sense),
  `dashboard-agent.prompt.ts` (touched by every branch), `render-a2ui.ts`,
  `validate-surface.ts`, `evaluate-jsonata.ts`, `dashboard-api.ts` (`a2ui-subagent`).
- Git hooks do not run in the worktree. Format every file you edited with
  `../../node_modules/.bin/prettier --write <file>` (run in the worktree), and follow
  the repo's `AGENTS.md` (no comments, etc.).
- List unmerged files with `git -C .worktrees/propagate diff --name-only --diff-filter=U`,
  check each for `^<<<<<<<`, `git add`/`git rm` it, then
  `GIT_EDITOR=true git -C .worktrees/propagate rebase --continue`.
- If the intent of either side is unclear, stop and show the user both versions
  instead of guessing.

Do not script resolutions with `-X ours`/`-X theirs`, `git add -u` loops or a blanket
`checkout --ours/--theirs` without reading the diff. Taking one side whole is fine
once you have checked that the other side's change does not apply there.

### New type errors after a rebase

`run` leaves the branch checked out in the worktree. Fix it there and fold the fix
into the commit that caused it:
`git commit --fixup=<sha> -a` and `git -c rerere.enabled=false rebase --autosquash <parent>`.
If the autosquash conflicts (later commits touch the same lines), run
`git rebase --abort` and keep the fix as its own commit instead:
`git commit --amend -m "fix: adapt <branch> to <upstream change>"`. Then re-run `run`.

## Rules

- Never push. The branches track `origin`; after the rebase, `main` needs a normal push
  and the others `git push --force-with-lease`, only when the user asks.
- Never delete backup refs; the user cleans them up.
- Never rewrite `main` or other commits the user made; amend only commits you created.
- Do not commit untracked leftovers from other branches (e.g. `mcp-server/dist` on
  `main`).

## Report

Keep it short: the propagated commit(s), per branch clean or conflicts resolved (which
files, how), every `!` and `CHECK` from `verify` with the reason, fix commits added,
the backup refs, and that nothing was pushed.
