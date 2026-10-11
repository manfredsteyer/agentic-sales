import { Component, input } from '@angular/core';
import { PieChart, Slice } from '../charts/pie-chart';

@Component({
  selector: 'app-a2ui-pie-chart',
  imports: [PieChart],
  template: `
    @let items = slices();
    @if (items) {
      <app-pie-chart
        [data]="{ title: title(), valueLabel: valueLabel(), slices: items }"
      />
    }
  `,
})
export class A2uiPieChart {
  readonly title = input.required<string>();
  readonly valueLabel = input.required<string>();
  readonly slices = input<Slice[]>();
}
