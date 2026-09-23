import { Component } from '@angular/core';
import { CopilotChat } from '@copilotkit/angular';

import { injectPrefersDark } from '../prefers-dark';
import { initSalesAgent, SALES_AGENT_ID } from './sales-agent';

/** CopilotKit's prebuilt chat, talking to the sales agent via AG-UI. */
@Component({
  selector: 'app-assistant-chat',
  imports: [CopilotChat],
  template: `<copilot-chat [agentId]="agentId" />`,
  // CopilotKit switches its dark theme by a .dark class on an ancestor
  host: { '[class.dark]': 'dark()' },
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    copilot-chat {
      flex: 1;
      min-height: 0;
    }
  `,
})
export class AssistantChat {
  protected readonly agentId = SALES_AGENT_ID;
  protected readonly dark = injectPrefersDark();

  constructor() {
    initSalesAgent();
  }
}
