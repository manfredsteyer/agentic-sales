import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { MAX_ROWS } from '../../config';
import {
  approvalResumeSchema,
  approvalSuspendSchema,
  notExecutedSchema,
  withRowLimit,
} from '../row-limit';
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

const approvalNote = `
  Results with more than ${MAX_ROWS} rows need the user's approval: the tool
  pauses and asks the user before it returns them.
`;

export const aggregateSales = createTool({
  id: 'aggregate-sales',
  description: `
    Aggregates the sales table: applies avg, sum, or count to a fact column,
    grouped by 1-2 dimension columns, optionally filtered by exact-match values.
    Returns every group, sorted by the dimensions: for rankings or the top N, e.g. the
    best-selling product, use evaluateJsonata, whose $aggregate sorts by "value" and
    limits the rows.
    ${approvalNote}
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
  outputSchema: z.union([
    z.object({
      fact: z.string(),
      aggregateFn: z.string(),
      dimensions: z.array(z.string()),
      rowCount: z.number(),
      rows: z.array(rowSchema),
    }),
    notExecutedSchema,
  ]),
  suspendSchema: approvalSuspendSchema,
  resumeSchema: approvalResumeSchema,
  execute: async ({ filter, ...query }, context) => {
    return withRowLimit(
      context,
      () => aggregate({ ...query, filter: toFilter(filter) }),
      (result) => result.rowCount,
    );
  },
});

export const getSalesDetails = createTool({
  id: 'get-sales-details',
  description: `
    Returns raw item lines of the sales table (one row per purchased item),
    optionally filtered by exact-match values and sorted. Use it to drill down
    behind an aggregate, e.g. the largest orders of a country or what a
    specific order contained. Returns one page (limit/offset) plus totalCount,
    the number of all matching rows. The approval limit applies to totalCount. Rows with
    ItemName or ItemCategory also contain ItemImageUrl or ItemCategoryImageUrl, the URL of
    the product or category image.
    ${approvalNote}
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
  outputSchema: z.union([
    z.object({
      columns: z.array(z.string()),
      rowCount: z.number(),
      totalCount: z.number(),
      rows: z.array(rowSchema),
    }),
    notExecutedSchema,
  ]),
  suspendSchema: approvalSuspendSchema,
  resumeSchema: approvalResumeSchema,
  execute: async ({ filter, limit, ...query }, context) => {
    return withRowLimit(
      context,
      () => details({ ...query, filter: toFilter(filter), limit: limit ?? 20 }),
      (result) => result.totalCount,
    );
  },
});
