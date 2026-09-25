import { Component, computed, inject, input } from '@angular/core';
import {
  type AngularToolCall,
  type RegisterComponentConfig,
  type ToolRenderer,
} from '@copilotkit/angular';
import { DashboardStore } from '../../dashboard/dashboard-store';
import { PieChart } from '../../figures/pie-chart';
import { PieChartArgs, pieChartSchema } from './pie-chart-schema';
import { WidgetLoading } from './widget-loading';
import { WidgetOptions } from './widget-options';

@Component({
  selector: 'app-pie-chart-widget',
  imports: [PieChart, WidgetLoading],
  template: `
    @let figureArgs = args();
    @let status = toolCall().status;
    @let showAddToDashboard = options.showAddToDashboard();
    <div class="not-prose">
      @if (figureArgs && showAddToDashboard) {
        <app-pie-chart [data]="figureArgs">
          <button
            type="button"
            class="btn btn-sm add-to-dashboard"
            (click)="addToDashboard(figureArgs)"
          >
            <img src="icons/plus.svg" width="14" height="14" alt="" />
            Add to dashboard
          </button>
        </app-pie-chart>
      } @else if (figureArgs) {
        <app-pie-chart [data]="figureArgs" />
      } @else if (status === 'complete') {
        <p class="hint">
          Can't show this chart: the agent passed incomplete data.
        </p>
      } @else {
        <app-widget-loading>Creating chart …</app-widget-loading>
      }
    </div>
  `,
})
export class PieChartWidget implements ToolRenderer<PieChartArgs> {
  readonly toolCall = input.required<AngularToolCall<PieChartArgs>>();

  protected readonly options = inject(WidgetOptions);
  private readonly dashboardStore = inject(DashboardStore);

  protected readonly args = computed(() =>
    toPieChartArgs(this.toolCall().args),
  );

  protected addToDashboard(args: PieChartArgs): void {
    this.dashboardStore.addItem({
      id: crypto.randomUUID(),
      title: args.title,
      kind: 'pieChart',
      args,
    });
  }
}

export const pieChartWidget: RegisterComponentConfig<PieChartArgs> = {
  name: 'pieChart',
  description: `
    Shows shares of a whole (sum or count, never avg) as a pie chart in the chat.
    Use at most 8 slices and combine the smallest ones into a slice named "Other".
  `,
  parameters: pieChartSchema,
  component: PieChartWidget,
};

function toPieChartArgs(args: Partial<PieChartArgs>): PieChartArgs | undefined {
  const slices = args.slices?.filter((slice) => slice?.value !== undefined);
  const result = pieChartSchema.safeParse({ ...args, slices });
  return result.data;
}
