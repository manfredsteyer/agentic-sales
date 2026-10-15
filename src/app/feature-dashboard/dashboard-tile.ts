import { Component, inject, input } from '@angular/core';
import { Query } from '@shared/query-schema';
import { QueryClient } from '../data/query-client';
import { QueryResultView } from './query-result-view';

@Component({
  selector: 'app-dashboard-tile',
  imports: [QueryResultView],
  template: `
    @let result = resource.value();
    @if (resource.isLoading()) {
      <figure>
        <figcaption>{{ spec().title }}</figcaption>
        <p class="hint">Loading …</p>
      </figure>
    } @else if (result?.kind === 'message') {
      <figure>
        <figcaption>{{ spec().title }}</figcaption>
        <p class="hint">Can't show this tile: {{ result.message }}</p>
      </figure>
    } @else if (result) {
      <app-query-result-view [result]="result" />
    } @else {
      <figure>
        <figcaption>{{ spec().title }}</figcaption>
        <p class="hint">
          Can't show this tile: the request to the agent server failed.
        </p>
      </figure>
    }
  `,
})
export class DashboardTile {
  readonly spec = input.required<Query>();

  private readonly queryClient = inject(QueryClient);

  protected readonly resource = this.queryClient.createResource(this.spec);
}
