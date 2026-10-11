import { computed, Service, signal } from '@angular/core';
import { injectAgentStore } from '@copilotkit/angular';
import { DASHBOARD_AGENT_ID } from '../../agents/dashboard/dashboard-agent';
import {
  DashboardItem,
  DashboardState,
  initialDashboardState,
} from './dashboard-model';

const STORAGE_KEY = 'dashboard';

@Service()
export class DashboardStore {
  private readonly agentStore = injectAgentStore(DASHBOARD_AGENT_ID);

  readonly agent = computed(() => this.agentStore().agent);
  readonly state = computed(() => this.agentStore().state() as DashboardState);
  readonly items = computed(() => this.state().items);
  readonly messages = computed(() => this.agentStore().messages());
  readonly isRunning = computed(() => this.agentStore().isRunning());
  readonly hasSavedState = signal(localStorage.getItem(STORAGE_KEY) !== null);

  addItem(item: DashboardItem): void {
    const agent = this.agentStore().agent;
    const state: DashboardState = agent.state;
    agent.setState({ items: [...state.items, item] });
  }

  clear(): void {
    this.agentStore().agent.setState(initialDashboardState);
  }

  save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state()));
    this.hasSavedState.set(true);
  }

  load(): void {
    const json = localStorage.getItem(STORAGE_KEY);
    if (json) {
      const state: DashboardState = JSON.parse(json);
      this.agentStore().agent.setState(state);
    }
  }
}
