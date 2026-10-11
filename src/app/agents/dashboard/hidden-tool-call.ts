import { Component, input } from '@angular/core';
import type { AngularToolCall, ToolRenderer } from '@copilotkit/angular';

@Component({
  selector: 'app-hidden-tool-call',
  template: '',
})
export class HiddenToolCall implements ToolRenderer<Record<string, unknown>> {
  readonly toolCall =
    input.required<AngularToolCall<Record<string, unknown>>>();
}
