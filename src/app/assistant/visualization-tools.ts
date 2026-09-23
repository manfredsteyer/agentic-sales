import { Component, input } from '@angular/core';
import { type AngularToolCall, type ToolRenderer } from '@copilotkit/angular';
import { z } from 'zod';

import { createComponentTool } from '../util-copilotkit/tool-definition';
import { Visualization, type VisualizationArgs, visualizationSchema } from './visualization';

// Components the agent can call to show aggregate rows in the chat. They are
// display-only: no handler, CopilotKit renders the component with the args.

@Component({
  selector: 'app-bar-chart-tool',
  imports: [Visualization],
  template: `<app-visualization view="bar" [toolCall]="toolCall()" />`,
})
export class BarChartTool implements ToolRenderer<VisualizationArgs> {
  readonly toolCall = input.required<AngularToolCall<VisualizationArgs>>();
}

@Component({
  selector: 'app-pie-chart-tool',
  imports: [Visualization],
  template: `<app-visualization view="pie" [toolCall]="toolCall()" />`,
})
export class PieChartTool implements ToolRenderer<VisualizationArgs> {
  readonly toolCall = input.required<AngularToolCall<VisualizationArgs>>();
}

@Component({
  selector: 'app-pivot-table-tool',
  imports: [Visualization],
  template: `<app-visualization view="pivot" [toolCall]="toolCall()" />`,
})
export class PivotTableTool implements ToolRenderer<VisualizationArgs> {
  readonly toolCall = input.required<AngularToolCall<VisualizationArgs>>();
}

export const barChartTool = createComponentTool({
  name: 'barChart',
  description:
    'Shows aggregate rows as a bar chart in the chat. Use it for comparisons and ' +
    'trends, e.g. revenue per week or per country. With two dimensions, the second ' +
    'one becomes the series (at most 8 are shown).',
  parameters: visualizationSchema,
  component: BarChartTool,
  followUp: false,
});

export const pieChartTool = createComponentTool({
  name: 'pieChart',
  description:
    'Shows aggregate rows of ONE dimension as a pie chart in the chat. Only for ' +
    'shares of a whole (sum or count, never avg). More than 8 slices are folded ' +
    'into "Sonstige".',
  parameters: visualizationSchema.extend({
    dimensions: z.array(z.string()).length(1).describe('The one dimension, e.g. ["ItemCategory"]'),
  }),
  component: PieChartTool,
  followUp: false,
});

export const pivotTableTool = createComponentTool({
  name: 'pivotTable',
  description:
    'Shows aggregate rows as a table in the chat. With two dimensions, the first ' +
    'one spans the rows and the second one the columns. Use it when exact values ' +
    'matter or for two dimensions with many values.',
  parameters: visualizationSchema,
  component: PivotTableTool,
  followUp: false,
});
