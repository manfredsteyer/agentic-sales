// Parses and validates the body of an aggregate request into an AggregateQuery
// the DAL can execute. Identifier resolution, filters and the BadRequest type
// live in request-parsing.mjs and are shared with the details request.
import { AGGREGATE_FUNCTIONS } from './sales-dal.mjs';
import { BadRequest, assertPlainObject, caseInsensitiveField, parseFilter, resolveColumn } from './request-parsing.mjs';

/**
 * @param {unknown} body
 * @param {import('./request-parsing.mjs').Schema} dal
 * @returns {import('./sales-dal.mjs').AggregateQuery}
 */
export function parseAggregateRequest(body, dal) {
  assertPlainObject(body, 'Body must be a JSON object');
  const field = caseInsensitiveField(body);
  const aggregateFn = parseAggregateFn(field('AggregateFn'));
  const fact = parseFact(field('Fact'), aggregateFn, dal);
  const dimensions = parseDimensions(field('Dimensions'), dal);
  const filter = parseFilter(field('Filter'), dal);
  return { fact, aggregateFn, dimensions, filter };
}

function parseAggregateFn(input) {
  const fn = String(input ?? '').toLowerCase();
  if (!AGGREGATE_FUNCTIONS.includes(fn)) {
    throw new BadRequest(`AggregateFn must be one of: ${AGGREGATE_FUNCTIONS.join(', ')}`);
  }
  return fn;
}

function parseFact(input, aggregateFn, dal) {
  const column = resolveColumn(input, 'Fact', dal);
  if (aggregateFn !== 'count' && !column.numeric) {
    throw new BadRequest(`Fact '${column.name}' (${column.type}) is not numeric; only 'count' is allowed on it`);
  }
  return column.name;
}

function parseDimensions(input, dal) {
  if (!Array.isArray(input) || input.length < 1 || input.length > 2) {
    throw new BadRequest('Dimensions must be an array with 1 or 2 column names');
  }
  const names = input.map((d) => resolveColumn(d, 'Dimensions', dal).name);
  if (new Set(names).size !== names.length) throw new BadRequest('Dimensions must be distinct');
  return names;
}
