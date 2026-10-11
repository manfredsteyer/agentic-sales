import { A2uiMessage } from '@a2ui/web_core/v0_9';

export interface DashboardItem {
  surfaceId: string;
  messages: A2uiMessage[];
}

export interface DashboardState {
  items: DashboardItem[];
}

export const initialDashboardState: DashboardState = { items: [] };
