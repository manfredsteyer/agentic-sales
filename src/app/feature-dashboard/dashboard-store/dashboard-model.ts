import { A2uiSpec } from '../../data/a2ui-model';
import { Query } from '../../shared/query-schema';

export type DashboardSpec = Query | A2uiSpec;

export interface DashboardItem {
  id: string;
  spec: DashboardSpec;
}

export interface DashboardState {
  items: DashboardItem[];
}

export const initialDashboardState: DashboardState = { items: [] };
