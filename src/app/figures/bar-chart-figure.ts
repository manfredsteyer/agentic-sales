import { Component, computed, input, signal } from '@angular/core';

import { BarChartArgs } from '../assistant/tools/visualization-schemas';
import { ChartData, toChartData } from '../explore/chart-data';
import { PivotTable } from '../explore/pivot-table/pivot-table';
import { ResultChart } from '../explore/result-chart/result-chart';
import { AggRow } from '../sales-api';
import { ViewToggle } from './view-toggle';

@Component({
  selector: 'app-bar-chart-figure',
  imports: [ResultChart, PivotTable, ViewToggle],
  template: `
    <figure>
      <figcaption>
        <span>{{ args().title }}</span>
        <app-view-toggle [(table)]="table" />
      </figcaption>
      @if (table()) {
        <app-pivot-table
          [rows]="rows()"
          [dimensions]="dimensions()"
          [valueLabel]="args().valueLabel"
        />
      } @else {
        <app-result-chart type="bar" [labels]="chart().labels" [datasets]="chart().datasets" />
        @if (chart().note) {
          <p class="note">{{ chart().note }}</p>
        }
      }
      <ng-content />
    </figure>
  `,
  host: { class: 'chart-figure' },
})
export class BarChartFigure {
  readonly args = input.required<BarChartArgs>();

  protected readonly table = signal(false);
  protected readonly chart = computed(() => toBarChartData(this.args()));
  protected readonly rows = computed(() => toBarRows(this.args()));
  protected readonly dimensions = computed(() => toBarDimensions(this.args()));
}

function toBarChartData(args: BarChartArgs): ChartData {
  const rows = args.bars.map((bar) => ({
    label: bar.label,
    series: bar.series ?? args.valueLabel,
    value: bar.value,
  }));
  const dimensions = isGrouped(args) ? ['label', 'series'] : ['label'];
  return toChartData(rows, dimensions, args.valueLabel, 'bar');
}

function toBarRows(args: BarChartArgs): AggRow[] {
  return args.bars.map((bar) => ({ Label: bar.label, Series: bar.series ?? '', value: bar.value }));
}

function toBarDimensions(args: BarChartArgs): string[] {
  return isGrouped(args) ? ['Label', 'Series'] : ['Label'];
}

function isGrouped(args: BarChartArgs): boolean {
  return args.bars.some((bar) => typeof bar.series === 'string');
}
