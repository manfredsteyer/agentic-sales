# AgenticSales

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.1.2.

## Sales data

The app analyzes real purchases of the Google Merchandise Store, taken from Google's public GA4 sample dataset in BigQuery (`bigquery-public-data.ga4_obfuscated_sample_ecommerce`, November 2020 to January 2021, obfuscated by Google). Google provides this dataset for querying in BigQuery, but we found no license that permits redistributing it. That's why the data isn't part of this repository: export it once yourself. It takes about five minutes and is free:

1. Open the [BigQuery console](https://console.cloud.google.com/bigquery) with a Google account. On first use, it sets up a free sandbox project; you don't need a billing account.
2. Paste the query from [`server/ga4-export.sql`](server/ga4-export.sql) and click **Run**.
3. Choose **Save results** → **CSV (local file)** and store the file as `server/data/ga4-purchases.csv`.

`npm run server` and `npm run dev` load this CSV into a local DuckDB database (`server/data/sales.duckdb`) before starting the aggregation server. To rebuild the database without starting the server, run `npm run import`. The import prints a summary; with the full export, expect 15,555 item lines from 4,907 orders.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
