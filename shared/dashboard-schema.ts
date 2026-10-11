import type { A2uiMessage } from '@a2ui/web_core/v0_9';
import { z } from 'zod';

export const dashboardItemSchema = z.object({
  surfaceId: z.string(),
  expression: z.string().optional(),
  messages: z.array(z.custom<A2uiMessage>()),
});

export const dashboardSchema = z.object({
  items: z.array(dashboardItemSchema),
});

export type Dashboard = z.infer<typeof dashboardSchema>;
export type DashboardItem = z.infer<typeof dashboardItemSchema>;

export const initialDashboard: Dashboard = { items: [] };
