import { A2uiMessage } from '@a2ui/web_core/v0_9';
import type { AbstractAgent, ActivityMessage, Message } from '@ag-ui/client';
import { httpResource } from '@angular/common/http';
import { Component, computed, inject, input } from '@angular/core';
import {
  anyActivityContentSchema,
  CopilotA2UIActivityRenderer,
  parseToolCallArguments,
  type ActivityRenderer,
  type RenderActivityMessageConfig,
} from '@copilotkit/angular';
import {
  DataModelResponse,
  findSurfaceId,
  toDataModelRequest,
  withDataModel,
} from '../../../data/a2ui-data-model';
import { DashboardItem } from '../../../feature-dashboard/dashboard-store/dashboard-model';
import { DashboardStore } from '../../../feature-dashboard/dashboard-store/dashboard-store';
import { AddToDashboardButton } from './add-to-dashboard-button';

interface SurfaceContent {
  a2ui_operations?: A2uiMessage[];
}

@Component({
  selector: 'app-surface-widget',
  imports: [CopilotA2UIActivityRenderer, AddToDashboardButton],
  template: `
    <copilot-a2ui-activity-renderer
      [activityType]="activityType()"
      [content]="surfaceContent()"
      [message]="message()"
      [agent]="agent()"
    />
    @let item = this.item();
    @if (item) {
      <app-add-to-dashboard-button [item]="item" />
    }
  `,
})
export class SurfaceWidget implements ActivityRenderer<SurfaceContent> {
  readonly activityType = input.required<string>();
  readonly content = input.required<SurfaceContent>();
  readonly message = input.required<ActivityMessage>();
  readonly agent = input<AbstractAgent>();

  private readonly dashboardStore = inject(DashboardStore);

  private readonly surfaceId = computed(() =>
    findSurfaceId(this.content().a2ui_operations ?? []),
  );

  private readonly expression = computed(() =>
    findExpression(this.dashboardStore.messages(), this.surfaceId()),
  );

  private readonly dataModel = httpResource<DataModelResponse>(() =>
    toDataModelRequest(this.expression()),
  );

  protected readonly surfaceContent = computed(() =>
    withDataModelContent(this.content(), this.dataModel.value()),
  );

  protected readonly item = computed(() =>
    toDashboardItem(this.surfaceId(), this.expression(), this.surfaceContent()),
  );
}

export const surfaceWidget: RenderActivityMessageConfig = {
  activityType: 'a2ui-surface',
  content: anyActivityContentSchema,
  component: SurfaceWidget,
};

function withDataModelContent(
  content: SurfaceContent,
  response: DataModelResponse | undefined,
): SurfaceContent {
  const operations = content.a2ui_operations;
  if (!response || !operations) {
    return content;
  }
  return { ...content, a2ui_operations: withDataModel(operations, response) };
}

function toDashboardItem(
  surfaceId: string | undefined,
  expression: string | undefined,
  content: SurfaceContent,
): DashboardItem | undefined {
  if (!surfaceId) {
    return undefined;
  }
  return { surfaceId, expression, messages: content.a2ui_operations ?? [] };
}

function findExpression(
  messages: Message[],
  surfaceId: string | undefined,
): string | undefined {
  const renderArgs = messages
    .flatMap((message) =>
      message.role === 'assistant' ? (message.toolCalls ?? []) : [],
    )
    .filter((toolCall) => toolCall.function.name === 'render_a2ui')
    .map((toolCall) => parseToolCallArguments(toolCall.function.arguments))
    .filter((args) => args['surfaceId'] === surfaceId);
  const lastArgs = renderArgs.at(-1);
  const expression = lastArgs?.['expression'];
  return typeof expression === 'string' ? expression : undefined;
}
