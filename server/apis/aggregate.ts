import type { RequestHandler } from 'express';
import { withImageUrls } from '../data/images.ts';
import {
  AGGREGATE_FUNCTIONS,
  type AggregateFn,
  type AggregateQuery,
  type SalesDal,
} from '../data/sales-dal.ts';
import {
  assertPlainObject,
  BadRequest,
  caseInsensitiveField,
  parseFilter,
  parseInteger,
  parseSort,
  resolveColumn,
  resolveColumnName,
  type Schema,
} from './request-parsing.ts';

const MAX_LIMIT = 1000;

export function aggregateHandler(
  dal: SalesDal,
  imageBaseUrl: string,
): RequestHandler {
  return async (req, res) => {
    const query = parseAggregateRequest(req.body ?? {}, dal);
    const rows = await dal.aggregate(query);
    res.json({
      ...query,
      rowCount: rows.length,
      rows: rows.map((row) => withImageUrls(row, imageBaseUrl)),
    });
  };
}

export function parseAggregateRequest(
  body: unknown,
  dal: Schema,
): AggregateQuery {
  assertPlainObject(body, 'Body must be a JSON object');
  const field = caseInsensitiveField(body);
  const aggregateFn = parseAggregateFn(field('AggregateFn'));
  const fact = parseFact(field('Fact'), aggregateFn, dal);
  const dimensions = parseDimensions(field('Dimensions'), dal);
  const filter = parseFilter(field('Filter'), dal);
  const sort = parseSort(field('Sort'), (input, what) =>
    resolveSortColumn(input, what, dimensions, dal),
  );
  const limit = parseLimit(field('Limit'));
  return { fact, aggregateFn, dimensions, filter, sort, limit };
}

function resolveSortColumn(
  input: unknown,
  what: string,
  dimensions: string[],
  dal: Schema,
): string {
  if (typeof input === 'string' && input.toLowerCase() === 'value') {
    return 'value';
  }
  const name = resolveColumnName(input, what, dal);
  if (!dimensions.includes(name)) {
    throw new BadRequest(`${what} must be one of the dimensions or 'value'`);
  }
  return name;
}

function parseLimit(input: unknown): number | undefined {
  if (input === undefined || input === null) return undefined;
  return parseInteger(input, 'Limit', MAX_LIMIT, 1, MAX_LIMIT);
}

function parseAggregateFn(input: unknown): AggregateFn {
  const name = String(input ?? '').toLowerCase();
  const fn = AGGREGATE_FUNCTIONS.find((f) => f === name);
  if (!fn)
    throw new BadRequest(
      `AggregateFn must be one of: ${AGGREGATE_FUNCTIONS.join(', ')}`,
    );
  return fn;
}

function parseFact(
  input: unknown,
  aggregateFn: AggregateFn,
  dal: Schema,
): string {
  const column = resolveColumn(input, 'Fact', dal);
  if (aggregateFn !== 'count' && !column.numeric) {
    throw new BadRequest(
      `Fact '${column.name}' (${column.type}) is not numeric; only 'count' is allowed on it`,
    );
  }
  return column.name;
}

function parseDimensions(input: unknown, dal: Schema): string[] {
  if (!Array.isArray(input) || input.length < 1 || input.length > 2) {
    throw new BadRequest(
      'Dimensions must be an array with 1 or 2 column names',
    );
  }
  const names = input.map((d) => resolveColumnName(d, 'Dimensions', dal));
  if (new Set(names).size !== names.length)
    throw new BadRequest('Dimensions must be distinct');
  return names;
}
