import { Component, inject } from '@angular/core';
import { SALES_AGENT_ID } from '../agents/sales-agent';
import { WidgetOptions } from '../agents/widgets/widget-options';
import { AssistantChat } from '../assistant-chat/assistant-chat';

@Component({
  selector: 'app-home',
  imports: [AssistantChat],
  template: `<app-assistant-chat [agentId]="agentId" />`,
})
export class Home {
  protected readonly agentId = SALES_AGENT_ID;
  protected readonly options = inject(WidgetOptions);

  constructor() {
    this.options.showAddToDashboard.set(false);
  }
}
