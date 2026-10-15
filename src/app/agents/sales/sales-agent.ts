import { registerAgent } from '../../shared/utils/register-agent';

export const SALES_AGENT_ID = 'salesAgent';

export function initSalesAgent(): void {
  registerAgent({
    url: `http://localhost:4111/ag-ui/${SALES_AGENT_ID}`,
    agentId: SALES_AGENT_ID,
  });

  // TODO #3: Register components:
  //  - barChartWidget
  //  - pieChartWidget
  //  - pivotTableWidget

  // TODO #3: Register frontend tool
  //  - explorerTool
}
