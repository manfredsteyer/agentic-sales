import type { RequestHandler } from 'express';
import type { DetailsQuery, SalesDal, SortSpec } from '../data/sales-dal.ts';
import {
  assertPlainObject,
  BadRequest,
  caseInsensitiveField,
  parseFilter,
  parseInteger,
  resolveColumnName,
  type Schema,
} from './request-parsing.ts';

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 1000;
const MAX_OFFSET = Number.MAX_SAFE_INTEGER;

export function detailsHandler(dal: SalesDal): RequestHandler {
  return async (req, res) => {
    const query = parseDetailsRequest(req.body ?? {}, dal);
    const { rows, totalCount } = await dal.details(query);
    res.json({ ...query, rowCount: rows.length, totalCount, rows });
  };
}

export function parseDetailsRequest(body: unknown, dal: Schema): DetailsQuery {
  assertPlainObject(body, 'Body must be a JSON object');
  const field = caseInsensitiveField(body);
  const columns = parseColumns(field('Columns'), dal);
  const filter = parseFilter(field('Filter'), dal);
  const sort = parseSort(field('Sort'), dal);
  const limit = parseInteger(
    field('Limit'),
    'Limit',
    DEFAULT_LIMIT,
    1,
    MAX_LIMIT,
  );
  const offset = parseInteger(field('Offset'), 'Offset', 0, 0, MAX_OFFSET);
  return { columns, filter, sort, limit, offset };
}

function parseColumns(input: unknown, dal: Schema): string[] {
  if (input === undefined || input === null)
    return dal.columns.map((c) => c.name);
  if (!Array.isArray(input) || input.length === 0) {
    throw new BadRequest(
      'Columns must be a non-empty array of column names, or omitted for all columns',
    );
  }
  const names = input.map((c) => resolveColumnName(c, 'Columns', dal));
  if (new Set(names).size !== names.length)
    throw new BadRequest('Columns must be distinct');
  return names;
}

function parseSort(input: unknown, dal: Schema): SortSpec[] {
  if (input === undefined || input === null) return [];
  const entries: unknown[] = Array.isArray(input) ? input : [input];
  return entries.map((entry) => parseSortEntry(entry, dal));
}

function parseSortEntry(entry: unknown, dal: Schema): SortSpec {
  if (typeof entry === 'string') {
    return { column: resolveColumnName(entry, 'Sort', dal), direction: 'asc' };
  }
  assertPlainObject(
    entry,
    'Sort entries must be a column name or { "Column": "Revenue", "Direction": "desc" }',
  );
  const field = caseInsensitiveField(entry);
  const column = resolveColumnName(field('Column'), 'Sort Column', dal);
  return { column, direction: parseDirection(field('Direction')) };
}

function parseDirection(input: unknown): SortSpec['direction'] {
  const direction = String(input ?? 'asc').toLowerCase();
  if (direction !== 'asc' && direction !== 'desc') {
    throw new BadRequest("Sort Direction must be 'asc' or 'desc'");
  }
  return direction;
}
