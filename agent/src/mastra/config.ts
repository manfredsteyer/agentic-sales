import type { AgentExecutionOptions } from '@mastra/core/agent';

export const MODEL = 'openai/gpt-5.6-terra';

export const DEFAULT_OPTIONS: AgentExecutionOptions<undefined> = {
  providerOptions: { openai: { serviceTier: 'priority' } },
};
