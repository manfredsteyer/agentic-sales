import { registerFrontendTool } from '@copilotkit/angular';
import { initialDashboardState } from '../../feature-dashboard/dashboard-store/dashboard-model';
import { registerAgent } from '../../shared/utils/register-agent';
import { explorerTool } from '../sales/tools/explorer-tool';

export const DASHBOARD_AGENT_ID = 'dashboardAgent';

export function initDashboardAgent(): void {
  registerAgent({
    agentId: DASHBOARD_AGENT_ID,
    url: `http://localhost:4111/ag-ui/${DASHBOARD_AGENT_ID}`,
    initialState: initialDashboardState,
  });

  registerFrontendTool({ ...explorerTool, agentId: DASHBOARD_AGENT_ID });
}
