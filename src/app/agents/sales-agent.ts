import { registerComponent, registerFrontendTool } from '@copilotkit/angular';
import { registerAgent } from '../utils/register-agent';
import { explorerTool } from './tools/explorer-tool';
import { barChartWidget } from './widgets/bar-chart-widget';
import { pieChartWidget } from './widgets/pie-chart-widget';
import { pivotTableWidget } from './widgets/pivot-table-widget';

export const SALES_AGENT_ID = 'salesAgent';

export function initSalesAgent(): void {
  registerAgent({
    url: `http://localhost:4111/ag-ui/${SALES_AGENT_ID}`,
    agentId: SALES_AGENT_ID,
  });

  registerComponent({ ...barChartWidget, agentId: SALES_AGENT_ID });
  registerComponent({ ...pieChartWidget, agentId: SALES_AGENT_ID });
  registerComponent({ ...pivotTableWidget, agentId: SALES_AGENT_ID });
  registerFrontendTool({ ...explorerTool, agentId: SALES_AGENT_ID });
}
