import { Component, computed } from '@angular/core';
import { BarChart } from '../../../shared/charts/bar-chart';
import { LoadingIndicator } from '../../../shared/loading-indicator';
import { BarChartArgs, barChartSchema } from './bar-chart-schema';

@Component({
  selector: 'app-bar-chart-widget',
  imports: [BarChart, LoadingIndicator],
  template: ` <!-- TODO #2: Add template --> `,
})
export class BarChartWidget {
  // TODO #2: Implement ToolRenderer<BarChartArgs>
  // TODO #2: Add required input for toolCall, AngularToolCall<BarChartArgs>

  // TODO #2: Check for valid args
  protected readonly hasValidArgs = computed(() => true);
}

// TODO #2: Provide RegisterComponentConfig<BarChartArgs>
// Description:
//     Shows values of one or two dimensions as a bar chart in the chat. Use it for comparisons
//     and trends, e.g. revenue per week or per country. For two dimensions, pass the second
//     one as series: the bars are grouped per label with one color per series (at most 8).
export const barChartWidget = {};

function isValid(args: Partial<BarChartArgs>): boolean {
  const result = barChartSchema.safeParse(args);
  return result.success;
}

/*
  @let call = toolCall();
  <div class="not-prose">
    @if (hasValidArgs() && call.status !== 'in-progress') {
      <app-bar-chart [data]="call.args" />
    } @else if (call.status === 'complete') {
      <p class="hint">
        Can't show this chart: the agent passed incomplete data.
      </p>
    } @else {
      <app-loading-indicator>Creating chart …</app-loading-indicator>
    }
  </div>
*/
