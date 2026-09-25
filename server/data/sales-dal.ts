import {
  DuckDBConnection,
  DuckDBInstance,
  type DuckDBValue,
  type Json,
} from '@duckdb/node-api';
import { COLUMN_DESCRIPTIONS } from './column-descriptions.ts';

const NUMERIC_TYPE =
  /^(TINYINT|SMALLINT|INTEGER|BIGINT|HUGEINT|UTINYINT|USMALLINT|UINTEGER|UBIGINT|FLOAT|DOUBLE|DECIMAL)/;
const MAX_LISTED_VALUES = 30;
const EXAMPLE_COUNT = 5;
const PLACEHOLDERS = ['(not set)', '<Other>', '(data deleted)'];

export const AGGREGATE_FUNCTIONS = ['avg', 'sum', 'count'] as const;
const AGGREGATE_SQL: Record<AggregateFn, string> = {
  avg: 'AVG',
  sum: 'SUM',
  count: 'COUNT',
};

export type AggregateFn = (typeof AGGREGATE_FUNCTIONS)[number];
export type FilterValue = string | number | boolean | null;
export type Filter = Record<string, FilterValue>;
export type Row = Record<string, Json>;
type Params = Record<string, DuckDBValue>;
type FindColumn = (name: string) => Column | undefined;

export interface Column {
  name: string;
  type: string;
  numeric: boolean;
  description?: string;
  distinctCount?: number;
  values?: string[];
  examples?: string[];
}

export interface AggregateQuery {
  fact: string;
  aggregateFn: AggregateFn;
  dimensions: string[];
  filter: Filter;
}

export interface SortSpec {
  column: string;
  direction: 'asc' | 'desc';
}

export interface DetailsQuery {
  columns: string[];
  filter: Filter;
  sort: SortSpec[];
  limit: number;
  offset: number;
}

export interface DetailsResult {
  rows: Row[];
  totalCount: number;
}

export interface SalesDal {
  table: string;
  columns: Column[];
  findColumn: FindColumn;
  aggregate: (query: AggregateQuery) => Promise<Row[]>;
  details: (query: DetailsQuery) => Promise<DetailsResult>;
}

export async function openSalesDal(
  dbPath: string,
  table = 'sales',
): Promise<SalesDal> {
  const connection = await openReadOnlyConnection(dbPath);
  const columns = await readColumns(connection, table);
  const findColumn: FindColumn = (name) =>
    columns.find((c) => c.name.toLowerCase() === name.toLowerCase());
  return {
    table,
    columns,
    findColumn,
    aggregate: (query) => runAggregate(connection, table, findColumn, query),
    details: (query) => runDetails(connection, table, findColumn, query),
  };
}

async function openReadOnlyConnection(
  dbPath: string,
): Promise<DuckDBConnection> {
  const instance = await DuckDBInstance.create(dbPath, {
    access_mode: 'READ_ONLY',
  });
  const connection = await instance.connect();
  await connection.run(
    'SET enable_external_access = false; SET lock_configuration = true;',
  );
  return connection;
}

async function readColumns(
  connection: DuckDBConnection,
  table: string,
): Promise<Column[]> {
  const reader = await connection.runAndReadAll(
    `DESCRIBE ${quoteIdent(table)}`,
  );
  const rows = reader.getRowObjectsJson();
  const columns = rows.map(toColumn);
  return Promise.all(
    columns.map((column) => withValues(connection, table, column)),
  );
}

function toColumn(row: Row): Column {
  const name = String(row.column_name);
  const type = String(row.column_type);
  return {
    name,
    type,
    numeric: NUMERIC_TYPE.test(type),
    description: COLUMN_DESCRIPTIONS[name],
  };
}

async function withValues(
  connection: DuckDBConnection,
  table: string,
  column: Column,
): Promise<Column> {
  if (column.type !== 'VARCHAR') {
    return column;
  }
  const columnSql = quoteIdent(column.name);
  const tableSql = quoteIdent(table);
  const counted = await readFirstRow(
    connection,
    `SELECT CAST(COUNT(DISTINCT ${columnSql}) AS INTEGER) AS n FROM ${tableSql}`,
  );
  const distinctCount = Number(counted.n);
  if (distinctCount <= MAX_LISTED_VALUES) {
    const values = await readValues(
      connection,
      `SELECT DISTINCT ${columnSql} AS value FROM ${tableSql} ORDER BY value`,
    );
    return { ...column, distinctCount, values };
  }
  const placeholdersSql = PLACEHOLDERS.map(quoteString).join(', ');
  const examples = await readValues(
    connection,
    `SELECT ${columnSql} AS value FROM ${tableSql} WHERE ${columnSql} NOT IN (${placeholdersSql}) ` +
      `GROUP BY value ORDER BY COUNT(*) DESC, value LIMIT ${EXAMPLE_COUNT}`,
  );
  return { ...column, distinctCount, examples };
}

async function readFirstRow(
  connection: DuckDBConnection,
  sql: string,
  params?: Params,
): Promise<Row> {
  const reader = await connection.runAndReadAll(sql, params);
  const rows = reader.getRowObjectsJson();
  return rows[0];
}

async function readValues(
  connection: DuckDBConnection,
  sql: string,
): Promise<string[]> {
  const reader = await connection.runAndReadAll(sql);
  const rows = reader.getRowObjectsJson();
  return rows.map((row) => String(row.value));
}

async function runAggregate(
  connection: DuckDBConnection,
  table: string,
  findColumn: FindColumn,
  query: AggregateQuery,
): Promise<Row[]> {
  const { sql, params } = buildAggregateSql(table, findColumn, query);
  const reader = await connection.runAndReadAll(sql, params);
  return reader.getRowObjectsJson();
}

function buildAggregateSql(
  table: string,
  findColumn: FindColumn,
  { fact, aggregateFn, dimensions, filter }: AggregateQuery,
) {
  const fn = AGGREGATE_SQL[aggregateFn];
  const factSql = quoteColumn(findColumn, fact);
  const dimSql = dimensions.map((d) => quoteColumn(findColumn, d)).join(', ');
  const { whereSql, params } = buildWhereClause(findColumn, filter);
  const sql =
    `SELECT ${dimSql}, CAST(${fn}(${factSql}) AS DOUBLE) AS value ` +
    `FROM ${quoteIdent(table)}${whereSql} GROUP BY ${dimSql} ORDER BY ${dimSql}`;
  return { sql, params };
}

async function runDetails(
  connection: DuckDBConnection,
  table: string,
  findColumn: FindColumn,
  query: DetailsQuery,
): Promise<DetailsResult> {
  const { whereSql, params } = buildWhereClause(findColumn, query.filter);
  const { sql, params: pageParams } = buildDetailsSql(
    table,
    findColumn,
    query,
    whereSql,
    params,
  );
  const countSql = `SELECT CAST(COUNT(*) AS INTEGER) AS total FROM ${quoteIdent(table)}${whereSql}`;
  const [page, total] = await Promise.all([
    connection.runAndReadAll(sql, pageParams),
    readFirstRow(connection, countSql, params),
  ]);
  return { rows: page.getRowObjectsJson(), totalCount: Number(total.total) };
}

function buildDetailsSql(
  table: string,
  findColumn: FindColumn,
  { columns, sort, limit, offset }: DetailsQuery,
  whereSql: string,
  filterParams: Params,
) {
  const selectSql = columns
    .map((c) => selectColumnSql(findColumn, c))
    .join(', ');
  const orderSql = sort.length
    ? ` ORDER BY ${sort.map((s) => orderTermSql(findColumn, s)).join(', ')}`
    : '';
  return {
    sql: `SELECT ${selectSql} FROM ${quoteIdent(table)}${whereSql}${orderSql} LIMIT $limit OFFSET $offset`,
    params: { ...filterParams, limit, offset },
  };
}

function orderTermSql(
  findColumn: FindColumn,
  { column, direction }: SortSpec,
): string {
  return `${quoteColumn(findColumn, column)} ${direction === 'desc' ? 'DESC' : 'ASC'}`;
}

function buildWhereClause(findColumn: FindColumn, filter: Filter) {
  const conditions: string[] = [];
  const params: Params = {};
  Object.entries(filter).forEach(([column, value], i) => {
    const columnSql = quoteColumn(findColumn, column);
    if (value === null) {
      conditions.push(`${columnSql} IS NULL`);
    } else {
      conditions.push(`${columnSql} = $f${i}`);
      params[`f${i}`] = value;
    }
  });
  const whereSql = conditions.length
    ? ` WHERE ${conditions.join(' AND ')}`
    : '';
  return { whereSql, params };
}

function selectColumnSql(findColumn: FindColumn, name: string): string {
  const column = requireColumn(findColumn, name);
  const columnSql = quoteIdent(column.name);
  return column.numeric
    ? `CAST(${columnSql} AS DOUBLE) AS ${columnSql}`
    : columnSql;
}

function quoteColumn(findColumn: FindColumn, name: string): string {
  const column = requireColumn(findColumn, name);
  return quoteIdent(column.name);
}

function requireColumn(findColumn: FindColumn, name: string): Column {
  const column = findColumn(name);
  if (!column) throw new Error(`Unknown column '${name}'`);
  return column;
}

function quoteIdent(name: string): string {
  return `"${name.replaceAll('"', '""')}"`;
}

function quoteString(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}
