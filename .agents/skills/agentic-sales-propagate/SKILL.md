---
name: agentic-sales-propagate
description: >-
  Propagate a change through the stacked branches of the agentic-sales repo
  (main → a2ui → a2ui-custom → a2ui-subagent / mcp-apps → bonus, plus the lab
  starters main → ag-ui-starter and a2ui-custom → a2ui-starter, which keep their TODO
  stubs) by rebasing each branch onto its parent in a separate worktree, resolving
  conflicts, typechecking every branch and verifying the result against backup refs.
  Use this whenever the user changed main (or any branch in the chain) and wants the
  branches on top updated, asks to rebase a2ui, a2ui-custom, a2ui-subagent, mcp-apps,
  bonus, ag-ui-starter or a2ui-starter, or says "die anderen Branches rebasen",
  "Branches nachziehen", "auf main rebasen", "Kette rebasen", "Starter nachziehen",
  "Starter rebasen", "main hat sich geändert" — even when only one branch is named.
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
| `ag-ui-starter` | `main`        | Lab starter for the AG-UI labs, TODO #1–#11: bar chart schema and widget, component and tool registration, CopilotKit providers, chat widgets, interrupts, dashboard widget and agent state stubbed out; `solution.md`; Peacock colors in `.vscode/settings.json` |
| `a2ui-starter`  | `a2ui-custom` | Lab starter for the A2UI labs, TODO #1–#8: A2UI activation in `app.config.ts`, dashboard tiles, `a2ui-surface.ts`, product carousel input, schema, catalog entry and registration stubbed out; `solution.md` |

`a2ui-subagent` and `mcp-apps` are siblings, so `bonus` does not contain the designer
subagent. Never bring subagent code into `mcp-apps` or `bonus` while resolving.

The commit "refactor: simplify a2ui solution by not using ag-ui based components" on
`a2ui` deliberately deletes the query path: `run-query.ts`, `shared/query-schema.ts`,
`query-client.ts`, `dashboard-widget.ts`, `dashboard-widget-schema.ts`,
`dashboard-tile.ts`, `query-result-view.ts`, `a2ui-model.ts`, `deep-equal.ts` and
`public/icons/plus.svg` (`bonus` re-adds `plus.svg`). These deletions must survive.

The chain lives in `CHAIN` at the top of `scripts/propagate.sh`. If the user adds,
removes or re-parents a branch, update `CHAIN` and the table above together. This skill
is committed on `main` (`.agents/skills/agentic-sales-propagate`, linked from
`.claude/skills`); change it there and propagate it like any other change.

## Starter branches

`ag-ui-starter` and `a2ui-starter` are handouts for lab sheets and live coding, so they
deliberately lack code. Their own commits replace parts of the parent with stubs marked
`// TODO #n` (`<!-- TODO #n -->` in templates), and `solution.md` shows the code for
each TODO. The parent is the solution: `main` for `ag-ui-starter`, `a2ui-custom` for
`a2ui-starter`. In a few places the starter's solution deliberately differs from the
parent, e.g. `ag-ui-starter` projects `items` and `hasSavedState` in
`dashboard-view.ts`, and TODO #1 of `a2ui-starter` starts with the basic catalog; keep
these variants. A rebase must never fill a gap: afterwards the starter lacks exactly
what it lacked before, only on top of the new parent.

- Keep every stub and TODO comment, and the leftovers the stubs cause: unused imports
  and helpers, placeholders such as `computed(() => true)`, `signal<Product[]>([])`,
  `{}` or `export const barChartWidget = {}`. TODO comments are the exception to the
  no-comments rule in `AGENTS.md`. Never resolve a conflict in a stubbed spot by taking
  the parent's version, and never complete a stub because the typecheck complains (it
  compares with the backup, so the errors stubs already caused do not block).
- Upstream changes code the starter stubs out: keep the stub and update everything in
  the starter that quotes the solution, so it matches the new parent: the TODO text,
  hint comments that carry solution code (e.g. the template in the block comment at the
  end of `bar-chart-widget.ts`, descriptions copied into comments) and the matching
  `## TODO #n` section of `solution.md`.
- Upstream changes code next to a stub, in a part of the file the starter keeps: take
  the upstream version.
- Upstream adds code that belongs to an exercise (it would solve part of a TODO, e.g. a
  new prop in a stubbed schema or another registration next to a stubbed one): it
  applies without a conflict and silently leaks solution code into the starter. Stub it
  like the rest of the exercise and extend the TODO and `solution.md`. If it does not fit
  an existing TODO, ask the user; never add, renumber or drop TODOs on your own.
- Upstream code unrelated to the exercises stays in the starter.

Starters are leaves; no branch sits on top of them.

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
   results below a conflicting branch are approximate. For each starter it also lists
   the lab files (files the starter's own commits change) that the upstream change
   touches and the `solution.md` lines it outdates.
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
5. Review every starter before `verify`, while the worktree still exists. `run` prints
   its TODO check, the `solution.md` check and the lab files changed upstream. For each
   of these files, compare `git diff <old base> <parent> -- <file>` with the starter's
   version and apply the rules in "Starter branches", including the conflict-free
   leaks. Skim the rest of the upstream change for code that belongs to an exercise,
   too. Fix the starter as described in "Fixing a branch after a rebase".
6. `bash <skill-dir>/scripts/propagate.sh verify <topic>` prints per branch: files
   changed vs backup, the range-diff of the own commits, conflict markers, new type
   errors and whether the parent tip is contained; for starters also the TODO check,
   the `solution.md` check and the lab files changed upstream. Then it removes the
   worktree.
   Expect `OK`, 0 markers, no new errors, `yes`. `!` in the range-diff marks commits
   changed by a resolution; explain each one. `CHECK unexpected=[…]` means a file
   changed that the parent did not touch; inspect it, it is usually a mistake. On a
   starter, `solution.md` and hint comments you adapted show up there; that is
   expected. `todo markers: CHECK missing=[…]` means a TODO marker is gone: a stub was
   overwritten with solution code or dropped. Restore it.
   `solution.md: CHECK` lists code lines of `solution.md` that the old parent
   contained and the new one does not, with their TODO and file. Update that section
   and the matching hint comments in the code to the new parent. The check compares
   single lines against the backup, so deliberate variants stay quiet; it finds
   neither leaked solution code nor outdated TODO texts.

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
- On a starter, a conflict in a stubbed spot always keeps the stub; see "Starter
  branches".
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

### Fixing a branch after a rebase

After new type errors, `run` leaves the branch checked out in the worktree; for a
starter review, check it out yourself (`git -C .worktrees/propagate checkout <branch>`).
Fix it there and fold the fix into the commit that caused it (for a starter: the commit
that added the stub or the `solution.md` section):
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
files, how), every `!` and `CHECK` from `verify` with the reason, per starter which
stubs, hints and `solution.md` sections you adapted, fix commits added, the backup
refs, and that nothing was pushed.
