import {
  afterRenderEffect,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  viewChild,
} from '@angular/core';
import Chart from 'chart.js/auto';
import { formatValue } from '../../sales-api';

export interface ChartSeries {
  label: string;
  data: number[];
}

// Reference dataviz palette: fixed slot order, never cycled - the dashboard
// caps series at 8.
const PALETTE = [
  '#2a78d6',
  '#eb6834',
  '#1baf7a',
  '#eda100',
  '#e87ba4',
  '#008300',
  '#4a3aa7',
  '#e34948',
];

const THEME = {
  surface: '#ffffff',
  text: '#111827',
  muted: '#5b6779',
  grid: 'rgba(16, 24, 40, 0.08)',
};

Chart.defaults.font.family = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

@Component({
  selector: 'app-result-chart',
  templateUrl: './result-chart.html',
  styleUrl: './result-chart.css',
})
export class ResultChart {
  readonly type = input.required<'bar' | 'pie'>();
  readonly labels = input.required<string[]>();
  readonly datasets = input.required<ChartSeries[]>();

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('cv');
  private chart: Chart | undefined;
  private renderedState = '';
  private chartLayout = '';

  constructor() {
    inject(DestroyRef).onDestroy(() => this.chart?.destroy());

    afterRenderEffect(() => this.render());
  }

  private render() {
    const type = this.type();
    const labels = this.labels();
    const series = this.datasets();

    const state = JSON.stringify([type, labels, series]);
    if (state === this.renderedState) {
      return;
    }
    this.renderedState = state;

    const data = {
      labels,
      datasets:
        type === 'pie'
          ? [
              {
                label: series[0]?.label ?? '',
                data: series[0]?.data ?? [],
                // one palette slot per slice, 2px surface spacer between fills
                backgroundColor: labels.map((_, i) => PALETTE[i % PALETTE.length]),
                borderColor: THEME.surface,
                borderWidth: 2,
              },
            ]
          : series.map((s, i) => ({
              label: s.label,
              data: s.data,
              backgroundColor: PALETTE[i],
              // rounded data-end anchored to the baseline
              borderRadius: 4,
              borderSkipped: 'start' as const,
              maxBarThickness: 40,
            })),
    };

    const layout = JSON.stringify([type, series.length]);
    if (this.chart && layout === this.chartLayout) {
      this.chart.data = data;
      this.chart.update('none');
      return;
    }
    this.chartLayout = layout;

    this.chart?.destroy();
    this.chart = new Chart(this.canvas().nativeElement, {
      type,
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 200 },
        plugins: {
          // single bar series needs no legend box - the caption names it
          legend: {
            display: type === 'pie' || series.length > 1,
            position: type === 'pie' ? 'right' : 'top',
            labels: { color: THEME.text, usePointStyle: true, boxHeight: 8 },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const value = type === 'pie' ? ctx.parsed : ctx.parsed.y;
                return `${ctx.dataset.label || ctx.label}: ${formatValue(value)}`;
              },
            },
          },
        },
        scales:
          type === 'bar'
            ? {
                x: { grid: { display: false }, ticks: { color: THEME.muted } },
                y: {
                  beginAtZero: true,
                  grid: { color: THEME.grid },
                  border: { display: false },
                  ticks: {
                    color: THEME.muted,
                    callback: (v) => formatValue(v),
                  },
                },
              }
            : undefined,
      },
    });
  }
}
