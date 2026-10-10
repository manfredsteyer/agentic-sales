import type { AgentExecutionOptions } from '@mastra/core/agent';

export const MAX_ROWS = 100;

export const A2UI_SURFACES_KEY = 'a2ui-surfaces';

export const MODEL = 'openai/gpt-5.6-terra';

export const DEFAULT_OPTIONS: AgentExecutionOptions<undefined> = {
  maxSteps: 10,
  providerOptions: {
    openai: { serviceTier: 'priority', reasoningEffort: 'low' },
  },
};
