import { Component, computed, inject, input } from '@angular/core';
import {
  CopilotMCPAppsWidget,
  type MCPAppsSnapshotContent,
} from '@copilotkit/angular/mcp-apps';
import { DashboardStore } from '../../feature-dashboard/dashboard-store/dashboard-store';

@Component({
  selector: 'app-a2ui-mcp-app',
  imports: [CopilotMCPAppsWidget],
  template: `
    <copilot-mcp-apps-widget [data]="data()" [agent]="dashboardStore.agent()" />
  `,
})
export class A2uiMcpApp {
  readonly resourceUri = input.required<string>();
  readonly toolInput = input.required<Record<string, unknown>>();

  protected readonly dashboardStore = inject(DashboardStore);

  protected readonly data = computed(() =>
    toSnapshotContent(this.resourceUri(), this.toolInput()),
  );
}

function toSnapshotContent(
  resourceUri: string,
  toolInput: Record<string, unknown>,
): MCPAppsSnapshotContent {
  // assume the stock server for simplicity; the middleware finds it by serverId, so the hash is a placeholder
  return {
    resourceUri,
    toolInput,
    serverId: 'stock',
    serverHash: 'stock',
    result: { content: [] },
  };
}
