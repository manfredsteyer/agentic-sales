import { Component, inject } from '@angular/core';

import { AssistantChat } from '../assistant/assistant-chat';
import { SALES_AGENT_ID } from '../assistant/agent-ids';
import { WidgetOptions } from '../assistant/tools/widget-options';

@Component({
  selector: 'app-home',
  imports: [AssistantChat],
  template: `<app-assistant-chat [agentId]="agentId" />`,
  styles: `
    :host {
      display: block;
      height: 100%;
    }

    app-assistant-chat {
      height: 100%;
    }
  `,
})
export class Home {
  protected readonly agentId = SALES_AGENT_ID;
  protected readonly options = inject(WidgetOptions);

  constructor() {
    this.options.showAddToDashboard.set(false);
  }
}
