import { Component, computed, inject, input } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { AggregateFn, AggregateResponse, ColumnInfo, SalesApi, formatValue } from '../sales-api';
import { ResultChart } from './result-chart/result-chart';
import { ChartData, toChartData } from './chart-data';
import { PivotTable } from './pivot-table/pivot-table';
import { FilterRow, FilterSpec } from './filter-row/filter-row';
import { toAggregateFn, toFilterParam, toFilters, toViewMode, ViewMode } from './explore-params';

@Component({
  selector: 'app-explore',
  imports: [ResultChart, PivotTable, FilterRow],
  templateUrl: './explore.html',
  styleUrl: './explore.css',
})
export class Explore {
  private readonly api = inject(SalesApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly aggParam = input<string>(undefined, { alias: 'agg' });
  readonly factParam = input<string>(undefined, { alias: 'fact' });
  readonly dim1Param = input<string>(undefined, { alias: 'dim1' });
  readonly dim2Param = input<string>(undefined, { alias: 'dim2' });
  readonly filterParam = input<string | string[]>(undefined, { alias: 'filter' });
  readonly viewParam = input<string>(undefined, { alias: 'view' });

  readonly schema = this.api.schema;
  readonly columns = computed(() => (this.schema.hasValue() ? this.schema.value().columns : []));

  // --- query controls -------------------------------------------------------
  readonly aggregateFn = computed(() => toAggregateFn(this.aggParam()));

  /** avg/sum need a numeric fact column; count works on any column. */
  readonly factColumns = computed(() => factColumnsFor(this.columns(), this.aggregateFn()));
  readonly fact = computed(() => pickColumn(this.factParam(), this.factColumns(), 'Revenue'));

  readonly dimensionColumns = computed(() => dimensionColumnsOf(this.columns()));
  readonly dim1 = computed(() => pickColumn(this.dim1Param(), this.dimensionColumns(), 'Country'));
  readonly dim2 = computed(() => this.dim2Param() ?? '');
  readonly dim2Columns = computed(() => this.dimensionColumns().filter((c) => c !== this.dim1()));

  readonly filters = computed(() => toFilters(this.filterParam()));
  private readonly completeFilters = computed(() => toFilterRecord(this.filters()));

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

  readonly data = computed(() => (this.result.hasValue() ? this.result.value() : undefined));

  readonly errorMessage = computed(() => toErrorMessage(this.result.error()));

  // --- view -----------------------------------------------------------------
  readonly viewMode = computed(() => toViewMode(this.viewParam()));
  /** A pie shows parts of a whole: one dimension, additive aggregate only. */
  readonly pieAllowed = computed(() => !this.dim2() && this.aggregateFn() !== 'avg');
  readonly effectiveView = computed(() => effectiveViewOf(this.viewMode(), this.pieAllowed()));

  readonly valueLabel = computed(() => `${this.aggregateFn()}(${this.fact()})`);

  readonly chart = computed(() => chartFor(this.data(), this.effectiveView(), this.valueLabel()));

  // --- event handlers -------------------------------------------------------
  readonly formatValue = formatValue;

  update(params: Params) {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  addFilter() {
    if (this.filters().length < 2) {
      this.updateFilters([...this.filters(), { column: '', value: '' }]);
    }
  }

  updateFilter(index: number, spec: FilterSpec) {
    this.updateFilters(this.filters().map((old, i) => (i === index ? spec : old)));
  }

  removeFilter(index: number) {
    this.updateFilters(this.filters().filter((_, i) => i !== index));
  }

  private updateFilters(filters: FilterSpec[]) {
    this.update({ filter: toFilterParam(filters) });
  }
}

function factColumnsFor(columns: ColumnInfo[], aggregateFn: AggregateFn): string[] {
  const usable = columns.filter((c) => aggregateFn === 'count' || c.numeric);
  return usable.map((c) => c.name);
}

function dimensionColumnsOf(columns: ColumnInfo[]): string[] {
  const dimensions = columns.filter((c) => c.type === 'VARCHAR');
  return dimensions.map((c) => c.name);
}

function pickColumn(preferred: string | undefined, columns: string[], fallback: string): string {
  if (preferred && columns.includes(preferred)) return preferred;
  return columns.includes(fallback) ? fallback : (columns[0] ?? '');
}

function toFilterRecord(filters: FilterSpec[]): Record<string, string> {
  const complete = filters.filter((f) => f.column && f.value);
  return Object.fromEntries(complete.map((f) => [f.column, f.value]));
}

function toErrorMessage(error: unknown): string {
  if (!error) return '';
  const body = (error as { error?: { error?: string } }).error;
  return body?.error ?? 'Server not reachable (npm run server)';
}

function effectiveViewOf(view: ViewMode, pieAllowed: boolean): ViewMode {
  return view === 'pie' && !pieAllowed ? 'bar' : view;
}

function chartFor(
  result: AggregateResponse | undefined,
  view: ViewMode,
  valueLabel: string,
): ChartData {
  if (!result) return { labels: [], datasets: [], note: '' };
  return toChartData(result.rows, result.dimensions, valueLabel, view === 'pie' ? 'pie' : 'bar');
}
