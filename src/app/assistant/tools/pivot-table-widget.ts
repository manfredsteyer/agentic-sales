import { Component, computed, input } from '@angular/core';
import {
  type AngularToolCall,
  type RegisterComponentConfig,
  type ToolRenderer,
} from '@copilotkit/angular';

import { AddToDashboardButton } from '../../dashboard/add-to-dashboard-button';
import { PivotTableFigure } from '../../figures/pivot-table-figure';
import { PivotTableArgs, pivotTableSchema } from './visualization-schemas';

@Component({
  selector: 'app-pivot-table-widget',
  imports: [PivotTableFigure, AddToDashboardButton],
  template: `
    @if (args(); as args) {
      <app-pivot-table-figure [args]="args">
        @if (toolCall().status === 'complete') {
          <app-add-to-dashboard kind="pivotTable" [args]="args" />
        }
      </app-pivot-table-figure>
    } @else if (toolCall().status === 'complete') {
      <p class="hint">Can't show this table: the agent passed incomplete data.</p>
    } @else {
      <div class="loading" role="status">
        <div class="bars" aria-hidden="true">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
        Creating table …
      </div>
    }
  `,
  host: { class: 'chat-widget' },
})
export class PivotTableWidget implements ToolRenderer<PivotTableArgs> {
  readonly toolCall = input.required<AngularToolCall<PivotTableArgs>>();

  protected readonly args = computed(() => toPivotTableArgs(this.toolCall().args));
}

export const pivotTableWidget: RegisterComponentConfig<PivotTableArgs> = {
  name: 'pivotTable',
  description:
    'Shows values of two dimensions as a table in the chat: the first dimension spans ' +
    'the rows, the second one the columns. Use it when exact values matter.',
  parameters: pivotTableSchema,
  component: PivotTableWidget,
};

function toPivotTableArgs(args: Partial<PivotTableArgs>): PivotTableArgs | undefined {
  const cells = args.cells?.filter((cell) => cell?.value !== undefined);
  const result = pivotTableSchema.safeParse({ ...args, cells });
  return result.data;
}
