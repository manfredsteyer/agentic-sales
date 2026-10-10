import { A2uiMessage } from '@a2ui/web_core/v0_9';
import { Component, input } from '@angular/core';
import { basicCatalog, CopilotA2UISurface } from '@copilotkit/angular/a2ui';

@Component({
  selector: 'app-a2ui-surface',
  imports: [CopilotA2UISurface],
  template: `
    <figure>
      <copilot-a2ui-surface [operations]="messages()" [catalog]="catalog" />
    </figure>
  `,
})
export class A2uiSurface {
  readonly messages = input.required<A2uiMessage[]>();

  protected readonly catalog = basicCatalog;
}
