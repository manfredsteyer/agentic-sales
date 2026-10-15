import { Component, computed, input } from '@angular/core';
import {
  type AngularToolCall,
  type RegisterComponentConfig,
  type ToolRenderer,
} from '@copilotkit/angular';
import { PivotTable } from '../../../shared/charts/pivot-table';
import { LoadingIndicator } from '../../../shared/loading-indicator';
import { PivotTableArgs, pivotTableSchema } from './pivot-table-schema';

@Component({
  selector: 'app-pivot-table-widget',
  imports: [PivotTable, LoadingIndicator],
  template: `
    @let call = toolCall();
    <div class="not-prose">
      @if (hasValidArgs() && call.status !== 'in-progress') {
        <app-pivot-table [data]="call.args" />
      } @else if (call.status === 'complete') {
        <p class="hint">
          Can't show this table: the agent passed incomplete data.
        </p>
      } @else {
        <app-loading-indicator>Creating table …</app-loading-indicator>
      }
    </div>
  `,
})
export class PivotTableWidget implements ToolRenderer<PivotTableArgs> {
  readonly toolCall = input.required<AngularToolCall<PivotTableArgs>>();

  protected readonly hasValidArgs = computed(() =>
    isValid(this.toolCall().args),
  );
}

export const pivotTableWidget: RegisterComponentConfig<PivotTableArgs> = {
  name: 'pivotTable',
  description: `
    Shows values of two dimensions as a table in the chat: the first dimension spans
    the rows, the second one the columns. Use it when exact values matter.
  `,
  parameters: pivotTableSchema,
  component: PivotTableWidget,
};

function isValid(args: Partial<PivotTableArgs>): boolean {
  const result = pivotTableSchema.safeParse(args);
  return result.success;
}
