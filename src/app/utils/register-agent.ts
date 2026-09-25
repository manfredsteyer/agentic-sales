import { HttpAgent, HttpAgentConfig } from '@ag-ui/client';
import { inject } from '@angular/core';
import { CopilotKit } from '@copilotkit/angular';

export function registerAgent(
  config: HttpAgentConfig & { agentId: string },
): void {
  const copilotKit = inject(CopilotKit);
  copilotKit.updateRuntime({
    selfManagedAgents: {
      ...copilotKit.agents(),
      [config.agentId]: new HttpAgent(config),
    },
  });
}
