import { BarChartData } from '../figures/bar-chart';
import { PieChartData } from '../figures/pie-chart';
import { PivotTableData } from '../figures/pivot-table';

export interface BarChartItem {
  id: string;
  title: string;
  kind: 'barChart';
  args: BarChartData;
}

export interface PieChartItem {
  id: string;
  title: string;
  kind: 'pieChart';
  args: PieChartData;
}

export interface PivotTableItem {
  id: string;
  title: string;
  kind: 'pivotTable';
  args: PivotTableData;
}

export type DashboardItem = BarChartItem | PieChartItem | PivotTableItem;

export interface DashboardState {
  items: DashboardItem[];
}

export const initialDashboardState: DashboardState = { items: [] };
