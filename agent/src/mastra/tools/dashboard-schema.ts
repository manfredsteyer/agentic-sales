import { z } from 'zod';
import { querySchema } from './query-schema';

export const dashboardItemSchema = z.object({
  id: z.string(),
  spec: querySchema,
});

export const dashboardSchema = z.object({
  items: z.array(dashboardItemSchema),
});

export type Dashboard = z.infer<typeof dashboardSchema>;
export type DashboardItem = z.infer<typeof dashboardItemSchema>;
