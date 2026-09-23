import { Component, computed, input, signal } from '@angular/core';

import { toBarChartData } from '../assistant/tools/bar-chart-widget';
import { toPieChartData } from '../assistant/tools/pie-chart-widget';
import { toPivotRows } from '../assistant/tools/pivot-table-widget';
import { ChartData } from '../explore/chart-data';
import { PivotTable } from '../explore/pivot-table/pivot-table';
import { ResultChart } from '../explore/result-chart/result-chart';
import { AggRow } from '../sales-api';
import { DashboardItem } from './dashboard-state';

@Component({
  selector: 'app-dashboard-tile',
  imports: [ResultChart, PivotTable],
  template: `
    @let entry = item();
    <figure>
      <figcaption>
        <span>{{ entry.title }}</span>
        @if (entry.kind !== 'pivotTable') {
          <button
            type="button"
            class="view-toggle"
            [attr.aria-label]="table() ? 'Show chart' : 'Show table'"
            [title]="table() ? 'Show chart' : 'Show table'"
            (click)="toggleTable()"
          >
            @if (table()) {
              <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                <path d="M3 13V7M8 13V3M13 13V9" />
              </svg>
            } @else {
              <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                <rect x="2" y="3" width="12" height="10" rx="1" />
                <path d="M2 7h12M6 3v10" />
              </svg>
            }
          </button>
        }
      </figcaption>
      @if (table() || entry.kind === 'pivotTable') {
        <app-pivot-table
          [rows]="rows()"
          [dimensions]="dimensions()"
          [valueLabel]="entry.args.valueLabel"
        />
      } @else {
        <app-result-chart
          [type]="entry.kind === 'pieChart' ? 'pie' : 'bar'"
          [labels]="chart().labels"
          [datasets]="chart().datasets"
        />
      }
    </figure>
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
      --chart-height: 16rem;
    }

    figure {
      margin: 0;
      padding: 0.75rem;
      border: 1px solid var(--border);
      border-radius: 0.75rem;
      background: var(--surface-1);
    }

    figcaption {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
      font-weight: 600;
    }

    .view-toggle {
      display: inline-flex;
      padding: 0.25rem;
      border: 1px solid transparent;
      border-radius: 0.375rem;
      background: transparent;
      color: var(--text-secondary);
      cursor: pointer;
    }

    .view-toggle:hover {
      color: var(--text-primary);
      border-color: var(--border);
    }

    .view-toggle svg {
      fill: none;
      stroke: currentColor;
      stroke-width: 1.5;
      stroke-linecap: round;
    }
  `,
})
export class DashboardTile {
  readonly item = input.required<DashboardItem>();

  protected readonly table = signal(false);
  protected readonly chart = computed(() => toTileChart(this.item()));
  protected readonly rows = computed(() => toTileRows(this.item()));
  protected readonly dimensions = computed(() => toTileDimensions(this.item()));

  protected toggleTable(): void {
    this.table.update((table) => !table);
  }
}

function toTileChart(item: DashboardItem): ChartData {
  switch (item.kind) {
    case 'barChart':
      return toBarChartData(item.args);
    case 'pieChart':
      return toPieChartData(item.args);
    default:
      return { labels: [], datasets: [], note: '' };
  }
}

function toTileRows(item: DashboardItem): AggRow[] {
  switch (item.kind) {
    case 'barChart':
      return item.args.bars.map((bar) => ({
        Label: bar.label,
        Series: bar.series ?? '',
        value: bar.value,
      }));
    case 'pieChart':
      return item.args.slices.map((slice) => ({ Label: slice.label, value: slice.value }));
    default:
      return toPivotRows(item.args);
  }
}

function toTileDimensions(item: DashboardItem): string[] {
  switch (item.kind) {
    case 'barChart':
      return item.args.bars.some((bar) => typeof bar.series === 'string')
        ? ['Label', 'Series']
        : ['Label'];
    case 'pieChart':
      return ['Label'];
    default:
      return [item.args.rowDimension, item.args.columnDimension];
  }
}
