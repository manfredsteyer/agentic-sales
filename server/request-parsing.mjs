// Building blocks shared by the request parsers: the client-error type, the
// case-insensitive field lookup and the column allowlist. Every identifier a
// client sends is resolved against the table schema here and replaced by its
// canonical column name; anything unknown results in a BadRequest.

export class BadRequest extends Error {}

/**
 * @typedef {{ columns: import('./sales-dal.mjs').Column[], findColumn: (name: string) => import('./sales-dal.mjs').Column | undefined }} Schema
 */

export function assertPlainObject(value, message) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new BadRequest(message);
}

/** Accepts "AggregateFn", "aggregateFn" and "aggregatefn". */
export function caseInsensitiveField(body) {
  return (key) => body[key] ?? body[key[0].toLowerCase() + key.slice(1)] ?? body[key.toLowerCase()];
}

/** @param {Schema} dal @returns {import('./sales-dal.mjs').Column} */
export function resolveColumn(input, what, dal) {
  if (typeof input !== 'string') throw new BadRequest(`${what} must be a string`);
  const column = dal.findColumn(input);
  if (!column) {
    const available = dal.columns.map((c) => c.name).join(', ');
    throw new BadRequest(`Unknown column '${input}' for ${what}. Available: ${available}`);
  }
  return column;
}

/** ANDed exact-match filters, e.g. { "Medium": "organic" }. @param {Schema} dal */
export function parseFilter(input = {}, dal) {
  assertPlainObject(input, 'Filter must be an object like { "Medium": "organic" }');
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => {
      const column = resolveColumn(key, 'Filter', dal);
      return [column.name, parseFilterValue(value, column)];
    }),
  );
}

function parseFilterValue(value, column) {
  if (value !== null && !['string', 'number', 'boolean'].includes(typeof value)) {
    throw new BadRequest(`Filter value for '${column.name}' must be a scalar`);
  }
  return value;
}

/** A whole number within [min, max]; `undefined`/`null` fall back to `fallback`. */
export function parseInteger(input, what, fallback, min, max) {
  if (input === undefined || input === null) return fallback;
  const value = typeof input === 'number' ? input : Number(input);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new BadRequest(`${what} must be a whole number between ${min} and ${max}`);
  }
  return value;
}
