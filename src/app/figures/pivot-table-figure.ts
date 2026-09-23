import { Component, computed, input } from '@angular/core';

import { PivotTableArgs } from '../assistant/tools/visualization-schemas';
import { PivotTable } from '../explore/pivot-table/pivot-table';
import { AggRow } from '../sales-api';

@Component({
  selector: 'app-pivot-table-figure',
  imports: [PivotTable],
  template: `
    <figure>
      <figcaption>{{ args().title }}</figcaption>
      <app-pivot-table
        [rows]="rows()"
        [dimensions]="[args().rowDimension, args().columnDimension]"
        [valueLabel]="args().valueLabel"
      />
      <ng-content />
    </figure>
  `,
  host: { class: 'chart-figure' },
})
export class PivotTableFigure {
  readonly args = input.required<PivotTableArgs>();

  protected readonly rows = computed(() => toPivotRows(this.args()));
}

function toPivotRows(args: PivotTableArgs): AggRow[] {
  return args.cells.map((cell) => ({
    [args.rowDimension]: cell.row,
    [args.columnDimension]: cell.column,
    value: cell.value,
  }));
}
