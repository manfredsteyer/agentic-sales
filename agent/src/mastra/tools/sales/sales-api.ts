const BASE_URL = process.env.AGG_SERVER_URL ?? 'http://localhost:3000';

export type FilterValue = string | number | boolean;

export interface SortQuery {
  column: string;
  direction?: 'asc' | 'desc';
}

export interface AggregateQuery {
  fact: string;
  aggregateFn: 'avg' | 'sum' | 'count';
  dimensions: string[];
  filter?: Record<string, FilterValue>;
  sort?: SortQuery[];
  limit?: number;
}

export interface DetailsQuery {
  columns?: string[];
  filter?: Record<string, FilterValue>;
  sort?: SortQuery[];
  limit?: number;
  offset?: number;
}

export function aggregate({
  fact,
  aggregateFn,
  dimensions,
  filter,
  sort,
  limit,
}: AggregateQuery) {
  return callServer('/aggregate', 'QUERY', {
    Fact: fact,
    AggregateFn: aggregateFn,
    Dimensions: dimensions,
    Filter: filter ?? {},
    Sort: toSort(sort),
    Limit: limit,
  });
}

export function details({
  columns,
  filter,
  sort,
  limit,
  offset,
}: DetailsQuery) {
  return callServer('/details', 'QUERY', {
    Columns: columns,
    Filter: filter ?? {},
    Sort: toSort(sort),
    Limit: limit,
    Offset: offset,
  });
}

function toSort(sort: SortQuery[] | undefined) {
  return sort?.map((s) => ({
    Column: s.column,
    Direction: s.direction ?? 'asc',
  }));
}

async function callServer(path: string, method: string, body?: unknown) {
  const doFetch = (m: string) =>
    fetch(`${BASE_URL}${path}`, {
      method: m,
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  let response: Response;
  try {
    response = await doFetch(method);
  } catch (err) {
    if (method !== 'QUERY') throw err;
    response = await doFetch('POST');
  }
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(
      `Aggregation server (${response.status}): ${payload.error ?? 'unknown error'}`,
    );
  }
  return payload;
}
