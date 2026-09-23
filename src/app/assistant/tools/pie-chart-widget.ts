import { Component, computed, input } from '@angular/core';
import {
  type AngularToolCall,
  type RegisterComponentConfig,
  type ToolRenderer,
} from '@copilotkit/angular';

import { AddToDashboardButton } from '../../dashboard/add-to-dashboard-button';
import { PieChartFigure } from '../../figures/pie-chart-figure';
import { PieChartArgs, pieChartSchema } from './visualization-schemas';

@Component({
  selector: 'app-pie-chart-widget',
  imports: [PieChartFigure, AddToDashboardButton],
  template: `
    @if (args(); as args) {
      <app-pie-chart-figure [args]="args">
        @if (toolCall().status === 'complete') {
          <app-add-to-dashboard kind="pieChart" [args]="args" />
        }
      </app-pie-chart-figure>
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
  host: { class: 'chat-widget not-prose' },
})
export class PieChartWidget implements ToolRenderer<PieChartArgs> {
  readonly toolCall = input.required<AngularToolCall<PieChartArgs>>();

  protected readonly args = computed(() => toPieChartArgs(this.toolCall().args));
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
