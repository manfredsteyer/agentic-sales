# Agentic Sales

An Angular app that analyzes sales data with AI agents, built with [CopilotKit](https://copilotkit.ai) and AG-UI on the frontend and [Mastra](https://mastra.ai) on the agent side. It has three pages:

- **Home**: a chat with the sales agent. It answers with bar charts, pie charts and pivot tables, evaluates JSONata expressions on the data when a question needs more than one query, and can open a result in the Explorer.
- **Explorer**: an interactive aggregation of the data with a fact, an aggregate function, up to two dimensions and filters.
- **Dashboard**: charts and tables pinned from the chat. A second agent edits the tiles via the dashboard's shared state.

## Data

The app analyzes real purchases of the Google Merchandise Store from Google's public, obfuscated GA4 sample dataset in BigQuery (`bigquery-public-data.ga4_obfuscated_sample_ecommerce`), November 2020 to January 2021. The export ships as [`server/data/ga4-purchases.csv`](server/data/ga4-purchases.csv); the query that produced it is in [`server/data/ga4-export.sql`](server/data/ga4-export.sql). On start, the aggregation server loads the CSV into a local DuckDB database.

## Configuration

The agent needs an OpenAI API key. Copy the template to `.env` and fill it in:

```bash
cp .env.example .env
```

```dotenv
OPENAI_API_KEY=sk-...
```

`AGG_SERVER_URL` in the same file is optional. Set it only if the aggregation server runs somewhere other than `http://localhost:3000`.

## Running the app

There is a single `package.json` in the repo root. It holds the dependencies of the Angular app, the aggregation server and the Mastra agent, so one install is enough. The aggregation server is TypeScript that Node runs directly, so Node 22.18 or newer is required:

```bash
npm install
npm start
```

`npm start` runs three processes side by side:

| Process            | Port | Command          |
| ------------------ | ---- | ---------------- |
| Aggregation server | 3000 | `npm run server` |
| Mastra agent       | 4111 | `npm run agent`  |
| Angular dev server | 4200 | `npm run client` |

Then open [http://localhost:4200](http://localhost:4200). The browser talks to the aggregation server and the agent directly; both allow CORS requests from port 4200.

## Scripts

| Script                     | What it does                                                              |
| -------------------------- | ------------------------------------------------------------------------- |
| `npm start`, `npm run dev` | Starts server, agent and Angular dev server together                      |
| `npm run server`           | Imports the CSV into DuckDB (if needed) and starts the aggregation server |
| `npm run agent`            | Starts the Mastra dev server for the agents in `agent/src/mastra`         |
| `npm run client`           | Starts the Angular dev server                                             |
| `npm run build`            | Production build of the Angular app                                       |
| `npm test`                 | Unit tests of the Angular app                                             |
| `npm run server:typecheck` | Type-checks the aggregation server                                        |
| `npm run agent:typecheck`  | Type-checks the agent sources                                             |
| `npm run lint`             | Lints the Angular app, the agent and the server with ESLint               |
| `npm run format`           | Formats all files with Prettier and sorts imports                         |
| `npm run format:check`     | Checks that all files are formatted                                       |

A pre-commit hook (husky + lint-staged) formats all staged files with Prettier, so committed code is always formatted and has sorted imports.

## Project layout

```
agent/src/mastra   Mastra agents, their tools and the AG-UI route
agent/libs         Empty stand-in for @copilotkit/runtime (see below)
server/server.ts   Aggregation server: Express wiring and error mapping
server/apis        Its endpoints: request validation and handlers
server/data        DuckDB access, the import script, the GA4 export and the database
src/               Angular app
```

The aggregation server and the import script are TypeScript files without a build step: Node strips the types when it loads them, so `"type": "module"` in `package.json` marks them as ES modules. `npm run server:typecheck` runs the compiler over them.

The Mastra CLI is started from the repo root with `--dir agent/src/mastra`, so the agent resolves its packages from the root `node_modules` and writes its build output to `.mastra/` in the root, which is git-ignored.

`@ag-ui/mastra` declares `@copilotkit/runtime` as a peer dependency, but the agent never imports it: it serves AG-UI through its own Hono route. Installing the real runtime would pull in dozens of packages with conflicting `zod` peers, so an `overrides` entry in `package.json` points the peer to the empty package in `agent/libs/copilotkit-runtime-stub`.
