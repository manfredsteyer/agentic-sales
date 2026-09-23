# Agent Instructions

## Code Style

- NEVER add code comments.
- If the body of a `computed` needs more than one line, move it into a pure
  function and call that function from the `computed`.
- Don't access properties on the result of a method call, e.g.
  `schema.safeParse(value).data`. Store the result in a variable first.
  Reading a signal, e.g. `this.toolCall().args`, is fine.
