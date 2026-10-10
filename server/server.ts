import { existsSync } from 'node:fs';
import { join } from 'node:path';
import cors from 'cors';
import express, {
  type Express,
  type NextFunction,
  type Request,
  type RequestHandler,
  type Response,
} from 'express';
import { aggregateHandler } from './apis/aggregate.ts';
import { detailsHandler } from './apis/details.ts';
import { BadRequest } from './apis/request-parsing.ts';
import { schemaHandler } from './apis/schema.ts';
import { IMAGES_DIR } from './data/images.ts';
import { openSalesDal, type SalesDal } from './data/sales-dal.ts';

const PORT = Number(process.env.PORT ?? 3000);
const IMAGE_BASE_URL = `http://localhost:${PORT}/images`;
const DB_PATH =
  process.env.DB_PATH ?? join(import.meta.dirname, 'data', 'sales.duckdb');

if (!existsSync(DB_PATH)) {
  console.error(
    `No database at ${DB_PATH}. Run \`npm run import\` first (see server/data/import.ts).`,
  );
  process.exit(1);
}
const dal = await openSalesDal(DB_PATH);
const app = createApp(dal);
app.listen(PORT, () =>
  console.log(
    `Aggregation server: http://localhost:${PORT}  (QUERY /aggregate, QUERY /details, GET /schema)`,
  ),
);

function createApp(dal: SalesDal): Express {
  const app = express();
  configureMiddleware(app);
  registerRoutes(app, dal);
  registerErrorHandling(app);
  return app;
}

function configureMiddleware(app: Express) {
  app.use(cors({ methods: ['GET', 'POST', 'QUERY', 'OPTIONS'] }));
  app.use(express.json({ limit: '1mb', type: () => true }));
  app.set('json spaces', 2);
}

function registerRoutes(app: Express, dal: SalesDal) {
  app.get('/schema', schemaHandler(dal));
  registerQueryRoute(app, '/aggregate', aggregateHandler(dal, IMAGE_BASE_URL));
  registerQueryRoute(app, '/details', detailsHandler(dal, IMAGE_BASE_URL));
  app.use('/images', express.static(IMAGES_DIR));
}

function registerQueryRoute(
  app: Express,
  path: string,
  handler: RequestHandler,
) {
  app.query?.(path, handler);
  app.post(path, handler);
}

function registerErrorHandling(app: Express) {
  app.use((req: Request, res: Response) =>
    res.status(404).json({
      error: 'Not found. Use QUERY /aggregate, QUERY /details or GET /schema',
    }),
  );
  app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
    const message = clientErrorMessage(err);
    if (message) return res.status(400).json({ error: message });
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  });
}

function clientErrorMessage(err: unknown): string | undefined {
  if (err instanceof BadRequest) return err.message;
  const type = err instanceof Error && 'type' in err ? err.type : undefined;
  if (type === 'entity.parse.failed') return 'Body is not valid JSON';
  if (type === 'entity.too.large') return 'Body too large';
  return undefined;
}
