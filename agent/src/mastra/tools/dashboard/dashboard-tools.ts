import { createTool, type ToolExecutionContext } from '@mastra/core/tools';
import { querySchema } from '@shared/query-schema';
import { z } from 'zod';
import { evaluateQuery } from '../run-query';
import { readDashboard, writeDashboard, type MemoryIds } from './dashboard-api';
import { dashboardSchema } from './dashboard-schema';

const idSchema = z
  .string()
  .describe('Id of the dashboard item, see the dashboard list');

export const addDashboardItem = createTool({
  id: 'add-dashboard-item',
  description: `
    Adds a visualization to the user's dashboard. The item stores its query, not its data:
    the dashboard runs the query whenever it shows the item.
  `,
  inputSchema: z.object({ spec: querySchema }),
  outputSchema: dashboardSchema,
  execute: async ({ spec }, context) => {
    await evaluateQuery(spec);
    const memoryIds = getMemoryIds(context);
    const items = await readDashboard(memoryIds);
    const updatedItems = [...items, { id: crypto.randomUUID(), spec }];
    await writeDashboard(memoryIds, updatedItems);
    return { items: updatedItems };
  },
});

export const updateDashboardItem = createTool({
  id: 'update-dashboard-item',
  description: `
    Replaces the spec of a dashboard item, e.g. to change its kind, title, filter or
    dimensions. Pass the complete new spec.
  `,
  inputSchema: z.object({ id: idSchema, spec: querySchema }),
  outputSchema: dashboardSchema,
  execute: async ({ id, spec }, context) => {
    await evaluateQuery(spec);
    const memoryIds = getMemoryIds(context);
    const items = await readDashboard(memoryIds);
    const updatedItems = items.map((item) =>
      item.id === id ? { id, spec } : item,
    );
    await writeDashboard(memoryIds, updatedItems);
    return { items: updatedItems };
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
  outputSchema: dashboardSchema,
  execute: async (input, context) => {
    const memoryIds = getMemoryIds(context);
    const items = await readDashboard(memoryIds);
    const updatedItems = [...items].sort(
      (a, b) => indexOrEnd(input.ids, a.id) - indexOrEnd(input.ids, b.id),
    );
    await writeDashboard(memoryIds, updatedItems);
    return { items: updatedItems };
  },
});

export const removeDashboardItem = createTool({
  id: 'remove-dashboard-item',
  description: "Removes an item from the user's dashboard.",
  inputSchema: z.object({ id: idSchema }),
  outputSchema: dashboardSchema,
  execute: async ({ id }, context) => {
    const memoryIds = getMemoryIds(context);
    const items = await readDashboard(memoryIds);
    const updatedItems = items.filter((item) => item.id !== id);
    await writeDashboard(memoryIds, updatedItems);
    return { items: updatedItems };
  },
});

function indexOrEnd(ids: string[], id: string): number {
  const index = ids.indexOf(id);
  return index < 0 ? ids.length : index;
}

function getMemoryIds(context: ToolExecutionContext | undefined): MemoryIds {
  return {
    threadId: context?.agent?.threadId ?? '',
    resourceId: context?.agent?.resourceId,
  };
}
