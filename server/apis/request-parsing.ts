import type {
  Column,
  Filter,
  FilterValue,
  SalesDal,
} from '../data/sales-dal.ts';

export class BadRequest extends Error {}

export type Schema = Pick<SalesDal, 'columns' | 'findColumn'>;

export function assertPlainObject(
  value: unknown,
  message: string,
): asserts value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new BadRequest(message);
  }
}

export function caseInsensitiveField(body: Record<string, unknown>) {
  return (key: string) =>
    body[key] ??
    body[key[0].toLowerCase() + key.slice(1)] ??
    body[key.toLowerCase()];
}

export function resolveColumn(
  input: unknown,
  what: string,
  dal: Schema,
): Column {
  if (typeof input !== 'string')
    throw new BadRequest(`${what} must be a string`);
  const column = dal.findColumn(input);
  if (!column) {
    const available = dal.columns.map((c) => c.name).join(', ');
    throw new BadRequest(
      `Unknown column '${input}' for ${what}. Available: ${available}`,
    );
  }
  return column;
}

export function resolveColumnName(
  input: unknown,
  what: string,
  dal: Schema,
): string {
  const column = resolveColumn(input, what, dal);
  return column.name;
}

export function parseFilter(input: unknown = {}, dal: Schema): Filter {
  assertPlainObject(
    input,
    'Filter must be an object like { "Medium": "organic" }',
  );
  const entries = Object.entries(input).map(([key, value]) =>
    parseFilterEntry(key, value, dal),
  );
  return Object.fromEntries(entries);
}

function parseFilterEntry(
  key: string,
  value: unknown,
  dal: Schema,
): [string, FilterValue] {
  const column = resolveColumn(key, 'Filter', dal);
  return [column.name, parseFilterValue(value, column)];
}

function parseFilterValue(value: unknown, column: Column): FilterValue {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }
  throw new BadRequest(`Filter value for '${column.name}' must be a scalar`);
}

export function parseInteger(
  input: unknown,
  what: string,
  fallback: number,
  min: number,
  max: number,
): number {
  if (input === undefined || input === null) return fallback;
  const value = typeof input === 'number' ? input : Number(input);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new BadRequest(
      `${what} must be a whole number between ${min} and ${max}`,
    );
  }
  return value;
}
