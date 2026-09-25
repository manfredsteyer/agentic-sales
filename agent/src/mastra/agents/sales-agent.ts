import { Agent } from '@mastra/core/agent';
import { evaluateJsonata } from '../tools/evaluate-jsonata';
import { aggregateSales, getSalesDetails } from '../tools/sales-tools';
import { salesAgentPrompt } from './sales-agent.prompt';

export const salesAgent = new Agent({
  id: 'sales-agent',
  name: 'Sales Analyst',
  instructions: salesAgentPrompt,
  model: 'openai/gpt-5.6-terra',
  tools: { aggregateSales, getSalesDetails, evaluateJsonata },
});
