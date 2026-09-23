import { Component, computed, inject, input, output } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { AggregateResponse, ColumnInfo, SalesApi } from '../../sales-api';

export interface FilterSpec {
  column: string;
  value: string;
}

@Component({
  selector: 'app-filter-row',
  templateUrl: './filter-row.html',
  styleUrl: './filter-row.css',
})
export class FilterRow {
  private readonly api = inject(SalesApi);

  readonly columns = input.required<ColumnInfo[]>();
  readonly filter = input.required<FilterSpec>();
  readonly changed = output<FilterSpec>();
  readonly removed = output<void>();

  /** DATE columns have too many distinct values for a select. */
  readonly filterColumns = computed(() => filterableColumns(this.columns()));

  /** Distinct values of the chosen column, via a count aggregation. */
  private readonly lookup = httpResource<AggregateResponse>(() => {
    const column = this.filter().column;
    if (!column) return undefined;
    return this.api.aggregateRequest({
      Fact: column,
      AggregateFn: 'count',
      Dimensions: [column],
      Filter: {},
    });
  });

  readonly options = computed(() => (this.lookup.hasValue() ? this.lookup.value() : undefined));

  readonly values = computed(() => distinctValues(this.options(), this.filter().column));

  setColumn(column: string) {
    this.changed.emit({ column, value: '' });
  }

  setValue(value: string) {
    this.changed.emit({ column: this.filter().column, value });
  }
}

function filterableColumns(columns: ColumnInfo[]): string[] {
  const filterable = columns.filter((c) => c.type !== 'DATE');
  return filterable.map((c) => c.name);
}

function distinctValues(options: AggregateResponse | undefined, column: string): string[] {
  return options ? options.rows.map((r) => String(r[column])) : [];
}
