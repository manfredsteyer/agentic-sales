import { Component, computed, input, signal } from '@angular/core';
import { AggRow } from '../../data/sales-model';
import { ChartData, toChartData } from '../../feature-explorer/chart-data';
import { ExplorerTable } from '../../feature-explorer/explorer-table/explorer-table';
import { ViewToggle } from '../view-toggle';
import { Chart } from './chart';

export interface Bar {
  label: string;
  series?: string | null;
  value: number;
}

export interface BarChartData {
  title: string;
  valueLabel: string;
  bars: Bar[];
}

@Component({
  selector: 'app-bar-chart',
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
          [dimensions]="dimensions()"
          [valueLabel]="data().valueLabel"
        />
      } @else {
        <app-chart
          type="bar"
          [labels]="chart().labels"
          [datasets]="chart().datasets"
        />
      }
      @if (!table() && chart().note) {
        <p class="note">{{ chart().note }}</p>
      }
    </figure>
  `,
})
export class BarChart {
  readonly data = input.required<BarChartData>();

  protected readonly table = signal(false);
  protected readonly chart = computed(() => toChart(this.data()));
  protected readonly rows = computed(() => toBarRows(this.data()));
  protected readonly dimensions = computed(() => toBarDimensions(this.data()));
}

function toChart(data: BarChartData): ChartData {
  const rows = data.bars.map((bar) => ({
    label: bar.label,
    series: bar.series ?? data.valueLabel,
    value: bar.value,
  }));
  const dimensions = isGrouped(data) ? ['label', 'series'] : ['label'];
  return toChartData(rows, dimensions, data.valueLabel, 'bar');
}

function toBarRows(data: BarChartData): AggRow[] {
  return data.bars.map((bar) => ({
    Label: bar.label,
    Series: bar.series ?? '',
    value: bar.value,
  }));
}

function toBarDimensions(data: BarChartData): string[] {
  return isGrouped(data) ? ['Label', 'Series'] : ['Label'];
}

function isGrouped(data: BarChartData): boolean {
  return data.bars.some((bar) => typeof bar.series === 'string');
}
