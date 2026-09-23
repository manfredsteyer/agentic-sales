// Client for the aggregation server (npm run server in the repo root), shared
// by the agent's tools and the JavaScript sandbox.
const BASE_URL = process.env.AGG_SERVER_URL ?? 'http://localhost:3000';

export type FilterValue = string | number | boolean;

export interface AggregateQuery {
  fact: string;
  aggregateFn: 'avg' | 'sum' | 'count';
  dimensions: string[];
  filter?: Record<string, FilterValue>;
}

export interface DetailsQuery {
  columns?: string[];
  filter?: Record<string, FilterValue>;
  sort?: { column: string; direction?: 'asc' | 'desc' }[];
  limit?: number;
  offset?: number;
}

export function getSchema() {
  return callServer('/schema', 'GET');
}

export function aggregate({ fact, aggregateFn, dimensions, filter }: AggregateQuery) {
  return callServer('/aggregate', 'QUERY', {
    Fact: fact,
    AggregateFn: aggregateFn,
    Dimensions: dimensions,
    Filter: filter ?? {},
  });
}

export function details({ columns, filter, sort, limit, offset }: DetailsQuery) {
  return callServer('/details', 'QUERY', {
    Columns: columns,
    Filter: filter ?? {},
    Sort: sort?.map((s) => ({ Column: s.column, Direction: s.direction ?? 'asc' })),
    Limit: limit,
    Offset: offset,
  });
}

/** The aggregation server speaks the HTTP QUERY verb; POST is its fallback. */
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
    response = await doFetch('POST'); // runtime cannot send QUERY
  }
  const payload = await response.json();
  if (!response.ok) {
    // Surface the server's validation message (e.g. unknown column + the
    // list of available ones) so the agent can self-correct.
    throw new Error(`Aggregation server (${response.status}): ${payload.error ?? 'unknown error'}`);
  }
  return payload;
}
