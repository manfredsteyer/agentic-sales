# Agentic Sales

An Angular app that analyzes sales data with AI agents, built with [CopilotKit](https://copilotkit.ai) and AG-UI on the frontend and [Mastra](https://mastra.ai) on the agent side. It has three pages:

## Data

The app analyzes real purchases of the Google Merchandise Store from Google's public, obfuscated GA4 sample dataset in BigQuery (`bigquery-public-data.ga4_obfuscated_sample_ecommerce`), November 2020 to January 2021. The export ships as [`server/data/ga4-purchases.csv`](server/data/ga4-purchases.csv); the query that produced it is in [`server/ga4-export.sql`](server/ga4-export.sql). On start, the aggregation server loads the CSV into a local DuckDB database.

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

Install the dependencies of the app and of the agent, then start everything with the `dev` script:

```bash
npm install
npm install --prefix agent
npm run dev
```

`npm run dev` runs three processes side by side:

| Process            | Port | Command          |
| ------------------ | ---- | ---------------- |
| Aggregation server | 3000 | `npm run server` |
| Mastra agent       | 4111 | `npm run agent`  |
| Angular dev server | 4200 | `npm start`      |

Then open [http://localhost:4200](http://localhost:4200).

Unit tests run with `npm test`.
