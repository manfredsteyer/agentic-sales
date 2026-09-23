import { Component, computed, effect, signal } from '@angular/core';
import { injectAgentStore } from '@copilotkit/angular';

import { DASHBOARD_AGENT_ID } from '../assistant/agent-ids';
import { AssistantChat } from '../assistant/assistant-chat';
import { BarChartFigure } from '../figures/bar-chart-figure';
import { PieChartFigure } from '../figures/pie-chart-figure';
import { PivotTableFigure } from '../figures/pivot-table-figure';
import { saveDashboard, toDashboardItems } from './dashboard-state';

@Component({
  selector: 'app-dashboard',
  imports: [AssistantChat, BarChartFigure, PieChartFigure, PivotTableFigure],
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
