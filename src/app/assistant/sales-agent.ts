import { initAgentStore } from '../util-copilotkit/init-agent-store';
import { barChartTool, pieChartTool, pivotTableTool } from './visualization-tools';

export const SALES_AGENT_ID = 'salesAgent';

// AG-UI endpoint of the Mastra agent (npm run agent)
const AG_UI_URL = 'http://localhost:4111/ag-ui';

/**
 * Registers the sales agent and the visualizations it may show with
 * CopilotKit. Needs an injection context; registrations end with it.
 */
export function initSalesAgent(): void {
  initAgentStore({
    agentId: SALES_AGENT_ID,
    url: `${AG_UI_URL}/${SALES_AGENT_ID}`,
    components: [barChartTool, pieChartTool, pivotTableTool],
  });
}
