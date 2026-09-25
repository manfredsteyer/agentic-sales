# Agentic Sales

An Angular app that analyzes sales data with AI agents, built with [CopilotKit](https://copilotkit.ai) and AG-UI on the frontend and [Mastra](https://mastra.ai) on the agent side.

## Data

The app analyzes real purchases of the Google Merchandise Store from Google's public, obfuscated GA4 sample dataset in BigQuery (`bigquery-public-data.ga4_obfuscated_sample_ecommerce`), November 2020 to January 2021.

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

`npm start` runs three processes side by side:

| Process            | Port | Command          |
| ------------------ | ---- | ---------------- |
| Aggregation server | 3000 | `npm run server` |
| Mastra agent       | 4111 | `npm run agent`  |
| Angular dev server | 4200 | `npm run client` |
