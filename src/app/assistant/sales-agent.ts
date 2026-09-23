import { HttpAgent } from '@ag-ui/client';
import { inject } from '@angular/core';
import { CopilotKit, registerComponent, registerFrontendTool } from '@copilotkit/angular';

import { SALES_AGENT_ID } from './agent-ids';
import { barChartWidget } from './tools/bar-chart-widget';
import { pieChartWidget } from './tools/pie-chart-widget';
import { pivotTableWidget } from './tools/pivot-table-widget';
import { exploreDataTool } from './tools/explore-data-tool';

export function initSalesAgent(): void {
  const copilotKit = inject(CopilotKit);
  copilotKit.updateRuntime({
    selfManagedAgents: {
      ...copilotKit.agents(),
      [SALES_AGENT_ID]: new HttpAgent({ agentId: SALES_AGENT_ID, url: `/ag-ui/${SALES_AGENT_ID}` }),
    },
  });

  registerComponent({ ...barChartWidget, agentId: SALES_AGENT_ID });
  registerComponent({ ...pieChartWidget, agentId: SALES_AGENT_ID });
  registerComponent({ ...pivotTableWidget, agentId: SALES_AGENT_ID });
  registerFrontendTool({ ...exploreDataTool, agentId: SALES_AGENT_ID });
}
