import { Component, computed, input } from '@angular/core';
import {
  type AngularToolCall,
  type RegisterComponentConfig,
  type ToolRenderer,
} from '@copilotkit/angular';
import { z } from 'zod';

import { ChartData, toChartData } from '../../dashboard/chart-data';
import { ResultChart } from '../../dashboard/result-chart/result-chart';

export const barChartSchema = z.object({
  title: z.string().describe('Short title, e.g. "Revenue per week"'),
  valueLabel: z.string().describe('What the values are, e.g. "Revenue (USD)"'),
  bars: z
    .array(
      z.object({
        label: z.string(),
        series: z
          .string()
          .nullish()
          .describe('Value of the second dimension for grouped bars, e.g. "Europe"'),
        value: z.number(),
      }),
    )
    .min(1)
    .describe(
      'One bar per aggregate row, e.g. { "label": "2020-W50", "value": 59842 }. With a second ' +
        'dimension, add its value as series: { "label": "Apparel", "series": "Europe", "value": 21530 }',
    ),
});

export type BarChartArgs = z.infer<typeof barChartSchema>;

@Component({
  selector: 'app-bar-chart-widget',
  imports: [ResultChart],
  template: `
    @if (args(); as args) {
      <figure>
        <figcaption>{{ args.title }}</figcaption>
        <app-result-chart type="bar" [labels]="chart().labels" [datasets]="chart().datasets" />
        @if (chart().note) {
          <p class="hint">{{ chart().note }}</p>
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

function toBarChartData(args: BarChartArgs | undefined): ChartData {
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
