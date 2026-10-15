import { registerAgent } from '../../shared/utils/register-agent';

export const DASHBOARD_AGENT_ID = 'dashboardAgent';

export const RUN_QUERY_URL = `http://localhost:4111/api/agents/${DASHBOARD_AGENT_ID}/tools/run-query/execute`;

export function initDashboardAgent(): void {
  registerAgent({
    agentId: DASHBOARD_AGENT_ID,
    url: `http://localhost:4111/ag-ui/${DASHBOARD_AGENT_ID}`,
    // TODO #10: assign initialDashboard
  });

  // TODO #8: register toolCall renderer dashboardWidget
}
