import { Agent } from '@mastra/core/agent';
import { AGENT_DEFAULT_OPTIONS, AGENT_MODEL } from '../config';
import { evaluateJsonata } from '../tools/evaluate-jsonata';
import { aggregateSales, getSalesDetails } from '../tools/sales/sales-tools';
import { salesAgentPrompt } from './sales-agent.prompt';

export const salesAgent = new Agent({
  id: 'sales-agent',
  name: 'Sales Analyst',
  instructions: salesAgentPrompt,
  model: AGENT_MODEL,
  defaultOptions: AGENT_DEFAULT_OPTIONS,
  tools: { aggregateSales, getSalesDetails, evaluateJsonata },
});
