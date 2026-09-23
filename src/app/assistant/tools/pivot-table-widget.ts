import { Component, computed, input } from '@angular/core';
import {
  type AngularToolCall,
  type RegisterComponentConfig,
  type ToolRenderer,
} from '@copilotkit/angular';

import { PivotTable } from '../../explore/pivot-table/pivot-table';
import { AddToDashboardButton } from '../../dashboard/add-to-dashboard-button';
import { AggRow } from '../../sales-api';
import { PivotTableArgs, pivotTableSchema } from './visualization-schemas';

@Component({
  selector: 'app-pivot-table-widget',
  imports: [PivotTable, AddToDashboardButton],
  template: `
    @if (args(); as args) {
      <figure>
        <figcaption>{{ args.title }}</figcaption>
        <app-pivot-table
          [rows]="rows()"
          [dimensions]="[args.rowDimension, args.columnDimension]"
          [valueLabel]="args.valueLabel"
        />
        @if (toolCall().status === 'complete') {
          <app-add-to-dashboard kind="pivotTable" [args]="args" />
        }
      </figure>
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
  protected readonly rows = computed(() => toPivotRows(this.args()));
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

export function toPivotRows(args: PivotTableArgs | undefined): AggRow[] {
  if (!args) {
    return [];
  }
  return args.cells.map((cell) => ({
    [args.rowDimension]: cell.row,
    [args.columnDimension]: cell.column,
    value: cell.value,
  }));
}
