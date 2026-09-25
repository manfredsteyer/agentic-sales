import { Component, computed, inject, input } from '@angular/core';
import {
  type AngularToolCall,
  type RegisterComponentConfig,
  type ToolRenderer,
} from '@copilotkit/angular';
import { DashboardStore } from '../../dashboard/dashboard-store';
import { BarChart } from '../../figures/bar-chart';
import { BarChartArgs, barChartSchema } from './bar-chart-schema';
import { WidgetLoading } from './widget-loading';
import { WidgetOptions } from './widget-options';

@Component({
  selector: 'app-bar-chart-widget',
  imports: [BarChart, WidgetLoading],
  template: `
    @let figureArgs = args();
    @let status = toolCall().status;
    @let showAddToDashboard = options.showAddToDashboard();
    <div class="not-prose">
      @if (figureArgs && showAddToDashboard) {
        <app-bar-chart [data]="figureArgs">
          <button
            type="button"
            class="btn btn-sm add-to-dashboard"
            (click)="addToDashboard(figureArgs)"
          >
            <img src="icons/plus.svg" width="14" height="14" alt="" />
            Add to dashboard
          </button>
        </app-bar-chart>
      } @else if (figureArgs) {
        <app-bar-chart [data]="figureArgs" />
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
export class BarChartWidget implements ToolRenderer<BarChartArgs> {
  readonly toolCall = input.required<AngularToolCall<BarChartArgs>>();

  protected readonly options = inject(WidgetOptions);
  private readonly dashboardStore = inject(DashboardStore);

  protected readonly args = computed(() =>
    toBarChartArgs(this.toolCall().args),
  );

  protected addToDashboard(args: BarChartArgs): void {
    this.dashboardStore.addItem({
      id: crypto.randomUUID(),
      title: args.title,
      kind: 'barChart',
      args,
    });
  }
}

export const barChartWidget: RegisterComponentConfig<BarChartArgs> = {
  name: 'barChart',
  description: `
    Shows values of one or two dimensions as a bar chart in the chat. Use it for comparisons
    and trends, e.g. revenue per week or per country. For two dimensions, pass the second
    one as series: the bars are grouped per label with one color per series (at most 8).
  `,
  parameters: barChartSchema,
  component: BarChartWidget,
};

function toBarChartArgs(args: Partial<BarChartArgs>): BarChartArgs | undefined {
  const bars = args.bars?.filter((bar) => bar?.value !== undefined);
  const result = barChartSchema.safeParse({ ...args, bars });
  return result.data;
}
