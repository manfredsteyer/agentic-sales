import { HttpAgent } from '@ag-ui/client';
import { inject } from '@angular/core';
import { CopilotKit, registerComponent, registerFrontendTool } from '@copilotkit/angular';

import { barChartWidget } from './tools/bar-chart-widget';
import { pieChartWidget } from './tools/pie-chart-widget';
import { pivotTableWidget } from './tools/pivot-table-widget';
import { exploreDataTool } from './tools/explore-data-tool';

export const SALES_AGENT_ID = 'salesAgent';

const AG_UI_URL = `/ag-ui/${SALES_AGENT_ID}`;

export function initSalesAgent(): void {
  const copilotKit = inject(CopilotKit);
  copilotKit.updateRuntime({
    selfManagedAgents: {
      ...copilotKit.agents(),
      [SALES_AGENT_ID]: new HttpAgent({ agentId: SALES_AGENT_ID, url: AG_UI_URL }),
    },
  });

  registerComponent({ ...barChartWidget, agentId: SALES_AGENT_ID });
  registerComponent({ ...pieChartWidget, agentId: SALES_AGENT_ID });
  registerComponent({ ...pivotTableWidget, agentId: SALES_AGENT_ID });
  registerFrontendTool({ ...exploreDataTool, agentId: SALES_AGENT_ID });
}
