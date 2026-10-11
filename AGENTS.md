# Agent Instructions

## Code Style

- NEVER add code comments. The only exception is a one-line comment for a
  deliberate simplification, e.g. `// assume ... for simplicity`.
- If the body of a `computed` needs more than one line, move it into a pure
  function and call that function from the `computed`.
- Don't access properties on the result of a method call, e.g.
  `schema.safeParse(value).data`. Store the result in a variable first.
  Reading a signal, e.g. `this.toolCall().args`, is fine, and so is chaining
  methods, e.g. `items.filter(...).map(...)`.
- Don't nest an `await` inside another expression, e.g.
  `wrap(await load(args))` or `{ items: await load() }`. Await into a variable
  on one line and use it on the next.
- The `execute` of a tool (`createTool`) always has a block body, even when it
  is a single `return`. Never use a concise arrow body there.
- NEVER inline SVGs, neither in templates nor as data URIs in CSS. Put each
  icon into `public/icons/` with its colors set in the file and reference it,
  e.g. `<img src="icons/plus.svg" width="14" height="14" alt="" />`.

## Reference Docs

- If you work on AG-UI specific code or agent communication in general, you
  can look up details here: https://docs.ag-ui.com/llms-full.txt
- If you work on A2UI specific code, you can look up details here:
  https://github.com/google/A2UI/blob/main/README.md
