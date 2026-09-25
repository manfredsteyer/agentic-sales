import { Component, computed, inject, input } from '@angular/core';
import {
  type AngularToolCall,
  type RegisterComponentConfig,
  type ToolRenderer,
} from '@copilotkit/angular';
import { DashboardStore } from '../../dashboard/dashboard-store';
import { PivotTable } from '../../figures/pivot-table';
import { PivotTableArgs, pivotTableSchema } from './pivot-table-schema';
import { WidgetLoading } from './widget-loading';
import { WidgetOptions } from './widget-options';

@Component({
  selector: 'app-pivot-table-widget',
  imports: [PivotTable, WidgetLoading],
  template: `
    @let figureArgs = args();
    @let status = toolCall().status;
    @let showAddToDashboard = options.showAddToDashboard();
    <div class="not-prose">
      @if (figureArgs && showAddToDashboard) {
        <app-pivot-table [data]="figureArgs">
          <button
            type="button"
            class="btn btn-sm add-to-dashboard"
            (click)="addToDashboard(figureArgs)"
          >
            <img src="icons/plus.svg" width="14" height="14" alt="" />
            Add to dashboard
          </button>
        </app-pivot-table>
      } @else if (figureArgs) {
        <app-pivot-table [data]="figureArgs" />
      } @else if (status === 'complete') {
        <p class="hint">
          Can't show this table: the agent passed incomplete data.
        </p>
      } @else {
        <app-widget-loading>Creating table …</app-widget-loading>
      }
    </div>
  `,
})
export class PivotTableWidget implements ToolRenderer<PivotTableArgs> {
  readonly toolCall = input.required<AngularToolCall<PivotTableArgs>>();

  protected readonly options = inject(WidgetOptions);
  private readonly dashboardStore = inject(DashboardStore);

  protected readonly args = computed(() =>
    toPivotTableArgs(this.toolCall().args),
  );

  protected addToDashboard(args: PivotTableArgs): void {
    this.dashboardStore.addItem({
      id: crypto.randomUUID(),
      title: args.title,
      kind: 'pivotTable',
      args,
    });
  }
}

export const pivotTableWidget: RegisterComponentConfig<PivotTableArgs> = {
  name: 'pivotTable',
  description: `
    Shows values of two dimensions as a table in the chat: the first dimension spans
    the rows, the second one the columns. Use it when exact values matter.
  `,
  parameters: pivotTableSchema,
  component: PivotTableWidget,
};

function toPivotTableArgs(
  args: Partial<PivotTableArgs>,
): PivotTableArgs | undefined {
  const cells = args.cells?.filter((cell) => cell?.value !== undefined);
  const result = pivotTableSchema.safeParse({ ...args, cells });
  return result.data;
}
