import { createTool, type ToolExecutionContext } from '@mastra/core/tools';
import { dashboardSchema, type DashboardItem } from '@shared/dashboard-schema';
import { z } from 'zod';
import {
  buildSurfaceEnvelope,
  surfaceInputSchema,
  type SurfaceArgs,
} from '../render-a2ui';
import { readDashboard, writeDashboard, type MemoryIds } from './dashboard-api';

const surfaceIdSchema = z
  .string()
  .describe('The surfaceId of the dashboard item, see the dashboard list');

// strict: false, as strict mode would turn the free-form A2UI args into {}
export const addDashboardItem = createTool({
  id: 'add-dashboard-item',
  description: `
    Adds an A2UI surface to the user's dashboard. Takes the same args as render_a2ui;
    the surfaceId identifies the item.
  `,
  strict: false,
  inputSchema: surfaceInputSchema,
  outputSchema: dashboardSchema,
  execute: async (input, context) => {
    const item = await toDashboardItem(input as SurfaceArgs);
    const memoryIds = getMemoryIds(context);
    const items = await readDashboard(memoryIds);
    if (items.some(({ surfaceId }) => surfaceId === item.surfaceId)) {
      throw new Error(
        `The dashboard already has a surface ${item.surfaceId}. Use another surfaceId.`,
      );
    }
    const updatedItems = [...items, item];
    await writeDashboard(memoryIds, updatedItems);
    return { items: updatedItems };
  },
});

export const updateDashboardItem = createTool({
  id: 'update-dashboard-item',
  description: `
    Replaces the dashboard item with the same surfaceId. Takes the same args as
    render_a2ui: pass the complete new surface.
  `,
  strict: false,
  inputSchema: surfaceInputSchema,
  outputSchema: dashboardSchema,
  execute: async (input, context) => {
    const changed = await toDashboardItem(input as SurfaceArgs);
    const memoryIds = getMemoryIds(context);
    const items = await readDashboard(memoryIds);
    const updatedItems = items.map((item) =>
      item.surfaceId === changed.surfaceId ? changed : item,
    );
    await writeDashboard(memoryIds, updatedItems);
    return { items: updatedItems };
  },
});

export const reorderDashboard = createTool({
  id: 'reorder-dashboard',
  description: "Changes the order of the user's dashboard items.",
  inputSchema: z.object({
    surfaceIds: z
      .array(z.string())
      .describe('The surfaceIds of all dashboard items in their new order'),
  }),
  outputSchema: dashboardSchema,
  execute: async ({ surfaceIds }, context) => {
    const memoryIds = getMemoryIds(context);
    const items = await readDashboard(memoryIds);
    const updatedItems = [...items].sort(
      (a, b) =>
        indexOrEnd(surfaceIds, a.surfaceId) -
        indexOrEnd(surfaceIds, b.surfaceId),
    );
    await writeDashboard(memoryIds, updatedItems);
    return { items: updatedItems };
  },
});

export const removeDashboardItem = createTool({
  id: 'remove-dashboard-item',
  description: "Removes an item from the user's dashboard.",
  inputSchema: z.object({ surfaceId: surfaceIdSchema }),
  outputSchema: dashboardSchema,
  execute: async ({ surfaceId }, context) => {
    const memoryIds = getMemoryIds(context);
    const items = await readDashboard(memoryIds);
    const updatedItems = items.filter((item) => item.surfaceId !== surfaceId);
    await writeDashboard(memoryIds, updatedItems);
    return { items: updatedItems };
  },
});

async function toDashboardItem(args: SurfaceArgs): Promise<DashboardItem> {
  const envelope = JSON.parse(await buildSurfaceEnvelope(args));
  return {
    surfaceId: args.surfaceId,
    expression: args.expression,
    messages: envelope.a2ui_operations,
  };
}

function indexOrEnd(surfaceIds: string[], surfaceId: string): number {
  const index = surfaceIds.indexOf(surfaceId);
  return index < 0 ? surfaceIds.length : index;
}

function getMemoryIds(context: ToolExecutionContext | undefined): MemoryIds {
  return {
    threadId: context?.agent?.threadId ?? '',
    resourceId: context?.agent?.resourceId,
  };
}
