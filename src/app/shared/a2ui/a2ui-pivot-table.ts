import { Component, input } from '@angular/core';
import { Cell, PivotTable } from '../charts/pivot-table';

@Component({
  selector: 'app-a2ui-pivot-table',
  imports: [PivotTable],
  template: `
    @let items = cells();
    @if (items) {
      <app-pivot-table
        [data]="{
          title: title(),
          rowDimension: rowDimension(),
          columnDimension: columnDimension(),
          valueLabel: valueLabel(),
          cells: items,
        }"
      />
    }
  `,
})
export class A2uiPivotTable {
  readonly title = input.required<string>();
  readonly rowDimension = input.required<string>();
  readonly columnDimension = input.required<string>();
  readonly valueLabel = input.required<string>();
  readonly cells = input<Cell[]>();
}
