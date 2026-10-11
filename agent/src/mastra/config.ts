import type { AgentExecutionOptions } from '@mastra/core/agent';

export const MAX_ROWS = 1000;

export const MODEL = 'openai/gpt-5.6-sol';

export const DEFAULT_OPTIONS: AgentExecutionOptions<undefined> = {
  maxSteps: 10,
  providerOptions: {
    openai: { serviceTier: 'priority', reasoningEffort: 'low' },
  },
};
