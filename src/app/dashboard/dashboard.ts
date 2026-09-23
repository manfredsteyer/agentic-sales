import { Component, computed, effect, signal } from '@angular/core';
import { injectAgentStore } from '@copilotkit/angular';

import { DASHBOARD_AGENT_ID } from '../assistant/agent-ids';
import { AssistantChat } from '../assistant/assistant-chat';
import { saveDashboard, toDashboardItems } from './dashboard-state';
import { DashboardTile } from './dashboard-tile';

@Component({
  selector: 'app-dashboard',
  imports: [AssistantChat, DashboardTile],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  host: { '[class.with-chat]': 'chatVisible()' },
})
export class Dashboard {
  private readonly store = injectAgentStore(DASHBOARD_AGENT_ID);

  protected readonly agentId = DASHBOARD_AGENT_ID;
  protected readonly items = computed(() => toDashboardItems(this.store().state()));
  protected readonly chatVisible = signal(true);

  constructor() {
    effect(() => saveDashboard(this.store().state()));
  }

  protected toggleChat(): void {
    this.chatVisible.update((visible) => !visible);
  }

  protected clear(): void {
    this.store().agent.setState({ items: [] });
  }
}
