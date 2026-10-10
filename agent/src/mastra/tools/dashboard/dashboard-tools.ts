import { createTool, type ToolExecutionContext } from '@mastra/core/tools';
import { z } from 'zod';
import { querySchema } from '../query-schema';
import { renderedSurface } from '../render-a2ui';
import { evaluateQuery } from '../run-query';
import { readDashboard, writeDashboard, type MemoryIds } from './dashboard-api';
import { dashboardSchema, type DashboardSpec } from './dashboard-schema';

const idSchema = z
  .string()
  .describe('Id of the dashboard item, see the dashboard list');

const a2uiSpecInputSchema = z.object({
  kind: z.literal('a2ui'),
  surfaceId: z
    .string()
    .describe('The surfaceId of a surface shown with render_a2ui'),
});

const dashboardSpecInputSchema = z.union([querySchema, a2uiSpecInputSchema]);

type DashboardSpecInput = z.infer<typeof dashboardSpecInputSchema>;

export const addDashboardItem = createTool({
  id: 'add-dashboard-item',
  description: `
    Adds a visualization or an A2UI surface to the user's dashboard. A visualization item
    stores its query, not its data: the dashboard runs the query whenever it shows the item.
  `,
  inputSchema: z.object({ spec: dashboardSpecInputSchema }),
  outputSchema: dashboardSchema,
  execute: async ({ spec }, context) => {
    const item = {
      id: crypto.randomUUID(),
      spec: await toDashboardSpec(spec, context),
    };
    const memoryIds = getMemoryIds(context);
    const items = await readDashboard(memoryIds);
    const updatedItems = [...items, item];
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
  inputSchema: z.object({ id: idSchema, spec: dashboardSpecInputSchema }),
  outputSchema: dashboardSchema,
  execute: async ({ id, spec }, context) => {
    const changed = {
      id,
      spec: await toDashboardSpec(spec, context),
    };
    const memoryIds = getMemoryIds(context);
    const items = await readDashboard(memoryIds);
    const updatedItems = items.map((item) => (item.id === id ? changed : item));
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

async function toDashboardSpec(
  spec: DashboardSpecInput,
  context: ToolExecutionContext | undefined,
): Promise<DashboardSpec> {
  if (spec.kind !== 'a2ui') {
    await evaluateQuery(spec);
    return spec;
  }
  return { kind: 'a2ui', messages: renderedSurface(spec.surfaceId, context) };
}

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
