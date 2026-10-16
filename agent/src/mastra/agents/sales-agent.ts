import { Agent } from '@mastra/core/agent';
import { DEFAULT_OPTIONS, MODEL } from '../config';
import { evaluateJsonata } from '../tools/evaluate-jsonata';
import { aggregateSales, getSalesDetails } from '../tools/sales/sales-tools';
import { salesMemory } from './sales-agent.memory';
import { salesAgentPrompt } from './sales-agent.prompt';

export const salesAgent = new Agent({
  id: 'sales-agent',
  name: 'Sales Analyst',
  instructions: salesAgentPrompt,
  model: MODEL,
  defaultOptions: DEFAULT_OPTIONS,
  tools: { aggregateSales, getSalesDetails, evaluateJsonata },
  memory: salesMemory,
});
