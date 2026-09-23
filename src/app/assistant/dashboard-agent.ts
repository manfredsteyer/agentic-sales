import { HttpAgent } from '@ag-ui/client';
import { inject } from '@angular/core';
import { CopilotKit, registerComponent } from '@copilotkit/angular';

import { loadDashboard } from '../dashboard/dashboard-state';
import { DASHBOARD_AGENT_ID } from './agent-ids';
import { barChartWidget } from './tools/bar-chart-widget';
import { pieChartWidget } from './tools/pie-chart-widget';
import { pivotTableWidget } from './tools/pivot-table-widget';

export function initDashboardAgent(): void {
  const copilotKit = inject(CopilotKit);
  copilotKit.updateRuntime({
    selfManagedAgents: {
      ...copilotKit.agents(),
      [DASHBOARD_AGENT_ID]: new HttpAgent({
        agentId: DASHBOARD_AGENT_ID,
        url: `/ag-ui/${DASHBOARD_AGENT_ID}`,
        initialState: loadDashboard(),
      }),
    },
  });

  registerComponent({ ...barChartWidget, agentId: DASHBOARD_AGENT_ID });
  registerComponent({ ...pieChartWidget, agentId: DASHBOARD_AGENT_ID });
  registerComponent({ ...pivotTableWidget, agentId: DASHBOARD_AGENT_ID });
}
