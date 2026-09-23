import { Service } from '@angular/core';
import { httpResource, HttpResourceRequest } from '@angular/common/http';

export interface ColumnInfo {
  name: string;
  type: string;
  numeric: boolean;
}

export interface SchemaResponse {
  table: string;
  columns: ColumnInfo[];
}

export type AggregateFn = 'avg' | 'sum' | 'count';

export interface AggregateRequest {
  Fact: string;
  AggregateFn: AggregateFn;
  Dimensions: string[];
  Filter: Record<string, string>;
}

export type AggRow = Record<string, string | number | null>;

export interface AggregateResponse {
  fact: string;
  aggregateFn: string;
  dimensions: string[];
  rowCount: number;
  rows: AggRow[];
}

const numberFormat = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 });

export function formatValue(value: unknown): string {
  const n = Number(value);
  return Number.isFinite(n) ? numberFormat.format(n) : '–';
}

@Service()
export class SalesApi {
  readonly baseUrl = 'http://localhost:3000';

  /** Column metadata, shared by all consumers. */
  readonly schema = httpResource<SchemaResponse>(() => `${this.baseUrl}/schema`);

  /** The aggregation endpoint speaks the HTTP QUERY verb. */
  aggregateRequest(request: AggregateRequest): HttpResourceRequest {
    return {
      url: `${this.baseUrl}/aggregate`,
      method: 'QUERY',
      body: request,
    };
  }
}
