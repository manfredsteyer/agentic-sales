import { A2uiMessage } from '@a2ui/web_core/v0_9';
import { Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { type A2UIClientEventMessage } from '@copilotkit/angular';
import { CopilotA2UISurface } from '@copilotkit/angular/a2ui';
import { salesCatalog } from './a2ui/sales-catalog';

@Component({
  selector: 'app-a2ui-surface',
  imports: [CopilotA2UISurface],
  template: `
    <figure>
      <copilot-a2ui-surface
        [operations]="operations()"
        [catalog]="catalog"
        (action)="handleAction($event)"
      />
    </figure>
  `,
})
export class A2uiSurface {
  readonly operations = input.required<A2uiMessage[]>();

  protected readonly catalog = salesCatalog;

  private readonly router = inject(Router);

  protected handleAction(message: A2UIClientEventMessage): void {
    const { name, context } = message.userAction;
    if (name === 'explore') {
      void this.router.navigate([
        '/explorer',
        { filter: toExplorerFilter(context) },
      ]);
    }
  }
}

function toExplorerFilter(context: Record<string, unknown>): string {
  const { product, category } = context;
  return product ? `ItemName:${product}` : `ItemCategory:${category ?? ''}`;
}
