import { computed, Service, signal } from '@angular/core';
import {
  Dashboard,
  DashboardItem,
  initialDashboard,
} from '@shared/dashboard-schema';

const STORAGE_KEY = 'dashboard';

@Service()
export class DashboardStore {
  // TODO #11: inject dashboard agent store (DASHBOARD_AGENT_ID)

  // TODO #11: project to state in agent store
  readonly state = computed(() => initialDashboard as Dashboard);
  readonly items = computed(() => this.state().items);
  readonly hasSavedState = signal(localStorage.getItem(STORAGE_KEY) !== null);

  addItem(_item: DashboardItem): void {
    // TODO #11: add item to agent store
  }
}
