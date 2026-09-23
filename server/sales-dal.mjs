// Data access layer: queries the DuckDB database built by import.mjs.
//
// The database file is opened read-only; the server never writes to it.
// Owns the connection, exposes the table schema (the identifier allowlist)
// and runs aggregate and detail queries. Callers pass already resolved, canonical column
// names; identifiers are still validated against the schema and double-quoted
// here, filter values are always bound as prepared-statement parameters.
import { DuckDBInstance } from '@duckdb/node-api';
import { COLUMN_DESCRIPTIONS } from './column-descriptions.mjs';

const NUMERIC_TYPE = /^(TINYINT|SMALLINT|INTEGER|BIGINT|HUGEINT|UTINYINT|USMALLINT|UINTEGER|UBIGINT|FLOAT|DOUBLE|DECIMAL)/;
const AGGREGATE_SQL = { avg: 'AVG', sum: 'SUM', count: 'COUNT' };
const MAX_LISTED_VALUES = 30;
const EXAMPLE_COUNT = 5;
const PLACEHOLDERS = ['(not set)', '<Other>', '(data deleted)'];

export const AGGREGATE_FUNCTIONS = Object.keys(AGGREGATE_SQL);

/**
 * @typedef {{ name: string, type: string, numeric: boolean, description?: string, distinctCount?: number, values?: string[], examples?: string[] }} Column
 * @typedef {{ fact: string, aggregateFn: 'avg'|'sum'|'count', dimensions: string[], filter: Record<string, string|number|boolean|null> }} AggregateQuery
 * @typedef {{ column: string, direction: 'asc'|'desc' }} SortSpec
 * @typedef {{ columns: string[], filter: Record<string, string|number|boolean|null>, sort: SortSpec[], limit: number, offset: number }} DetailsQuery
 */

export async function openSalesDal(dbPath, table = 'sales') {
  const connection = await openReadOnlyConnection(dbPath);
  const columns = await readColumns(connection, table);
  const findColumn = (name) => columns.find((c) => c.name.toLowerCase() === String(name).toLowerCase());
  return {
    table,
    columns,
    findColumn,
    /** @param {AggregateQuery} query */
    aggregate: (query) => runAggregate(connection, table, findColumn, query),
    /** @param {DetailsQuery} query */
    details: (query) => runDetails(connection, table, findColumn, query),
  };
}

// Once open, DuckDB may not touch any other file (no read_csv, ATTACH, COPY)
// and the configuration can no longer be changed.
async function openReadOnlyConnection(dbPath) {
  const instance = await DuckDBInstance.create(dbPath, { access_mode: 'READ_ONLY' });
  const connection = await instance.connect();
  await connection.run('SET enable_external_access = false; SET lock_configuration = true;');
  return connection;
}

/** @returns {Promise<Column[]>} */
async function readColumns(connection, table) {
  const reader = await connection.runAndReadAll(`DESCRIBE ${quoteIdent(table)}`);
  const columns = reader.getRowObjectsJson().map((row) => ({
    name: String(row.column_name),
    type: String(row.column_type),
    numeric: NUMERIC_TYPE.test(String(row.column_type)),
    description: COLUMN_DESCRIPTIONS[String(row.column_name)],
  }));
  return Promise.all(columns.map((column) => withValues(connection, table, column)));
}

/** @returns {Promise<Column>} */
async function withValues(connection, table, column) {
  if (column.type !== 'VARCHAR') {
    return column;
  }
  const columnSql = quoteIdent(column.name);
  const tableSql = quoteIdent(table);
  const counted = await connection.runAndReadAll(
    `SELECT CAST(COUNT(DISTINCT ${columnSql}) AS INTEGER) AS n FROM ${tableSql}`,
  );
  const distinctCount = Number(counted.getRowObjectsJson()[0].n);
  if (distinctCount <= MAX_LISTED_VALUES) {
    const values = await readValues(connection, `SELECT DISTINCT ${columnSql} AS value FROM ${tableSql} ORDER BY value`);
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

async function readValues(connection, sql) {
  const reader = await connection.runAndReadAll(sql);
  return reader.getRowObjectsJson().map((row) => String(row.value));
}

async function runAggregate(connection, table, findColumn, query) {
  const { sql, params } = buildAggregateSql(table, findColumn, query);
  const reader = await connection.runAndReadAll(sql, params);
  return reader.getRowObjectsJson();
}

function buildAggregateSql(table, findColumn, { fact, aggregateFn, dimensions, filter }) {
  const fn = AGGREGATE_SQL[aggregateFn];
  if (!fn) throw new Error(`Unsupported aggregate function '${aggregateFn}'`);
  const factSql = quoteColumn(findColumn, fact);
  const dimSql = dimensions.map((d) => quoteColumn(findColumn, d)).join(', ');
  const { whereSql, params } = buildWhereClause(findColumn, filter);
  const sql =
    `SELECT ${dimSql}, CAST(${fn}(${factSql}) AS DOUBLE) AS value ` +
    `FROM ${quoteIdent(table)}${whereSql} GROUP BY ${dimSql} ORDER BY ${dimSql}`;
  return { sql, params };
}

// One page of raw rows plus the total number of matching rows, so callers can
// tell how much the limit cut off. Both queries share the same WHERE clause.
async function runDetails(connection, table, findColumn, query) {
  const { whereSql, params } = buildWhereClause(findColumn, query.filter);
  const { sql, params: pageParams } = buildDetailsSql(table, findColumn, query, whereSql, params);
  const [page, total] = await Promise.all([
    connection.runAndReadAll(sql, pageParams),
    connection.runAndReadAll(`SELECT CAST(COUNT(*) AS INTEGER) AS total FROM ${quoteIdent(table)}${whereSql}`, params),
  ]);
  return { rows: page.getRowObjectsJson(), totalCount: Number(total.getRowObjectsJson()[0].total) };
}

function buildDetailsSql(table, findColumn, { columns, sort, limit, offset }, whereSql, filterParams) {
  const selectSql = columns.map((c) => selectColumnSql(findColumn, c)).join(', ');
  const orderSql = sort.length
    ? ` ORDER BY ${sort.map((s) => `${quoteColumn(findColumn, s.column)} ${s.direction === 'desc' ? 'DESC' : 'ASC'}`).join(', ')}`
    : '';
  return {
    sql: `SELECT ${selectSql} FROM ${quoteIdent(table)}${whereSql}${orderSql} LIMIT $limit OFFSET $offset`,
    params: { ...filterParams, limit, offset },
  };
}

function buildWhereClause(findColumn, filter = {}) {
  const conditions = [];
  const params = {};
  Object.entries(filter).forEach(([column, value], i) => {
    const columnSql = quoteColumn(findColumn, column);
    if (value === null) {
      conditions.push(`${columnSql} IS NULL`);
    } else {
      conditions.push(`${columnSql} = $f${i}`); // value is bound, never inlined
      params[`f${i}`] = value;
    }
  });
  const whereSql = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
  return { whereSql, params };
}

// DuckDB serializes BIGINT as a JSON string; DOUBLE keeps numbers numeric,
// just like the value column of an aggregate.
function selectColumnSql(findColumn, name) {
  const columnSql = quoteColumn(findColumn, name);
  return findColumn(name).numeric ? `CAST(${columnSql} AS DOUBLE) AS ${columnSql}` : columnSql;
}

function quoteColumn(findColumn, name) {
  const column = findColumn(name);
  if (!column) throw new Error(`Unknown column '${name}'`);
  return quoteIdent(column.name);
}

function quoteIdent(name) {
  return `"${name.replaceAll('"', '""')}"`;
}

function quoteString(value) {
  return `'${value.replaceAll("'", "''")}'`;
}
