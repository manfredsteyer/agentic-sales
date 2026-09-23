import { Component, computed, input } from '@angular/core';
import {
  type AngularToolCall,
  type RegisterComponentConfig,
  type ToolRenderer,
} from '@copilotkit/angular';

import { ChartData } from '../../explore/chart-data';
import { ResultChart } from '../../explore/result-chart/result-chart';
import { AddToDashboardButton } from '../../dashboard/add-to-dashboard-button';
import { PieChartArgs, pieChartSchema } from './visualization-schemas';

@Component({
  selector: 'app-pie-chart-widget',
  imports: [ResultChart, AddToDashboardButton],
  template: `
    @if (args(); as args) {
      <figure>
        <figcaption>{{ args.title }}</figcaption>
        <app-result-chart type="pie" [labels]="chart().labels" [datasets]="chart().datasets" />
        @if (toolCall().status === 'complete') {
          <app-add-to-dashboard kind="pieChart" [args]="args" />
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
export class PieChartWidget implements ToolRenderer<PieChartArgs> {
  readonly toolCall = input.required<AngularToolCall<PieChartArgs>>();

  protected readonly args = computed(() => toPieChartArgs(this.toolCall().args));
  protected readonly chart = computed(() => toPieChartData(this.args()));
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

export function toPieChartData(args: PieChartArgs | undefined): ChartData {
  if (!args) {
    return { labels: [], datasets: [], note: '' };
  }
  return {
    labels: args.slices.map((slice) => slice.label),
    datasets: [{ label: args.valueLabel, data: args.slices.map((slice) => slice.value) }],
    note: '',
  };
}
