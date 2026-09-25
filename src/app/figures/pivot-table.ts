import { Component, computed, input } from '@angular/core';
import { AggRow } from '../data/sales-model';
import { ExplorerTable } from '../explorer/explorer-table/explorer-table';

export interface Cell {
  row: string;
  column: string;
  value: number;
}

export interface PivotTableData {
  title: string;
  rowDimension: string;
  columnDimension: string;
  valueLabel: string;
  cells: Cell[];
}

@Component({
  selector: 'app-pivot-table',
  imports: [ExplorerTable],
  template: `
    <figure>
      <figcaption>{{ data().title }}</figcaption>
      <app-explorer-table
        [rows]="rows()"
        [dimensions]="[data().rowDimension, data().columnDimension]"
        [valueLabel]="data().valueLabel"
      />
      <ng-content />
    </figure>
  `,
})
export class PivotTable {
  readonly data = input.required<PivotTableData>();

  protected readonly rows = computed(() => toPivotRows(this.data()));
}

function toPivotRows(data: PivotTableData): AggRow[] {
  return data.cells.map((cell) => ({
    [data.rowDimension]: cell.row,
    [data.columnDimension]: cell.column,
    value: cell.value,
  }));
}
