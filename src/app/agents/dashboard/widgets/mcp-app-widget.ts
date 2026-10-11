import type { AbstractAgent, ActivityMessage } from '@ag-ui/client';
import { Component, computed, input } from '@angular/core';
import {
  type ActivityRenderer,
  type RenderActivityMessageConfig,
} from '@copilotkit/angular';
import {
  CopilotMCPAppsActivityRenderer,
  mcpAppsActivityRendererConfig,
  type MCPAppsSnapshotContent,
} from '@copilotkit/angular/mcp-apps';
import { DashboardItem } from '../../../feature-dashboard/dashboard-store/dashboard-model';
import { SALES_CATALOG_ID } from '../../../shared/a2ui/sales-catalog-definitions';
import { AddToDashboardButton } from './add-to-dashboard-button';

@Component({
  selector: 'app-mcp-app-widget',
  imports: [CopilotMCPAppsActivityRenderer, AddToDashboardButton],
  template: `
    <copilot-mcp-apps-activity-renderer
      [activityType]="activityType()"
      [content]="content()"
      [message]="message()"
      [agent]="agent()"
    />
    <app-add-to-dashboard-button [item]="item()" />
  `,
})
export class McpAppWidget implements ActivityRenderer<MCPAppsSnapshotContent> {
  readonly activityType = input.required<string>();
  readonly content = input.required<MCPAppsSnapshotContent>();
  readonly message = input.required<ActivityMessage>();
  readonly agent = input<AbstractAgent>();

  protected readonly item = computed(() =>
    toDashboardItem(this.message().id, this.content()),
  );
}

export const mcpAppWidget: RenderActivityMessageConfig = {
  ...mcpAppsActivityRendererConfig,
  component: McpAppWidget,
};

function toDashboardItem(
  surfaceId: string,
  { resourceUri, toolInput = {} }: MCPAppsSnapshotContent,
): DashboardItem {
  const components = [
    { id: 'root', component: 'Column', children: ['app'] },
    { id: 'app', component: 'McpApp', resourceUri, toolInput },
  ];
  return {
    surfaceId,
    messages: [
      {
        version: 'v0.9',
        createSurface: { surfaceId, catalogId: SALES_CATALOG_ID },
      },
      { version: 'v0.9', updateComponents: { surfaceId, components } },
    ],
  };
}
