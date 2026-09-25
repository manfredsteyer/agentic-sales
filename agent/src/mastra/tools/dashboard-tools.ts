import type { RequestContext } from '@mastra/core/request-context';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { AG_UI_STATE_KEY } from '../config';
import { querySchema } from './query-schema';
import { evaluateQuery } from './run-query';

const idSchema = z
  .string()
  .describe('Id of the dashboard item, see the dashboard list');

const dashboardItemSchema = z.object({
  id: z.string(),
  spec: querySchema,
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
  description: `
    Adds a visualization to the user's dashboard. The item stores its query, not its data:
    the dashboard runs the query whenever it shows the item.
  `,
  inputSchema: z.object({ spec: querySchema }),
  outputSchema: resultSchema,
  execute: async ({ spec }, context) => {
    await evaluateQuery(spec);
    return updateDashboard(context?.requestContext, (items) => [
      ...items,
      { id: crypto.randomUUID(), spec },
    ]);
  },
});

export const updateDashboardItem = createTool({
  id: 'update-dashboard-item',
  description: `
    Replaces the spec of a dashboard item, e.g. to change its kind, title, filter or
    dimensions. Pass the complete new spec.
  `,
  inputSchema: z.object({ id: idSchema, spec: querySchema }),
  outputSchema: resultSchema,
  execute: async ({ id, spec }, context) => {
    await evaluateQuery(spec);
    return updateDashboard(context?.requestContext, (items) =>
      items.map((item) => (item.id === id ? { id, spec } : item)),
    );
  },
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
  return {
    items: dashboard.items.map(({ id, spec }) => ({ id, title: spec.title })),
  };
}

function indexOrEnd(ids: string[], id: string): number {
  const index = ids.indexOf(id);
  return index < 0 ? ids.length : index;
}
