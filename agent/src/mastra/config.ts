import type { AgentExecutionOptions } from '@mastra/core/agent';

export const MAX_ROWS = 1000;

export const AGENT_MODEL = 'openai/gpt-5.6-terra';

export const AGENT_DEFAULT_OPTIONS: AgentExecutionOptions = {
  maxSteps: 10,
  providerOptions: {
    openai: { serviceTier: 'priority', reasoningEffort: 'low' },
  },
};
