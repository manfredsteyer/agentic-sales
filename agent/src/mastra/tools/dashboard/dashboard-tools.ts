import { createTool, type ToolExecutionContext } from '@mastra/core/tools';
import { z } from 'zod';
import {
  generateSurfaces,
  renderA2uiSchema,
  type SurfaceRequest,
} from '../render-a2ui';
import { updateDashboard, type MemoryIds } from './dashboard-api';
import { dashboardSchema, type DashboardItem } from './dashboard-schema';

const surfaceIdSchema = z
  .string()
  .describe('The surfaceId of the dashboard item, see the dashboard list');

export const addDashboardItem = createTool({
  id: 'add-dashboard-item',
  description: `
    Adds A2UI surfaces to the user's dashboard, one item per surface. Takes the same args
    as render_a2ui; the surfaceId identifies the item.
  `,
  inputSchema: renderA2uiSchema,
  outputSchema: dashboardSchema,
  execute: async ({ surfaces }, context) => {
    const added = await toDashboardItems(surfaces);
    const memoryIds = getMemoryIds(context);
    const items = await updateDashboard(memoryIds, (items) => {
      const duplicate = added.find((item) => hasItem(items, item.surfaceId));
      if (duplicate) {
        throw new Error(
          `The dashboard already has a surface ${duplicate.surfaceId}. Use another surfaceId.`,
        );
      }
      return [...items, ...added];
    });
    return { items };
  },
});

export const updateDashboardItem = createTool({
  id: 'update-dashboard-item',
  description: `
    Replaces the dashboard items with the same surfaceIds. Takes the same args as
    render_a2ui: pass the complete new surfaces.
  `,
  inputSchema: renderA2uiSchema,
  outputSchema: dashboardSchema,
  execute: async ({ surfaces }, context) => {
    const changed = await toDashboardItems(surfaces);
    const memoryIds = getMemoryIds(context);
    const items = await updateDashboard(memoryIds, (items) =>
      items.map((item) => findItem(changed, item.surfaceId) ?? item),
    );
    return { items };
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
    const items = await updateDashboard(memoryIds, (items) =>
      [...items].sort(
        (a, b) =>
          indexOrEnd(surfaceIds, a.surfaceId) -
          indexOrEnd(surfaceIds, b.surfaceId),
      ),
    );
    return { items };
  },
});

export const removeDashboardItem = createTool({
  id: 'remove-dashboard-item',
  description: "Removes an item from the user's dashboard.",
  inputSchema: z.object({ surfaceId: surfaceIdSchema }),
  outputSchema: dashboardSchema,
  execute: async ({ surfaceId }, context) => {
    const memoryIds = getMemoryIds(context);
    const items = await updateDashboard(memoryIds, (items) =>
      items.filter((item) => item.surfaceId !== surfaceId),
    );
    return { items };
  },
});

async function toDashboardItems(
  surfaces: SurfaceRequest[],
): Promise<DashboardItem[]> {
  const generated = await generateSurfaces(surfaces);
  return surfaces.map(({ surfaceId }, i) => ({
    surfaceId,
    messages: generated[i],
  }));
}

function findItem(
  items: DashboardItem[],
  surfaceId: string,
): DashboardItem | undefined {
  return items.find((item) => item.surfaceId === surfaceId);
}

function hasItem(items: DashboardItem[], surfaceId: string): boolean {
  return findItem(items, surfaceId) !== undefined;
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
