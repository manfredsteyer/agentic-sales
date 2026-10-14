import { Query } from '../../shared/query-schema';

export interface DashboardItem {
  id: string;
  spec: Query;
}

export interface DashboardState {
  items: DashboardItem[];
}

export const initialDashboardState: DashboardState = { items: [] };
