import {
  registerFrontendTool,
  registerRenderActivityMessage,
} from '@copilotkit/angular';
import { initialDashboardState } from '../../feature-dashboard/dashboard-store/dashboard-model';
import { registerAgent } from '../../shared/utils/register-agent';
import { explorerTool } from '../sales/tools/explorer-tool';
import { mcpAppWidget } from './widgets/mcp-app-widget';
import { surfaceWidget } from './widgets/surface-widget';

export const DASHBOARD_AGENT_ID = 'dashboardAgent';

export const EVALUATE_JSONATA_URL = `http://localhost:4111/api/agents/${DASHBOARD_AGENT_ID}/tools/evaluate-jsonata/execute`;

export function initDashboardAgent(): void {
  registerAgent({
    agentId: DASHBOARD_AGENT_ID,
    url: `http://localhost:4111/ag-ui/${DASHBOARD_AGENT_ID}`,
    initialState: initialDashboardState,
  });

  registerRenderActivityMessage({
    ...surfaceWidget,
    agentId: DASHBOARD_AGENT_ID,
  });
  registerRenderActivityMessage({
    ...mcpAppWidget,
    agentId: DASHBOARD_AGENT_ID,
  });
  registerFrontendTool({ ...explorerTool, agentId: DASHBOARD_AGENT_ID });
}
