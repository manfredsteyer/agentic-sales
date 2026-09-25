import { Component, computed, input } from '@angular/core';
import {
  type AngularToolCall,
  type RegisterComponentConfig,
  type ToolRenderer,
} from '@copilotkit/angular';
import { PieChart } from '../../../shared/charts/pie-chart';
import { LoadingIndicator } from '../../../shared/loading-indicator';
import { PieChartArgs, pieChartSchema } from './pie-chart-schema';

@Component({
  selector: 'app-pie-chart-widget',
  imports: [PieChart, LoadingIndicator],
  template: `
    @let figureArgs = args();
    @let status = toolCall().status;
    <div class="not-prose">
      @if (figureArgs) {
        <app-pie-chart [data]="figureArgs" />
      } @else if (status === 'complete') {
        <p class="hint">
          Can't show this chart: the agent passed incomplete data.
        </p>
      } @else {
        <app-loading-indicator>Creating chart …</app-loading-indicator>
      }
    </div>
  `,
})
export class PieChartWidget implements ToolRenderer<PieChartArgs> {
  readonly toolCall = input.required<AngularToolCall<PieChartArgs>>();

  protected readonly args = computed(() =>
    toPieChartArgs(this.toolCall().args),
  );
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
  const result = pieChartSchema.safeParse(args);
  return result.data;
}
