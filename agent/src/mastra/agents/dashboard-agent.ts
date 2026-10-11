import { Agent } from '@mastra/core/agent';
import {
  addDashboardItem,
  removeDashboardItem,
  reorderDashboard,
  updateDashboardItem,
} from '../tools/dashboard-tools';
import { evaluateJsonata } from '../tools/evaluate-jsonata';
import { runQuery } from '../tools/run-query';
import { dashboardMemory } from './dashboard-agent.memory';
import { dashboardAgentPrompt } from './dashboard-agent.prompt';

export const dashboardAgent = new Agent({
  id: 'dashboard-agent',
  name: 'Dashboard Editor',
  instructions: dashboardAgentPrompt,
  model: 'openai/gpt-5.6-terra',
  memory: dashboardMemory,
  tools: {
    evaluateJsonata,
    runQuery,
    addDashboardItem,
    updateDashboardItem,
    reorderDashboard,
    removeDashboardItem,
  },
});
