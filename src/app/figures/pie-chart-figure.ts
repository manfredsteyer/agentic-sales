import { Component, computed, input, signal } from '@angular/core';

import { PieChartArgs } from '../assistant/tools/visualization-schemas';
import { ChartSeries, ResultChart } from '../explore/result-chart/result-chart';
import { PivotTable } from '../explore/pivot-table/pivot-table';
import { AggRow } from '../sales-api';
import { ViewToggle } from './view-toggle';

@Component({
  selector: 'app-pie-chart-figure',
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
          [dimensions]="['Label']"
          [valueLabel]="args().valueLabel"
        />
      } @else {
        <app-result-chart type="pie" [labels]="labels()" [datasets]="datasets()" />
      }
      <ng-content />
    </figure>
  `,
  host: { class: 'chart-figure' },
})
export class PieChartFigure {
  readonly args = input.required<PieChartArgs>();

  protected readonly table = signal(false);
  protected readonly labels = computed(() => this.args().slices.map((slice) => slice.label));
  protected readonly datasets = computed(() => toDatasets(this.args()));
  protected readonly rows = computed(() => toPieRows(this.args()));
}

function toDatasets(args: PieChartArgs): ChartSeries[] {
  return [{ label: args.valueLabel, data: args.slices.map((slice) => slice.value) }];
}

function toPieRows(args: PieChartArgs): AggRow[] {
  return args.slices.map((slice) => ({ Label: slice.label, value: slice.value }));
}
