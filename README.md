# Agentic Sales

An Angular app that analyzes sales data with AI agents, built with [CopilotKit](https://copilotkit.ai) and AG-UI on the frontend and [Mastra](https://mastra.ai) on the agent side.

## Data

The app analyzes real purchases of the Google Merchandise Store from Google's public, obfuscated GA4 sample dataset in BigQuery (`bigquery-public-data.ga4_obfuscated_sample_ecommerce`), November 2020 to January 2021.

The aggregation server also serves an SVG image for every product and category under `/images`. The agent uses these images for A2UI views such as product cards.

## Configuration

The agent needs an OpenAI API key. Copy the template to `.env` and fill it in:

```bash
cp .env.example .env
```

```dotenv
OPENAI_API_KEY=sk-...
```

## Running the app

```bash
npm install
npm start
```

`npm start` runs five processes side by side:

| Process                     | Port | Command                     |
| --------------------------- | ---- | --------------------------- |
| Aggregation server          | 3000 | `npm run server`            |
| MCP server (stock, MCP App) | 3001 | `npm run mcp-server`        |
| MCP App build (Vite, watch) | –    | `npm run mcp-server:widget` |
| Mastra agent                | 4111 | `npm run agent`             |
| Angular dev server          | 4200 | `npm run client`            |
