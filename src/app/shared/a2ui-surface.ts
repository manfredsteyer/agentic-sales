import { A2uiMessage } from '@a2ui/web_core/v0_9';
import { Component, input } from '@angular/core';
import { CopilotA2UISurface } from '@copilotkit/angular/a2ui';
import { salesCatalog } from './a2ui/sales-catalog';

@Component({
  selector: 'app-a2ui-surface',
  imports: [CopilotA2UISurface],
  template: `
    <figure>
      <!-- TODO #2: Call copilot-a2ui-surface with 
          - operations
          - catalog
      -->
      Not implemented yet!
    </figure>
  `,
})
export class A2uiSurface {
  readonly operations = input.required<A2uiMessage[]>();
  protected readonly catalog = salesCatalog;
}
