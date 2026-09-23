// Aggregation server over the DuckDB database server/data/sales.duckdb
// (built by `npm run import` from the GA4 export, see ga4-export.sql).
//
// QUERY /aggregate   body: {
//   "Fact": "Revenue",             // column to aggregate
//   "AggregateFn": "avg|sum|count",
//   "Dimensions": ["Country"],     // 1–2 group-by columns
//   "Filter": { "Medium": "cpc" }  // optional, ANDed equality filters
// }
// QUERY /details     body: {
//   "Columns": ["Date", "ItemName", "Revenue"],       // optional, default: all
//   "Filter": { "Country": "Germany" },               // optional, as above
//   "Sort": [{ "Column": "Revenue", "Direction": "desc" }],  // optional
//   "Limit": 100, "Offset": 0                         // optional page window
// }
// GET   /schema      → columns of the table
//
// Layers:
//   server.mjs            HTTP wiring (Express, CORS, JSON, error mapping)
//   aggregate-request.mjs body validation → AggregateQuery
//   details-request.mjs   body validation → DetailsQuery
//   request-parsing.mjs   validation shared by both (column allowlist, filters)
//   sales-dal.mjs         read-only DuckDB, SQL building, parameter binding
import express from 'express';
import cors from 'cors';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { openSalesDal } from './sales-dal.mjs';
import { BadRequest } from './request-parsing.mjs';
import { parseAggregateRequest } from './aggregate-request.mjs';
import { parseDetailsRequest } from './details-request.mjs';

const PORT = Number(process.env.PORT ?? 3000);
const DB_PATH = process.env.DB_PATH ?? join(dirname(fileURLToPath(import.meta.url)), 'data', 'sales.duckdb');

if (!existsSync(DB_PATH)) {
  console.error(`No database at ${DB_PATH}. Run \`npm run import\` first (see server/import.mjs).`);
  process.exit(1);
}
const dal = await openSalesDal(DB_PATH);
const app = createApp(dal);
app.listen(PORT, () =>
  console.log(`Aggregation server: http://localhost:${PORT}  (QUERY /aggregate, QUERY /details, GET /schema)`),
);

function createApp(dal) {
  const app = express();
  configureMiddleware(app);
  registerRoutes(app, dal);
  registerErrorHandling(app);
  return app;
}

function configureMiddleware(app) {
  app.use(cors({ methods: ['GET', 'POST', 'QUERY', 'OPTIONS'] }));
  app.use(express.json({ limit: '1mb', type: () => true }));
  app.set('json spaces', 2);
}

function registerRoutes(app, dal) {
  app.get('/schema', (req, res) => res.json({ table: dal.table, columns: dal.columns }));
  // POST is the fallback for clients that cannot send the QUERY verb.
  for (const method of ['query', 'post']) {
    app[method]('/aggregate', aggregateHandler(dal));
    app[method]('/details', detailsHandler(dal));
  }
}

function aggregateHandler(dal) {
  return async (req, res) => {
    const query = parseAggregateRequest(req.body ?? {}, dal);
    const rows = await dal.aggregate(query);
    res.json({ ...query, rowCount: rows.length, rows });
  };
}

/** Raw rows for drill-down; rowCount is this page, totalCount all matches. */
function detailsHandler(dal) {
  return async (req, res) => {
    const query = parseDetailsRequest(req.body ?? {}, dal);
    const { rows, totalCount } = await dal.details(query);
    res.json({ ...query, rowCount: rows.length, totalCount, rows });
  };
}

function registerErrorHandling(app) {
  app.use((req, res) =>
    res.status(404).json({ error: 'Not found. Use QUERY /aggregate, QUERY /details or GET /schema' }),
  );
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    const message = clientErrorMessage(err);
    if (message) return res.status(400).json({ error: message });
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });
}

/** Maps errors caused by the client to a message; returns undefined for server errors. */
function clientErrorMessage(err) {
  if (err instanceof BadRequest) return err.message;
  if (err.type === 'entity.parse.failed') return 'Body is not valid JSON';
  if (err.type === 'entity.too.large') return 'Body too large';
  return undefined;
}
