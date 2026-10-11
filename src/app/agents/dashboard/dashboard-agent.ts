import {
  registerFrontendTool,
  registerRenderToolCall,
} from '@copilotkit/angular';
import { initialDashboard } from '@shared/dashboard-schema';
import { z } from 'zod';
import { registerAgent } from '../../shared/utils/register-agent';
import { explorerTool } from '../sales/tools/explorer-tool';
import { HiddenToolCall } from './hidden-tool-call';

export const DASHBOARD_AGENT_ID = 'dashboardAgent';

export function initDashboardAgent(): void {
  registerAgent({
    agentId: DASHBOARD_AGENT_ID,
    url: `http://localhost:4111/ag-ui/${DASHBOARD_AGENT_ID}`,
    initialState: initialDashboard,
  });

  registerFrontendTool({ ...explorerTool, agentId: DASHBOARD_AGENT_ID });
  registerRenderToolCall({
    name: 'generate_a2ui',
    args: z.record(z.string(), z.unknown()),
    component: HiddenToolCall,
    agentId: DASHBOARD_AGENT_ID,
  });
}
