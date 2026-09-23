import { Component, computed, input } from '@angular/core';
import {
  type AngularToolCall,
  type RegisterComponentConfig,
  type ToolRenderer,
} from '@copilotkit/angular';
import { z } from 'zod';

import { ChartSeries, ResultChart } from '../../dashboard/result-chart/result-chart';

export const pieChartSchema = z.object({
  title: z.string().describe('Short title, e.g. "Revenue share per category"'),
  valueLabel: z.string().describe('What the values are, e.g. "Revenue (USD)"'),
  slices: z
    .array(z.object({ label: z.string(), value: z.number() }))
    .min(1)
    .describe('One slice per aggregate row, e.g. { "label": "Apparel", "value": 171727 }'),
});

export type PieChartArgs = z.infer<typeof pieChartSchema>;

@Component({
  selector: 'app-pie-chart-widget',
  imports: [ResultChart],
  template: `
    @if (args(); as args) {
      <figure>
        <figcaption>{{ args.title }}</figcaption>
        <app-result-chart type="pie" [labels]="labels()" [datasets]="datasets()" />
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
export class PieChartWidget implements ToolRenderer<PieChartArgs> {
  readonly toolCall = input.required<AngularToolCall<PieChartArgs>>();

  protected readonly args = computed(() => toPieChartArgs(this.toolCall().args));
  protected readonly labels = computed(() => this.args()?.slices.map((slice) => slice.label) ?? []);
  protected readonly datasets = computed(() => toDatasets(this.args()));
}

export const pieChartWidget: RegisterComponentConfig<PieChartArgs> = {
  name: 'pieChart',
  description:
    'Shows shares of a whole (sum or count, never avg) as a pie chart in the chat. ' +
    'Use at most 8 slices and combine the smallest ones into a slice named "Other".',
  parameters: pieChartSchema,
  component: PieChartWidget,
};

function toPieChartArgs(args: Partial<PieChartArgs>): PieChartArgs | undefined {
  const slices = args.slices?.filter((slice) => slice?.value !== undefined);
  const result = pieChartSchema.safeParse({ ...args, slices });
  return result.data;
}

function toDatasets(args: PieChartArgs | undefined): ChartSeries[] {
  return args ? [{ label: args.valueLabel, data: args.slices.map((slice) => slice.value) }] : [];
}
