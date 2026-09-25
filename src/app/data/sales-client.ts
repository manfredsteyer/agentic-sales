import { httpResource, HttpResourceRequest } from '@angular/common/http';
import { Service } from '@angular/core';
import { AggregateRequest, SchemaResponse } from './sales-model';

@Service()
export class SalesClient {
  readonly baseUrl = 'http://localhost:3000';

  readonly schema = httpResource<SchemaResponse>(
    () => `${this.baseUrl}/schema`,
  );

  aggregateRequest(request: AggregateRequest): HttpResourceRequest {
    return {
      url: `${this.baseUrl}/aggregate`,
      method: 'QUERY',
      body: request,
    };
  }
}
