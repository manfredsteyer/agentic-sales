import type { RequestContext } from '@mastra/core/request-context';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { AG_UI_STATE_KEY } from '../config';

const barChartSchema = z.object({
  title: z.string().describe('Short title, e.g. "Revenue per week"'),
  valueLabel: z.string().describe('What the values are, e.g. "Revenue (USD)"'),
  bars: z
    .array(
      z.object({
        label: z.string(),
        series: z
          .string()
          .nullish()
          .describe(
            'Value of the second dimension for grouped bars, e.g. "Europe"',
          ),
        value: z.number(),
      }),
    )
    .min(1).describe(`
      One bar per aggregate row, e.g. { "label": "2020-W50", "value": 59842 }. With a second
      dimension, add its value as series: { "label": "Apparel", "series": "Europe", "value": 21530 }
    `),
});

const pieChartSchema = z.object({
  title: z.string().describe('Short title, e.g. "Revenue share per category"'),
  valueLabel: z.string().describe('What the values are, e.g. "Revenue (USD)"'),
  slices: z
    .array(z.object({ label: z.string(), value: z.number() }))
    .min(1)
    .describe(
      'One slice per aggregate row, e.g. { "label": "Apparel", "value": 171727 }',
    ),
});

const pivotTableSchema = z.object({
  title: z
    .string()
    .describe('Short title, e.g. "Revenue per month and device"'),
  rowDimension: z
    .string()
    .describe('Dimension spanning the rows, e.g. "Month"'),
  columnDimension: z
    .string()
    .describe('Dimension spanning the columns, e.g. "DeviceCategory"'),
  valueLabel: z.string().describe('What the values are, e.g. "Revenue (USD)"'),
  cells: z
    .array(z.object({ row: z.string(), column: z.string(), value: z.number() }))
    .min(1)
    .describe(
      'One cell per aggregate row, e.g. { "row": "2020-12", "column": "mobile", "value": 60423 }',
    ),
});

const kindSchema = z
  .enum(['barChart', 'pieChart', 'pivotTable'])
  .describe('Kind of visualization');

const argsSchema = z
  .union([barChartSchema, pieChartSchema, pivotTableSchema])
  .describe('The visualization of that kind, with complete data');

const idSchema = z
  .string()
  .describe('Id of the dashboard item, see the dashboard list');

const dashboardItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  kind: kindSchema,
  args: argsSchema,
});

const dashboardSchema = z.object({ items: z.array(dashboardItemSchema) });

const resultSchema = z.object({
  items: z.array(z.object({ id: z.string(), title: z.string() })),
});

export type Dashboard = z.infer<typeof dashboardSchema>;
type DashboardItem = z.infer<typeof dashboardItemSchema>;

export function toDashboard(state: unknown): Dashboard {
  const result = dashboardSchema.safeParse(state);
  return result.data ?? { items: [] };
}

export const addDashboardItem = createTool({
  id: 'add-dashboard-item',
  description:
    "Adds a visualization to the user's dashboard. Query the data first and pass all of it.",
  inputSchema: z.object({ kind: kindSchema, args: argsSchema }),
  outputSchema: resultSchema,
  execute: async ({ kind, args }, context) =>
    updateDashboard(context?.requestContext, (items) => [
      ...items,
      { id: crypto.randomUUID(), title: args.title, kind, args },
    ]),
});

export const updateDashboardItem = createTool({
  id: 'update-dashboard-item',
  description: `
    Replaces what a dashboard item shows: its kind, title and data. Use it after querying
    the changed data, e.g. with another filter or dimension, and pass all of it.
  `,
  inputSchema: z.object({ id: idSchema, kind: kindSchema, args: argsSchema }),
  outputSchema: resultSchema,
  execute: async ({ id, kind, args }, context) =>
    updateDashboard(context?.requestContext, (items) =>
      items.map((item) =>
        item.id === id ? { id, title: args.title, kind, args } : item,
      ),
    ),
});

export const reorderDashboard = createTool({
  id: 'reorder-dashboard',
  description: "Changes the order of the user's dashboard items.",
  inputSchema: z.object({
    ids: z
      .array(z.string())
      .describe('The ids of all dashboard items in their new order'),
  }),
  outputSchema: resultSchema,
  execute: async ({ ids }, context) =>
    updateDashboard(context?.requestContext, (items) =>
      [...items].sort((a, b) => indexOrEnd(ids, a.id) - indexOrEnd(ids, b.id)),
    ),
});

export const removeDashboardItem = createTool({
  id: 'remove-dashboard-item',
  description: "Removes an item from the user's dashboard.",
  inputSchema: z.object({ id: idSchema }),
  outputSchema: resultSchema,
  execute: async ({ id }, context) =>
    updateDashboard(context?.requestContext, (items) =>
      items.filter((item) => item.id !== id),
    ),
});

function updateDashboard(
  requestContext: RequestContext | undefined,
  update: (items: DashboardItem[]) => DashboardItem[],
) {
  const dashboard = {
    items: update(toDashboard(requestContext?.get(AG_UI_STATE_KEY)).items),
  };
  requestContext?.set(AG_UI_STATE_KEY, dashboard);
  return { items: dashboard.items.map(({ id, title }) => ({ id, title })) };
}

function indexOrEnd(ids: string[], id: string): number {
  const index = ids.indexOf(id);
  return index < 0 ? ids.length : index;
}
