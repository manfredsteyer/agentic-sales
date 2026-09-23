// Parses and validates the body of a details request into a DetailsQuery the
// DAL can execute: which columns to return, the exact-match filters, the sort
// order and the page window. Filters use the same shape as /aggregate.
import { BadRequest, assertPlainObject, caseInsensitiveField, parseFilter, parseInteger, resolveColumn } from './request-parsing.mjs';

export const DEFAULT_LIMIT = 100;
export const MAX_LIMIT = 1000;
const MAX_OFFSET = Number.MAX_SAFE_INTEGER;

/**
 * @param {unknown} body
 * @param {import('./request-parsing.mjs').Schema} dal
 * @returns {import('./sales-dal.mjs').DetailsQuery}
 */
export function parseDetailsRequest(body, dal) {
  assertPlainObject(body, 'Body must be a JSON object');
  const field = caseInsensitiveField(body);
  const columns = parseColumns(field('Columns'), dal);
  const filter = parseFilter(field('Filter'), dal);
  const sort = parseSort(field('Sort'), dal);
  const limit = parseInteger(field('Limit'), 'Limit', DEFAULT_LIMIT, 1, MAX_LIMIT);
  const offset = parseInteger(field('Offset'), 'Offset', 0, 0, MAX_OFFSET);
  return { columns, filter, sort, limit, offset };
}

/** Omitted Columns means "the whole row". */
function parseColumns(input, dal) {
  if (input === undefined || input === null) return dal.columns.map((c) => c.name);
  if (!Array.isArray(input) || input.length === 0) {
    throw new BadRequest('Columns must be a non-empty array of column names, or omitted for all columns');
  }
  const names = input.map((c) => resolveColumn(c, 'Columns', dal).name);
  if (new Set(names).size !== names.length) throw new BadRequest('Columns must be distinct');
  return names;
}

/** Accepts "Revenue", { Column, Direction } or an array of either. */
function parseSort(input, dal) {
  if (input === undefined || input === null) return [];
  const entries = Array.isArray(input) ? input : [input];
  return entries.map((entry) => parseSortEntry(entry, dal));
}

function parseSortEntry(entry, dal) {
  if (typeof entry === 'string') return { column: resolveColumn(entry, 'Sort', dal).name, direction: 'asc' };
  assertPlainObject(entry, 'Sort entries must be a column name or { "Column": "Revenue", "Direction": "desc" }');
  const field = caseInsensitiveField(entry);
  const column = resolveColumn(field('Column'), 'Sort Column', dal).name;
  return { column, direction: parseDirection(field('Direction')) };
}

function parseDirection(input) {
  const direction = String(input ?? 'asc').toLowerCase();
  if (direction !== 'asc' && direction !== 'desc') throw new BadRequest("Sort Direction must be 'asc' or 'desc'");
  return direction;
}
