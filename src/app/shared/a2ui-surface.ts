import { A2uiMessage } from '@a2ui/web_core/v0_9';
import { Component, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';
import { type A2UIClientEventMessage } from '@copilotkit/angular';
import {
  basicCatalog,
  CopilotA2UICatalog,
  CopilotA2UISurface,
} from '@copilotkit/angular/a2ui';

@Component({
  selector: 'app-a2ui-surface',
  imports: [CopilotA2UISurface],
  template: `
    <figure>
      <copilot-a2ui-surface
        [operations]="operations()"
        [catalog]="catalog()"
        (action)="handleAction($event)"
        (rendered)="rendered.emit()"
      />
    </figure>
  `,
})
export class A2uiSurface {
  readonly operations = input.required<A2uiMessage[]>();
  readonly catalog = input<CopilotA2UICatalog>(basicCatalog);
  readonly rendered = output<void>();

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

class AppA2uiCatalog extends CopilotA2UICatalog {
  override readonly surfaceComponent = A2uiSurface;
}

export const a2uiCatalog = new AppA2uiCatalog(
  basicCatalog.id,
  [...basicCatalog.components.values()],
  [...basicCatalog.functions.values()],
);

function toExplorerFilter(context: Record<string, unknown>): string {
  const { product, category } = context;
  return product ? `ItemName:${product}` : `ItemCategory:${category ?? ''}`;
}
