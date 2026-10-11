import { Agent } from '@mastra/core/agent';
import { AGENT_DEFAULT_OPTIONS, AGENT_MODEL } from '../config';
import {
  addDashboardItem,
  removeDashboardItem,
  reorderDashboard,
  updateDashboardItem,
} from '../tools/dashboard/dashboard-tools';
import { evaluateJsonata } from '../tools/evaluate-jsonata';
import { generate_a2ui } from '../tools/generate-a2ui';
import { dashboardMemory } from './dashboard-agent.memory';
import { dashboardAgentPrompt } from './dashboard-agent.prompt';

export const dashboardAgent = new Agent({
  id: 'dashboard-agent',
  name: 'Dashboard Editor',
  instructions: dashboardAgentPrompt,
  model: AGENT_MODEL,
  defaultOptions: AGENT_DEFAULT_OPTIONS,
  memory: dashboardMemory,
  tools: {
    evaluateJsonata,
    generate_a2ui,
    addDashboardItem,
    updateDashboardItem,
    reorderDashboard,
    removeDashboardItem,
  },
});
