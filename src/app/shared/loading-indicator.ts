import { Component } from '@angular/core';

@Component({
  selector: 'app-loading-indicator',
  template: `
    <div class="loading" role="status">
      <div class="bars" aria-hidden="true">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
      <ng-content />
    </div>
  `,
})
export class LoadingIndicator {}
