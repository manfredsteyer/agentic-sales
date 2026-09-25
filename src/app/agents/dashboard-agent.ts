import { registerComponent } from '@copilotkit/angular';
import { initialDashboardState } from '../dashboard/dashboard-model';
import { registerAgent } from '../utils/register-agent';
import { barChartWidget } from './widgets/bar-chart-widget';
import { pieChartWidget } from './widgets/pie-chart-widget';
import { pivotTableWidget } from './widgets/pivot-table-widget';

export const DASHBOARD_AGENT_ID = 'dashboardAgent';

export function initDashboardAgent(): void {
  registerAgent({
    agentId: DASHBOARD_AGENT_ID,
    url: `http://localhost:4111/ag-ui/${DASHBOARD_AGENT_ID}`,
    initialState: initialDashboardState,
  });

  registerComponent({ ...barChartWidget, agentId: DASHBOARD_AGENT_ID });
  registerComponent({ ...pieChartWidget, agentId: DASHBOARD_AGENT_ID });
  registerComponent({ ...pivotTableWidget, agentId: DASHBOARD_AGENT_ID });
}
