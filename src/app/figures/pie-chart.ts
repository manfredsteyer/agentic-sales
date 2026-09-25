import { Component, computed, input, signal } from '@angular/core';
import { AggRow } from '../data/sales-model';
import { ExplorerTable } from '../explorer/explorer-table/explorer-table';
import { Chart, ChartSeries } from './chart';
import { ViewToggle } from './view-toggle';

export interface Slice {
  label: string;
  value: number;
}

export interface PieChartData {
  title: string;
  valueLabel: string;
  slices: Slice[];
}

@Component({
  selector: 'app-pie-chart',
  imports: [Chart, ExplorerTable, ViewToggle],
  template: `
    <figure>
      <figcaption>
        <span>{{ data().title }}</span>
        <app-view-toggle [(table)]="table" />
      </figcaption>
      @if (table()) {
        <app-explorer-table
          [rows]="rows()"
          [dimensions]="['Label']"
          [valueLabel]="data().valueLabel"
        />
      } @else {
        <app-chart type="pie" [labels]="labels()" [datasets]="datasets()" />
      }
      <ng-content />
    </figure>
  `,
})
export class PieChart {
  readonly data = input.required<PieChartData>();

  protected readonly table = signal(false);
  protected readonly labels = computed(() =>
    this.data().slices.map((slice) => slice.label),
  );
  protected readonly datasets = computed(() => toDatasets(this.data()));
  protected readonly rows = computed(() => toPieRows(this.data()));
}

function toDatasets(data: PieChartData): ChartSeries[] {
  return [
    { label: data.valueLabel, data: data.slices.map((slice) => slice.value) },
  ];
}

function toPieRows(data: PieChartData): AggRow[] {
  return data.slices.map((slice) => ({
    Label: slice.label,
    value: slice.value,
  }));
}
