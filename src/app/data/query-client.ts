import { httpResource, HttpResourceRef } from '@angular/common/http';
import { computed, Service, Signal } from '@angular/core';
import { RUN_QUERY_URL } from '../agents/dashboard/dashboard-agent';
import { Query, QueryResult } from '../shared/query-schema';
import { deepEqual } from '../shared/utils/deep-equal';

@Service()
export class QueryClient {
  createResource(
    spec: Signal<Query>,
  ): HttpResourceRef<QueryResult | undefined> {
    const requestedSpec = computed(() => spec(), { equal: deepEqual });

    return httpResource<QueryResult>(() => ({
      url: RUN_QUERY_URL,
      method: 'POST',
      body: { data: { spec: requestedSpec() } },
    }));
  }
}
