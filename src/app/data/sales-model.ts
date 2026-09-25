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
