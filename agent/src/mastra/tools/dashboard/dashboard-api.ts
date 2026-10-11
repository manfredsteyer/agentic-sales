import { dashboardMemory } from '../../agents/dashboard-agent.memory';
import { dashboardSchema, type DashboardItem } from './dashboard-schema';

export interface MemoryIds {
  threadId: string;
  resourceId?: string;
}

let lastChange: Promise<unknown> = Promise.resolve();

// one promise chain serializes changes of parallel tool calls for simplicity
export function updateDashboard(
  memoryIds: MemoryIds,
  change: (items: DashboardItem[]) => DashboardItem[],
): Promise<DashboardItem[]> {
  const changed = lastChange.then(async () => {
    const current = await readDashboard(memoryIds);
    const items = change(current);
    await writeDashboard(memoryIds, items);
    return items;
  });
  lastChange = changed.catch(() => undefined);
  return changed;
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
