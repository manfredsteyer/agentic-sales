import { Component, computed, input, signal } from '@angular/core';
import {
  type AngularToolCall,
  type RegisterComponentConfig,
  type ToolRenderer,
} from '@copilotkit/angular';
import { BarChart } from '../../../shared/charts/bar-chart';
import { LoadingIndicator } from '../../../shared/loading-indicator';
import { BarChartArgs, barChartSchema } from './bar-chart-schema';

@Component({
  selector: 'app-bar-chart-widget',
  imports: [BarChart, LoadingIndicator],
  template: `
    @let call = toolCall();
    @let status = call.status;
    <div class="not-prose">
      @if (hasValidArgs() && call.status !== 'in-progress') {
        <app-bar-chart [data]="call.args" />
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
export class BarChartWidget {
  // TODO #2: Implement ToolRenderer<BarChartArgs>
  // TODO #2: Add required input for toolCall, AngularToolCall<BarChartArgs>

  // TODO #2: Check for valid args
  protected readonly hasValidArgs = computed(() => true);
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

function isValid(args: Partial<BarChartArgs>): boolean {
  const result = barChartSchema.safeParse(args);
  return result.success;
}
