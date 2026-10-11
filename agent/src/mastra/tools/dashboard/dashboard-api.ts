import { dashboardSchema, type DashboardItem } from '@shared/dashboard-schema';
import { dashboardMemory } from '../../agents/dashboard-agent.memory';

export interface MemoryIds {
  threadId: string;
  resourceId?: string;
}

export async function updateDashboard(
  memoryIds: MemoryIds,
  change: (items: DashboardItem[]) => DashboardItem[],
): Promise<DashboardItem[]> {
  const current = await readDashboard(memoryIds);
  const items = change(current);
  await writeDashboard(memoryIds, items);
  return items;
}

async function readDashboard(memoryIds: MemoryIds): Promise<DashboardItem[]> {
  const workingMemory = await dashboardMemory.getWorkingMemory(memoryIds);
  const result = dashboardSchema.safeParse(JSON.parse(workingMemory ?? '{}'));
  return result.data?.items ?? [];
}

async function writeDashboard(
  memoryIds: MemoryIds,
  items: DashboardItem[],
): Promise<void> {
  const dashboardJson = JSON.stringify({ items });
  await dashboardMemory.updateWorkingMemory({
    ...memoryIds,
    workingMemory: dashboardJson,
  });
}
