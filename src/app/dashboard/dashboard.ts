import { Component, inject, signal } from '@angular/core';
import { DASHBOARD_AGENT_ID } from '../agents/dashboard-agent';
import { WidgetOptions } from '../agents/widgets/widget-options';
import { AssistantChat } from '../assistant-chat/assistant-chat';
import { BarChart } from '../figures/bar-chart';
import { PieChart } from '../figures/pie-chart';
import { PivotTable } from '../figures/pivot-table';
import { DashboardStore } from './dashboard-store';

@Component({
  selector: 'app-dashboard',
  imports: [AssistantChat, BarChart, PieChart, PivotTable],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  host: { '[class.with-chat]': 'chatVisible()' },
})
export class Dashboard {
  protected readonly agentId = DASHBOARD_AGENT_ID;
  protected readonly options = inject(WidgetOptions);
  protected readonly store = inject(DashboardStore);

  protected readonly chatVisible = signal(true);

  constructor() {
    this.options.showAddToDashboard.set(true);
  }

  protected toggleChat(): void {
    this.chatVisible.update((visible) => !visible);
  }
}
