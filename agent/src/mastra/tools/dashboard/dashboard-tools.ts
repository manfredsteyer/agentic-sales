import { createTool, type ToolExecutionContext } from '@mastra/core/tools';
import {
  dashboardItemSchema,
  dashboardSchema,
  type DashboardItem,
} from '@shared/dashboard-schema';
import { z } from 'zod';
import {
  generateA2uiSchema,
  generateSurface,
  type GenerateA2uiArgs,
} from '../generate-a2ui';
import { updateDashboard, type MemoryIds } from './dashboard-api';

const surfaceIdSchema = z
  .string()
  .describe('The surfaceId of the dashboard item, see the dashboard list');

export const addDashboardItem = createTool({
  id: 'add-dashboard-item',
  description: `
    Adds an A2UI surface to the user's dashboard. Takes the same args as generate_a2ui;
    the surfaceId identifies the item.
  `,
  inputSchema: generateA2uiSchema,
  outputSchema: dashboardSchema,
  execute: async (args, context) => {
    const item = await toDashboardItem(args);
    const memoryIds = getMemoryIds(context);
    const items = await updateDashboard(memoryIds, (items) => {
      if (items.some(({ surfaceId }) => surfaceId === item.surfaceId)) {
        throw new Error(
          `The dashboard already has a surface ${item.surfaceId}. Use another surfaceId.`,
        );
      }
      return [...items, item];
    });
    return { items };
  },
});

export const updateDashboardItem = createTool({
  id: 'update-dashboard-item',
  description: `
    Replaces the dashboard item with the same surfaceId. Takes the same args as
    generate_a2ui: pass the complete new surface.
  `,
  inputSchema: generateA2uiSchema,
  outputSchema: dashboardSchema,
  execute: async (args, context) => {
    const changed = await toDashboardItem(args);
    const memoryIds = getMemoryIds(context);
    const items = await updateDashboard(memoryIds, (items) =>
      items.map((item) =>
        item.surfaceId === changed.surfaceId ? changed : item,
      ),
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

async function toDashboardItem(args: GenerateA2uiArgs): Promise<DashboardItem> {
  const messages = await generateSurface(args);
  return dashboardItemSchema.parse({ surfaceId: args.surfaceId, messages });
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
