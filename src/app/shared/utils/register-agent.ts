import { HttpAgent, HttpAgentConfig } from '@ag-ui/client';
import { inject } from '@angular/core';
import { CopilotKit } from '@copilotkit/angular';
import { skipReasoning } from './skip-reasoning';

export type RegisterAgentConfig = HttpAgentConfig & { agentId: string };

export function registerAgent(config: RegisterAgentConfig): void {
  const copilotKit = inject(CopilotKit);
  copilotKit.updateRuntime({
    selfManagedAgents: {
      ...copilotKit.agents(),
      [config.agentId]: new HttpAgent(config).use(skipReasoning),
    },
  });
}
