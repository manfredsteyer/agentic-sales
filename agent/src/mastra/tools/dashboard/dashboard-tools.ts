import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { dashboardMemory } from '../agents/dashboard-agent.memory';
import {
  dashboardSchema,
  type Dashboard,
  type DashboardItem,
} from './dashboard-schema';
import { querySchema } from './query-schema';
import { evaluateQuery } from './run-query';

const idSchema = z
  .string()
  .describe('Id of the dashboard item, see the dashboard list');

interface MemoryIds {
  threadId?: string;
  resourceId?: string;
}

function toDashboard(workingMemory: string | null): Dashboard {
  const result = dashboardSchema.safeParse(JSON.parse(workingMemory ?? '{}'));
  return result.data ?? { items: [] };
}

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
    return updateDashboard(context?.agent, (items) => [
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
  outputSchema: dashboardSchema,
  execute: async ({ id, spec }, context) => {
    await evaluateQuery(spec);
    return updateDashboard(context?.agent, (items) =>
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
  outputSchema: dashboardSchema,
  execute: async ({ ids }, context) =>
    updateDashboard(context?.agent, (items) =>
      [...items].sort((a, b) => indexOrEnd(ids, a.id) - indexOrEnd(ids, b.id)),
    ),
});

export const removeDashboardItem = createTool({
  id: 'remove-dashboard-item',
  description: "Removes an item from the user's dashboard.",
  inputSchema: z.object({ id: idSchema }),
  outputSchema: dashboardSchema,
  execute: async ({ id }, context) =>
    updateDashboard(context?.agent, (items) =>
      items.filter((item) => item.id !== id),
    ),
});

async function updateDashboard(
  ids: MemoryIds | undefined,
  update: (items: DashboardItem[]) => DashboardItem[],
) {
  const threadId = ids?.threadId ?? '';
  const resourceId = ids?.resourceId;
  const workingMemory = await dashboardMemory.getWorkingMemory({
    threadId,
    resourceId,
  });
  const dashboard = { items: update(toDashboard(workingMemory).items) };
  await dashboardMemory.updateWorkingMemory({
    threadId,
    resourceId,
    workingMemory: JSON.stringify(dashboard),
  });
  return dashboard;
}

function indexOrEnd(ids: string[], id: string): number {
  const index = ids.indexOf(id);
  return index < 0 ? ids.length : index;
}
