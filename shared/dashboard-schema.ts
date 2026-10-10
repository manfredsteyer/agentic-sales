import type { A2uiMessage } from '@a2ui/web_core/v0_9';
import { z } from 'zod';
import { querySchema } from './query-schema';

// assume valid A2UI messages for simplicity, z.custom breaks the working memory
const a2uiMessageSchema = z.any() as z.ZodType<A2uiMessage>;

const a2uiSpecSchema = z.object({
  kind: z.literal('a2ui'),
  messages: z.array(a2uiMessageSchema),
});

export const dashboardSpecSchema = z.union([querySchema, a2uiSpecSchema]);

export const dashboardItemSchema = z.object({
  id: z.string(),
  spec: dashboardSpecSchema,
});

export const dashboardSchema = z.object({
  items: z.array(dashboardItemSchema),
});

export type Dashboard = z.infer<typeof dashboardSchema>;
export type DashboardSpec = z.infer<typeof dashboardSpecSchema>;
export type DashboardItem = z.infer<typeof dashboardItemSchema>;

export const initialDashboard: Dashboard = { items: [] };
