import { Component, computed, inject, input } from '@angular/core';
import {
  type AngularToolCall,
  type RenderToolCallConfig,
  type ToolRenderer,
} from '@copilotkit/angular';
import { Query, QueryResult, queryResultSchema } from '@shared/query-schema';
import { DashboardStore } from '../../../feature-dashboard/dashboard-store/dashboard-store';
import { QueryResultView } from '../../../feature-dashboard/query-result-view';
import { LoadingIndicator } from '../../../shared/loading-indicator';
import { RunQueryArgs, runQuerySchema } from './dashboard-widget-schema';

@Component({
  selector: 'app-dashboard-widget',
  imports: [QueryResultView, LoadingIndicator],
  template: `
    @let result = this.result();
    @let spec = this.spec();
    @let status = toolCall().status;
    <div class="not-prose">
      @if (result?.kind === 'message') {
        <p class="hint">Can't show this visualization: {{ result.message }}</p>
      } @else if (result) {
        <app-query-result-view [result]="result" />
      } @else if (status === 'complete') {
        <p class="hint">Can't show this visualization.</p>
      } @else {
        <app-loading-indicator>Creating chart …</app-loading-indicator>
      }
      @if (result && result.kind !== 'message' && spec) {
        <button
          type="button"
          class="btn btn-sm add-to-dashboard"
          (click)="addToDashboard(spec)"
        >
          <img src="icons/plus.svg" width="14" height="14" alt="" />
          Add to dashboard
        </button>
      }
    </div>
  `,
})
export class DashboardWidget {
  // TODO #7 implement ToolRenderer<RunQueryArgs>

  // TODO #7: Type with AngularToolCall<RunQueryArgs>
  readonly toolCall = input.required<any>();

  private readonly dashboardStore = inject(DashboardStore);

  protected readonly spec = computed(() => toQuery(this.toolCall().args));

  protected readonly result = computed(() =>
    parseResult(this.toolCall().result),
  );

  protected addToDashboard(spec: Query): void {
    this.dashboardStore.addItem({ id: crypto.randomUUID(), spec });
  }
}

function toQuery(args: Partial<RunQueryArgs>): Query | undefined {
  const result = runQuerySchema.safeParse(args);
  return result.data?.spec;
}

function parseResult(json: string | undefined): QueryResult | undefined {
  if (!json) {
    return undefined;
  }
  const result = queryResultSchema.safeParse(JSON.parse(json));
  return result.data;
}

// TODO #7: Provide RenderToolCallConfig<RunQueryArgs>
//    toolName: runQuery
//    component: DashboardWidget
//    schema: runQuerySchema
export const dashboardWidget = {};
