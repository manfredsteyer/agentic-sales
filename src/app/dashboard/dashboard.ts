import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import {
  AggregateFn,
  AggregateResponse,
  SalesApi,
  formatValue,
} from '../sales-api';
import { ResultChart } from './result-chart/result-chart';
import { ChartData, toChartData } from './chart-data';
import { PivotTable } from './pivot-table/pivot-table';
import { FilterRow, FilterSpec } from './filter-row/filter-row';

type ViewMode = 'bar' | 'pie' | 'pivot';

@Component({
  selector: 'app-dashboard',
  imports: [ResultChart, PivotTable, FilterRow],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private readonly api = inject(SalesApi);

  readonly schema = this.api.schema;
  readonly columns = computed(() =>
    this.schema.hasValue() ? this.schema.value().columns : [],
  );

  // --- query controls -------------------------------------------------------
  readonly aggregateFn = signal<AggregateFn>('sum');

  /** avg/sum need a numeric fact column; count works on any column. */
  readonly factColumns = computed(() =>
    this.columns()
      .filter((c) => this.aggregateFn() === 'count' || c.numeric)
      .map((c) => c.name),
  );
  readonly fact = linkedSignal<string[], string>({
    source: this.factColumns,
    computation: (cols, previous) =>
      previous && cols.includes(previous.value)
        ? previous.value
        : cols.includes('Revenue')
          ? 'Revenue'
          : (cols[0] ?? ''),
  });

  readonly dimensionColumns = computed(() =>
    this.columns()
      .filter((c) => c.type === 'VARCHAR')
      .map((c) => c.name),
  );
  readonly dim1 = linkedSignal<string[], string>({
    source: this.dimensionColumns,
    computation: (cols, previous) =>
      previous && cols.includes(previous.value)
        ? previous.value
        : cols.includes('Country')
          ? 'Country'
          : (cols[0] ?? ''),
  });
  readonly dim2 = signal('');
  readonly dim2Columns = computed(() =>
    this.dimensionColumns().filter((c) => c !== this.dim1()),
  );

  readonly filters = signal<FilterSpec[]>([]);
  private readonly completeFilters = computed(() =>
    Object.fromEntries(
      this.filters()
        .filter((f) => f.column && f.value)
        .map((f) => [f.column, f.value]),
    ),
  );

  // --- data -----------------------------------------------------------------
  readonly result = httpResource<AggregateResponse>(() => {
    const fact = this.fact();
    const dimensions = [this.dim1(), this.dim2()].filter(Boolean);
    if (!fact || dimensions.length === 0) return undefined;
    return this.api.aggregateRequest({
      Fact: fact,
      AggregateFn: this.aggregateFn(),
      Dimensions: dimensions,
      Filter: this.completeFilters(),
    });
  });

  readonly errorMessage = computed(() => {
    const err = this.result.error() as { error?: { error?: string } } | undefined;
    return err
      ? (err.error?.error ?? 'Server nicht erreichbar (npm run server)')
      : '';
  });

  // --- view -----------------------------------------------------------------
  readonly viewMode = signal<ViewMode>('bar');
  /** A pie shows parts of a whole: one dimension, additive aggregate only. */
  readonly pieAllowed = computed(
    () => !this.dim2() && this.aggregateFn() !== 'avg',
  );
  readonly effectiveView = computed<ViewMode>(() =>
    this.viewMode() === 'pie' && !this.pieAllowed() ? 'bar' : this.viewMode(),
  );

  readonly valueLabel = computed(() => `${this.aggregateFn()}(${this.fact()})`);

  readonly chart = computed<ChartData>(() => {
    if (!this.result.hasValue()) return { labels: [], datasets: [], note: '' };
    const { rows, dimensions } = this.result.value();
    const type = this.effectiveView() === 'pie' ? 'pie' : 'bar';
    return toChartData(rows, dimensions, this.valueLabel(), type);
  });

  // --- event handlers -------------------------------------------------------
  readonly formatValue = formatValue;

  setAggregateFn(value: string) {
    this.aggregateFn.set(value as AggregateFn);
  }

  addFilter() {
    if (this.filters().length < 2) {
      this.filters.update((f) => [...f, { column: '', value: '' }]);
    }
  }

  updateFilter(index: number, spec: FilterSpec) {
    this.filters.update((f) => f.map((old, i) => (i === index ? spec : old)));
  }

  removeFilter(index: number) {
    this.filters.update((f) => f.filter((_, i) => i !== index));
  }
}
