import { Component, computed, input } from '@angular/core';
import {
  type AngularToolCall,
  type RegisterComponentConfig,
  type ToolRenderer,
} from '@copilotkit/angular';

import { ChartData, toChartData } from '../../explore/chart-data';
import { ResultChart } from '../../explore/result-chart/result-chart';
import { AddToDashboardButton } from '../../dashboard/add-to-dashboard-button';
import { BarChartArgs, barChartSchema } from './visualization-schemas';

@Component({
  selector: 'app-bar-chart-widget',
  imports: [ResultChart, AddToDashboardButton],
  template: `
    @if (args(); as args) {
      <figure>
        <figcaption>{{ args.title }}</figcaption>
        <app-result-chart type="bar" [labels]="chart().labels" [datasets]="chart().datasets" />
        @if (chart().note) {
          <p class="hint">{{ chart().note }}</p>
        }
        @if (toolCall().status === 'complete') {
          <app-add-to-dashboard kind="barChart" [args]="args" />
        }
      </figure>
    } @else if (toolCall().status === 'complete') {
      <p class="hint">Can't show this chart: the agent passed incomplete data.</p>
    } @else {
      <div class="loading" role="status">
        <div class="bars" aria-hidden="true">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
        Creating chart …
      </div>
    }
  `,
  host: { class: 'chat-widget' },
})
export class BarChartWidget implements ToolRenderer<BarChartArgs> {
  readonly toolCall = input.required<AngularToolCall<BarChartArgs>>();

  protected readonly args = computed(() => toBarChartArgs(this.toolCall().args));
  protected readonly chart = computed(() => toBarChartData(this.args()));
}

export const barChartWidget: RegisterComponentConfig<BarChartArgs> = {
  name: 'barChart',
  description:
    'Shows values of one or two dimensions as a bar chart in the chat. Use it for comparisons ' +
    'and trends, e.g. revenue per week or per country. For two dimensions, pass the second ' +
    'one as series: the bars are grouped per label with one color per series (at most 8).',
  parameters: barChartSchema,
  component: BarChartWidget,
};

function toBarChartArgs(args: Partial<BarChartArgs>): BarChartArgs | undefined {
  const bars = args.bars?.filter((bar) => bar?.value !== undefined);
  const result = barChartSchema.safeParse({ ...args, bars });
  return result.data;
}

export function toBarChartData(args: BarChartArgs | undefined): ChartData {
  if (!args) {
    return { labels: [], datasets: [], note: '' };
  }
  const grouped = args.bars.some((bar) => typeof bar.series === 'string');
  const rows = args.bars.map((bar) => ({
    label: bar.label,
    series: bar.series ?? args.valueLabel,
    value: bar.value,
  }));
  return toChartData(rows, grouped ? ['label', 'series'] : ['label'], args.valueLabel, 'bar');
}
