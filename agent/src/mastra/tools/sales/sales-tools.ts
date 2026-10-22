import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { aggregate, details } from './sales-api';

const filterSchema = z
  .array(
    z.object({
      column: z.string(),
      value: z.union([z.string(), z.number(), z.boolean()]),
    }),
  )
  .optional().describe(`
    Exact-match filters that all must match, e.g.
    [{ "column": "Country", "value": "Germany" }, { "column": "Medium", "value": "organic" }]
  `);

function toFilter(filter: z.infer<typeof filterSchema>) {
  return Object.fromEntries((filter ?? []).map((f) => [f.column, f.value]));
}

const rowSchema = z.record(
  z.string(),
  z.union([z.string(), z.number(), z.null()]),
);

export const aggregateSales = createTool({
  id: 'aggregate-sales',
  description: `
    Aggregates the sales table: applies avg, sum, or count to a fact column,
    grouped by 1-2 dimension columns, optionally filtered by exact-match values.
    Results are sorted by the dimensions.
  `,
  inputSchema: z.object({
    fact: z
      .string()
      .describe('Fact column to aggregate, e.g. "Revenue" or "Quantity"'),
    aggregateFn: z.enum(['avg', 'sum', 'count']),
    dimensions: z
      .array(z.string())
      .min(1)
      .max(2)
      .describe('1-2 columns to group by, e.g. ["Country", "DeviceCategory"]'),
    filter: filterSchema,
  }),
  outputSchema: z.object({
    fact: z.string(),
    aggregateFn: z.string(),
    dimensions: z.array(z.string()),
    rowCount: z.number(),
    rows: z.array(rowSchema),
  }),
  execute: async ({ filter, ...query }) =>
    aggregate({ ...query, filter: toFilter(filter) }),
});

export const getSalesDetails = createTool({
  id: 'get-sales-details',
  description: `
    Returns raw item lines of the sales table (one row per purchased item),
    optionally filtered by exact-match values and sorted. Use it to drill down
    behind an aggregate, e.g. the largest orders of a country or what a
    specific order contained. Returns one page (limit/offset) plus totalCount,
    the number of all matching rows.
  `,
  inputSchema: z.object({
    columns: z.array(z.string()).min(1).optional().describe(`
      Columns to return, e.g. ["Date", "TransactionId", "ItemName", "Revenue"].
      Omit for all columns, but prefer the few you need.
    `),
    filter: filterSchema,
    sort: z
      .array(
        z.object({ column: z.string(), direction: z.enum(['asc', 'desc']) }),
      )
      .optional()
      .describe(
        'Sort order, e.g. [{ "column": "Revenue", "direction": "desc" }]',
      ),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .describe('Page size, default 20'),
    offset: z
      .number()
      .int()
      .min(0)
      .optional()
      .describe('Rows to skip, default 0'),
  }),
  outputSchema: z.object({
    columns: z.array(z.string()),
    rowCount: z.number(),
    totalCount: z.number(),
    rows: z.array(rowSchema),
  }),
  execute: async ({ filter, limit, ...query }) =>
    details({ ...query, filter: toFilter(filter), limit: limit ?? 20 }),
});
