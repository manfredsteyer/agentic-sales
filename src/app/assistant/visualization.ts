import { Component, computed, input } from '@angular/core';
import { type AngularToolCall } from '@copilotkit/angular';
import { z } from 'zod';

import { toChartData } from '../dashboard/chart-data';
import { PivotTable } from '../dashboard/pivot-table/pivot-table';
import { ResultChart } from '../dashboard/result-chart/result-chart';
import { AggRow } from '../sales-api';

// Points with fixed keys instead of aggregate rows keyed by dimension name:
// the model cannot fill objects with arbitrary keys through a tool schema.
const pointSchema = z.object({
  label: z.string().describe('Value of the first dimension, e.g. "2020-12"'),
  series: z
    .string()
    .nullish()
    .describe('Value of the second dimension, e.g. "mobile"; omit with one dimension'),
  value: z.number(),
});

/** What the agent passes to barChart, pieChart and pivotTable. */
export const visualizationSchema = z.object({
  title: z.string().describe('Short title, e.g. "Revenue per month"'),
  dimensions: z
    .array(z.string())
    .min(1)
    .max(2)
    .describe('Names of the dimensions, e.g. ["Month"] or ["Month", "DeviceCategory"]'),
  valueLabel: z.string().describe('What `value` is, e.g. "Revenue (USD)" or "Orders"'),
  points: z
    .array(pointSchema)
    .describe(
      'One point per aggregate row, e.g. { "label": "2020-12", "value": 160498 } or ' +
        '{ "label": "2020-12", "series": "mobile", "value": 60423 }',
    ),
});

export type VisualizationArgs = z.infer<typeof visualizationSchema>;
export type VisualizationView = 'bar' | 'pie' | 'pivot';

interface VisualizationData {
  title: string;
  dimensions: string[];
  valueLabel: string;
  rows: AggRow[];
}

/** Validated arguments as aggregate rows, or null if the model sent unusable ones. */
function toVisualizationData(args: unknown): VisualizationData | null {
  const parsed = visualizationSchema.safeParse(args);
  if (!parsed.success) return null;
  const { title, dimensions, valueLabel, points } = parsed.data;
  const [d1, d2] = dimensions;
  const rows = points.map((p) =>
    d2
      ? { [d1]: p.label, [d2]: p.series ?? '', value: p.value }
      : { [d1]: p.label, value: p.value },
  );
  return { title, dimensions, valueLabel, rows };
}

/** Renders a visualization tool call with the dashboard's chart and pivot table. */
@Component({
  selector: 'app-visualization',
  imports: [ResultChart, PivotTable],
  template: `
    @if (streaming()) {
      <p class="hint">Erstelle Darstellung …</p>
    } @else if (data(); as d) {
      <figure>
        <figcaption>{{ d.title }}</figcaption>
        @if (d.rows.length === 0) {
          <p class="hint">Keine Daten.</p>
        } @else if (view() === 'pivot') {
          <app-pivot-table
            [rows]="d.rows"
            [dimensions]="d.dimensions"
            [valueLabel]="d.valueLabel"
          />
        } @else if (chart(); as c) {
          <app-result-chart
            [type]="view() === 'pie' ? 'pie' : 'bar'"
            [labels]="c.labels"
            [datasets]="c.datasets"
          />
          @if (c.note) {
            <p class="hint">{{ c.note }}</p>
          }
        }
      </figure>
    } @else {
      <p class="hint">
        Die Darstellung ist nicht möglich: Der Agent hat unvollständige Daten übergeben.
      </p>
    }
  `,
  styles: `
    figure {
      margin: 0.5rem 0;
      padding: 0.75rem;
      border: 1px solid var(--border);
      border-radius: 0.75rem;
      background: var(--surface-1);
    }

    figcaption {
      margin-bottom: 0.5rem;
      font-weight: 600;
    }

    .hint {
      margin: 0.5rem 0 0;
      color: var(--text-secondary);
      font-size: 0.85rem;
    }
  `,
})
export class Visualization {
  readonly view = input.required<VisualizationView>();
  readonly toolCall = input.required<AngularToolCall<VisualizationArgs>>();

  /** While the model streams the arguments, they are incomplete. */
  protected readonly streaming = computed(() => this.toolCall().status === 'in-progress');

  protected readonly data = computed(() =>
    this.streaming() ? null : toVisualizationData(this.toolCall().args),
  );

  protected readonly chart = computed(() => {
    const data = this.data();
    const view = this.view();
    if (!data || view === 'pivot') return undefined;
    // a pie shows parts of one whole, so only the first dimension counts
    const dimensions = view === 'pie' ? data.dimensions.slice(0, 1) : data.dimensions;
    return toChartData(data.rows, dimensions, data.valueLabel, view);
  });
}
