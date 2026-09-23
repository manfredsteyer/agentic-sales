import { Agent } from '@mastra/core/agent';

import { AG_UI_STATE_KEY } from '../config';
import {
  addDashboardItem,
  removeDashboardItem,
  reorderDashboard,
  toDashboard,
  updateDashboardItem,
} from '../tools/dashboard-tools';
import { executeJavaScript } from '../tools/execute-javascript';
import { aggregateSales, getSalesDetails } from '../tools/sales-tools';
import { dashboardAgentPrompt } from './dashboard-agent.prompt';

export const dashboardAgent = new Agent({
  id: 'dashboard-agent',
  name: 'Dashboard Editor',
  instructions: ({ requestContext }) =>
    dashboardAgentPrompt + toDashboardSection(requestContext.get(AG_UI_STATE_KEY)),
  model: 'openai/gpt-5.6-terra',
  tools: {
    aggregateSales,
    getSalesDetails,
    executeJavaScript,
    addDashboardItem,
    updateDashboardItem,
    reorderDashboard,
    removeDashboardItem,
  },
});

function toDashboardSection(state: unknown): string {
  const { items } = toDashboard(state);
  if (items.length === 0) {
    return '\nDashboard of the user: empty\n';
  }
  const lines = items.map(
    (item, index) =>
      `${index + 1}. id ${item.id}, ${item.kind} "${item.title}": ${JSON.stringify(item.args)}`,
  );
  return `\nDashboard of the user, in order:\n${lines.join('\n')}\n`;
}
