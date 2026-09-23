import { z } from 'zod';

import {
  barChartSchema,
  pieChartSchema,
  pivotTableSchema,
} from '../assistant/tools/visualization-schemas';

const STORAGE_KEY = 'dashboard';

const dashboardItemSchema = z.discriminatedUnion('kind', [
  z.object({
    id: z.string(),
    title: z.string(),
    kind: z.literal('barChart'),
    args: barChartSchema,
  }),
  z.object({
    id: z.string(),
    title: z.string(),
    kind: z.literal('pieChart'),
    args: pieChartSchema,
  }),
  z.object({
    id: z.string(),
    title: z.string(),
    kind: z.literal('pivotTable'),
    args: pivotTableSchema,
  }),
]);

const dashboardSchema = z.object({ items: z.array(dashboardItemSchema) });

export type DashboardItem = z.infer<typeof dashboardItemSchema>;
export type DashboardKind = DashboardItem['kind'];
export type DashboardArgs = DashboardItem['args'];
export type DashboardState = z.infer<typeof dashboardSchema>;

export function toDashboardItems(state: unknown): DashboardItem[] {
  const result = dashboardSchema.safeParse(state);
  return result.data?.items ?? [];
}

export function withItem(state: unknown, kind: DashboardKind, args: DashboardArgs): DashboardState {
  const item = dashboardItemSchema.parse({
    id: crypto.randomUUID(),
    title: args.title,
    kind,
    args,
  });
  return { items: [...toDashboardItems(state), item] };
}

export function saveDashboard(state: unknown): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ items: toDashboardItems(state) }));
}

export function loadDashboard(): DashboardState {
  const stored = localStorage.getItem(STORAGE_KEY);
  return { items: toDashboardItems(JSON.parse(stored ?? 'null')) };
}
