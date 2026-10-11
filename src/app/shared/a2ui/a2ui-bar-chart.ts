import { Component, input } from '@angular/core';
import { Bar, BarChart } from '../charts/bar-chart';

@Component({
  selector: 'app-a2ui-bar-chart',
  imports: [BarChart],
  template: `
    @let items = bars();
    @if (items) {
      <app-bar-chart
        [data]="{ title: title(), valueLabel: valueLabel(), bars: items }"
      />
    }
  `,
})
export class A2uiBarChart {
  readonly title = input.required<string>();
  readonly valueLabel = input.required<string>();
  readonly bars = input<Bar[]>();
}
