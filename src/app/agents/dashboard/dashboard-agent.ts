import { registerFrontendTool } from '@copilotkit/angular';
import { initialDashboard } from '@shared/dashboard-schema';
import { registerAgent } from '../../shared/utils/register-agent';
import { explorerTool } from '../sales/tools/explorer-tool';

export const DASHBOARD_AGENT_ID = 'dashboardAgent';

export function initDashboardAgent(): void {
  registerAgent({
    agentId: DASHBOARD_AGENT_ID,
    url: `http://localhost:4111/ag-ui/${DASHBOARD_AGENT_ID}`,
    initialState: initialDashboard,
  });

  registerFrontendTool({ ...explorerTool, agentId: DASHBOARD_AGENT_ID });
}
