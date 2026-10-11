import { z } from 'zod';

export const dashboardItemSchema = z.object({
  surfaceId: z.string(),
  messages: z.array(z.record(z.string(), z.unknown())),
});

export const dashboardSchema = z.object({
  items: z.array(dashboardItemSchema),
});

export type Dashboard = z.infer<typeof dashboardSchema>;
export type DashboardItem = z.infer<typeof dashboardItemSchema>;
