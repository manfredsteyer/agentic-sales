import type { A2uiMessage } from '@a2ui/web_core/v0_9';
import { z } from 'zod';

// assume valid A2UI messages for simplicity, z.custom breaks the working memory
const a2uiMessageSchema = z.any() as z.ZodType<A2uiMessage>;

export const dashboardItemSchema = z.object({
  surfaceId: z.string(),
  expression: z.string().optional(),
  messages: z.array(a2uiMessageSchema),
});

export const dashboardSchema = z.object({
  items: z.array(dashboardItemSchema),
});

export type Dashboard = z.infer<typeof dashboardSchema>;
export type DashboardItem = z.infer<typeof dashboardItemSchema>;

export const initialDashboard: Dashboard = { items: [] };
