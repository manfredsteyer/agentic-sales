import { httpResource } from '@angular/common/http';
import { Component, computed, inject, input, output } from '@angular/core';
import { SalesClient } from '../../data/sales-client';
import { AggregateResponse, ColumnInfo } from '../../data/sales-model';

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
  private readonly salesClient = inject(SalesClient);

  readonly columns = input.required<ColumnInfo[]>();
  readonly filter = input.required<FilterSpec>();
  readonly changed = output<FilterSpec>();
  readonly removed = output<void>();

  readonly filterColumns = computed(() => filterableColumns(this.columns()));

  private readonly lookup = httpResource<AggregateResponse>(() => {
    const column = this.filter().column;
    if (!column) return undefined;
    return this.salesClient.aggregateRequest({
      Fact: column,
      AggregateFn: 'count',
      Dimensions: [column],
      Filter: {},
    });
  });

  readonly options = computed(() =>
    this.lookup.hasValue() ? this.lookup.value() : undefined,
  );

  readonly values = computed(() =>
    distinctValues(this.options(), this.filter().column),
  );

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

function distinctValues(
  options: AggregateResponse | undefined,
  column: string,
): string[] {
  return options ? options.rows.map((r) => String(r[column])) : [];
}
