import { computed, Service } from '@angular/core';
import { injectAgentStore } from '@copilotkit/angular';
import { DASHBOARD_AGENT_ID } from '../agents/dashboard-agent';
import {
  DashboardItem,
  DashboardState,
  initialDashboardState,
} from './dashboard-model';

@Service()
export class DashboardStore {
  private readonly agentStore = injectAgentStore(DASHBOARD_AGENT_ID);

  readonly state = computed(() => this.agentStore().state() as DashboardState);
  readonly items = computed(() => this.state().items);

  addItem(item: DashboardItem): void {
    const agent = this.agentStore().agent;
    const state: DashboardState = agent.state;
    agent.setState({ items: [...state.items, item] });
  }

  clear(): void {
    this.agentStore().agent.setState(initialDashboardState);
  }
}
