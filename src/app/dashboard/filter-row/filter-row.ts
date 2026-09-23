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
  readonly filterColumns = computed(() =>
    this.columns()
      .filter((c) => c.type !== 'DATE')
      .map((c) => c.name),
  );

  /** Distinct values of the chosen column, via a count aggregation. */
  private readonly valueOptions = httpResource<AggregateResponse>(() => {
    const column = this.filter().column;
    if (!column) return undefined;
    return this.api.aggregateRequest({
      Fact: column,
      AggregateFn: 'count',
      Dimensions: [column],
      Filter: {},
    });
  });

  readonly values = computed(() => {
    if (!this.valueOptions.hasValue()) return [];
    const column = this.filter().column;
    return this.valueOptions.value().rows.map((r) => String(r[column]));
  });

  setColumn(column: string) {
    this.changed.emit({ column, value: '' });
  }

  setValue(value: string) {
    this.changed.emit({ column: this.filter().column, value });
  }
}
