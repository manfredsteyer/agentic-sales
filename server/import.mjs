// Loads the flattened GA4 purchase export (see ga4-export.sql) into the DuckDB
// database the server reads (server/data/sales.duckdb, table "sales").
//
//   npm run import                         # server/data/ga4-purchases.csv
//   npm run import -- path/to/other.csv    # any CSV with the same columns
//
// On top of the exported columns, the import
// - trims text and turns empty values into '(not set)', GA4's own label for
//   missing values,
// - drops lines without any item data (in the sample: whole orders that
//   consist of a single empty line),
// - adds the time columns Month, Week (ISO), Weekday and Hour,
// - adds bands per order (OrderSize, OrderValue) and per visitor (VisitorType,
//   TimeToPurchase), so the aggregation API can group and filter by them.
// Bands carry a number prefix where needed ("2 1-7 days"), so sorting by the
// label keeps their natural order. Order bands repeat on every line of an order.
//
// Rows are stored sorted by Date: DuckDB keeps min/max statistics (zonemaps)
// per storage block, and sorted data lets filters on Date, Month and Week skip
// whole blocks.
// The database is built next to the target and then swapped in, so a running
// server keeps reading its old file until it restarts.
import { DuckDBInstance } from '@duckdb/node-api';
import { existsSync, renameSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), 'data');
const CSV_PATH = resolve(process.argv[2] ?? join(DATA_DIR, 'ga4-purchases.csv'));
const DB_PATH = process.env.DB_PATH ?? join(DATA_DIR, 'sales.duckdb');
const TMP_PATH = `${DB_PATH}.tmp`;
const TABLE = 'sales';

// Explicit instead of sniffed: GA4 transaction ids are numeric and would
// otherwise become a fact column. A column missing in the CSV fails the import.
const CSV_TYPES = {
  Date: 'DATE', Timestamp: 'TIMESTAMP', TransactionId: 'VARCHAR',
  SessionNumber: 'BIGINT', DaysSinceFirstVisit: 'BIGINT',
  Continent: 'VARCHAR', SubContinent: 'VARCHAR', Country: 'VARCHAR',
  Region: 'VARCHAR', City: 'VARCHAR',
  Medium: 'VARCHAR', Source: 'VARCHAR', Campaign: 'VARCHAR',
  DeviceCategory: 'VARCHAR', OperatingSystem: 'VARCHAR', OperatingSystemVersion: 'VARCHAR',
  Browser: 'VARCHAR', Language: 'VARCHAR', MobileBrand: 'VARCHAR', MobileModel: 'VARCHAR',
  ItemCategory: 'VARCHAR', ItemBrand: 'VARCHAR', ItemName: 'VARCHAR',
  ItemVariant: 'VARCHAR', PromotionName: 'VARCHAR',
  Quantity: 'BIGINT', Price: 'DOUBLE', Revenue: 'DOUBLE',
};

if (!existsSync(CSV_PATH)) {
  console.error(`No export at ${CSV_PATH}.\nExport the sales data from BigQuery first, see "Sales data" in README.md.`);
  process.exit(1);
}

removeDatabase(TMP_PATH);
let summary;
try {
  summary = await buildDatabase(TMP_PATH);
} catch (err) {
  removeDatabase(TMP_PATH);
  throw err;
}
removeDatabase(DB_PATH);
renameSync(TMP_PATH, DB_PATH);
const { rows, orders, first, last, revenue, offDay } = summary;
console.log(`Imported ${CSV_PATH}\n  → ${DB_PATH}: ${rows} item lines, ${orders} orders, ${first} to ${last}, revenue ${revenue}`);
if (offDay > 0) {
  console.warn(`  ! ${offDay} rows have a Timestamp on another day than Date – check the time zone in ga4-export.sql`);
}

async function buildDatabase(path) {
  const instance = await DuckDBInstance.create(path);
  const connection = await instance.connect();
  await connection.run(createTableSql());
  const summary = await connection.runAndReadAll(`
    SELECT CAST(COUNT(*) AS INTEGER) AS rows, CAST(COUNT(DISTINCT TransactionId) AS INTEGER) AS orders,
           MIN(Date) AS first, MAX(Date) AS last, ROUND(SUM(Revenue), 2) AS revenue,
           CAST(COUNT(*) FILTER (WHERE CAST(Timestamp AS DATE) <> Date) AS INTEGER) AS offDay
    FROM ${TABLE}`);
  await connection.run('CHECKPOINT');
  connection.closeSync();
  instance.closeSync();
  return summary.getRowObjectsJson()[0];
}

function createTableSql() {
  const notSet = Object.entries(CSV_TYPES)
    .filter(([, type]) => type === 'VARCHAR')
    .map(([name]) => `COALESCE(NULLIF(TRIM("${name}"), ''), '(not set)') AS "${name}"`);
  return `
    CREATE TABLE ${TABLE} AS
    WITH lines AS (
      SELECT * REPLACE (${notSet.join(', ')})
      FROM read_csv(${quoteString(CSV_PATH)}, header = true, types = ${structLiteral(CSV_TYPES)})
      WHERE Quantity IS NOT NULL OR Price IS NOT NULL OR Revenue IS NOT NULL
    ),
    with_order_totals AS (
      SELECT *, SUM(Quantity) OVER per_order AS order_quantity, SUM(Revenue) OVER per_order AS order_revenue
      FROM lines
      WINDOW per_order AS (PARTITION BY TransactionId)
    )
    SELECT
      Date,
      strftime(Date, '%Y-%m') AS Month,
      strftime(Date, '%G-W%V') AS Week,
      isodow(Date) || ' ' || strftime(Date, '%a') AS Weekday,
      strftime(Timestamp, '%H') AS Hour,
      Timestamp,
      TransactionId,
      CASE WHEN order_quantity IS NULL THEN '(not set)'
           WHEN order_quantity <= 1 THEN '1 item'
           WHEN order_quantity <= 3 THEN '2-3 items'
           ELSE '4+ items' END AS OrderSize,
      CASE WHEN order_revenue IS NULL THEN '(not set)'
           WHEN order_revenue < 25 THEN '1 under 25 USD'
           WHEN order_revenue < 100 THEN '2 25-99 USD'
           WHEN order_revenue < 250 THEN '3 100-249 USD'
           ELSE '4 250+ USD' END AS OrderValue,
      CASE WHEN SessionNumber IS NULL THEN '(not set)'
           WHEN SessionNumber = 1 THEN 'first visit'
           ELSE 'returning' END AS VisitorType,
      CASE WHEN DaysSinceFirstVisit IS NULL THEN '(not set)'
           WHEN DaysSinceFirstVisit <= 0 THEN '1 same day'
           WHEN DaysSinceFirstVisit <= 7 THEN '2 1-7 days'
           WHEN DaysSinceFirstVisit <= 30 THEN '3 8-30 days'
           ELSE '4 31+ days' END AS TimeToPurchase,
      * EXCLUDE (Date, Timestamp, TransactionId, order_quantity, order_revenue)
    FROM with_order_totals
    ORDER BY Date, Timestamp, TransactionId`;
}

function removeDatabase(path) {
  rmSync(path, { force: true });
  rmSync(`${path}.wal`, { force: true });
}

function structLiteral(record) {
  return `{${Object.entries(record).map(([k, v]) => `${quoteString(k)}: ${quoteString(v)}`).join(', ')}}`;
}

function quoteString(value) {
  return `'${value.replaceAll("'", "''")}'`;
}
