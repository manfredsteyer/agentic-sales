import { Params } from '@angular/router';
import { AggregateFn } from '../data/sales-model';
import { FilterSpec } from './filter-row/filter-row';

export type ViewMode = 'bar' | 'pie' | 'pivot';

export interface ExplorerQuery {
  aggregateFn: AggregateFn;
  fact: string;
  dimensions: string[];
  filters: FilterSpec[];
  view: ViewMode;
}

export function toQueryParams(query: ExplorerQuery): Params {
  return {
    agg: query.aggregateFn,
    fact: query.fact,
    dim1: query.dimensions[0],
    dim2: query.dimensions[1] ?? null,
    filter: toFilterParam(query.filters),
    view: query.view,
  };
}

export function toFilterParam(filters: FilterSpec[]): string[] | null {
  return filters.length > 0
    ? filters.map((f) => `${f.column}:${f.value}`)
    : null;
}

export function toFilters(param: string | string[] | undefined): FilterSpec[] {
  const values = param === undefined ? [] : [param].flat();
  return values.map(toFilter);
}

export function toAggregateFn(param: string | undefined): AggregateFn {
  return param === 'avg' || param === 'count' ? param : 'sum';
}

export function toViewMode(param: string | undefined): ViewMode {
  return param === 'pie' || param === 'pivot' ? param : 'bar';
}

function toFilter(value: string): FilterSpec {
  const separator = value.indexOf(':');
  if (separator < 0) return { column: value, value: '' };
  return {
    column: value.slice(0, separator),
    value: value.slice(separator + 1),
  };
}
