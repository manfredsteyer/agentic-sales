import { Component, computed, input } from '@angular/core';
import {
  type AngularToolCall,
  type RegisterComponentConfig,
  type ToolRenderer,
} from '@copilotkit/angular';
import { z } from 'zod';

import { PivotTable } from '../../dashboard/pivot-table/pivot-table';
import { AggRow } from '../../sales-api';

export const pivotTableSchema = z.object({
  title: z.string().describe('Short title, e.g. "Revenue per month and device"'),
  rowDimension: z.string().describe('Dimension spanning the rows, e.g. "Month"'),
  columnDimension: z.string().describe('Dimension spanning the columns, e.g. "DeviceCategory"'),
  valueLabel: z.string().describe('What the values are, e.g. "Revenue (USD)"'),
  cells: z
    .array(z.object({ row: z.string(), column: z.string(), value: z.number() }))
    .min(1)
    .describe(
      'One cell per aggregate row, e.g. { "row": "2020-12", "column": "mobile", "value": 60423 }',
    ),
});

export type PivotTableArgs = z.infer<typeof pivotTableSchema>;

@Component({
  selector: 'app-pivot-table-widget',
  imports: [PivotTable],
  template: `
    @if (args(); as args) {
      <figure>
        <figcaption>{{ args.title }}</figcaption>
        <app-pivot-table
          [rows]="rows()"
          [dimensions]="[args.rowDimension, args.columnDimension]"
          [valueLabel]="args.valueLabel"
        />
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
  protected readonly rows = computed(() => toRows(this.args()));
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

function toRows(args: PivotTableArgs | undefined): AggRow[] {
  if (!args) {
    return [];
  }
  return args.cells.map((cell) => ({
    [args.rowDimension]: cell.row,
    [args.columnDimension]: cell.column,
    value: cell.value,
  }));
}
