import {
  registerFrontendTool,
  registerRenderToolCall,
} from '@copilotkit/angular';
import { initialDashboardState } from '../../feature-dashboard/dashboard-store/dashboard-model';
import { registerAgent } from '../../shared/utils/register-agent';
import { explorerTool } from '../sales/tools/explorer-tool';
import { dashboardWidget } from './widgets/dashboard-widget';

export const DASHBOARD_AGENT_ID = 'dashboardAgent';

export const RUN_QUERY_URL = `http://localhost:4111/api/agents/${DASHBOARD_AGENT_ID}/tools/run-query/execute`;

export function initDashboardAgent(): void {
  registerAgent({
    agentId: DASHBOARD_AGENT_ID,
    url: `http://localhost:4111/ag-ui/${DASHBOARD_AGENT_ID}`,
    initialState: initialDashboardState,
  });

  registerRenderToolCall({
    ...dashboardWidget,
    agentId: DASHBOARD_AGENT_ID,
  });
  registerFrontendTool({ ...explorerTool, agentId: DASHBOARD_AGENT_ID });
}
