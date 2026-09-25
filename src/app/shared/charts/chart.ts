// Simple Wrapper for chart.js

import {
  afterRenderEffect,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  viewChild,
} from '@angular/core';
import ChartJs from 'chart.js/auto';
import { formatValue } from '../utils/format-value';

export interface ChartSeries {
  label: string;
  data: number[];
}

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

ChartJs.defaults.font.family =
  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

@Component({
  selector: 'app-chart',
  template: `
    <canvas #cv role="img" aria-label="Chart of the query results"></canvas>
  `,
})
export class Chart {
  readonly type = input.required<'bar' | 'pie'>();
  readonly labels = input.required<string[]>();
  readonly datasets = input.required<ChartSeries[]>();

  private readonly canvas =
    viewChild.required<ElementRef<HTMLCanvasElement>>('cv');
  private readonly destroyRef = inject(DestroyRef);
  private chart: ChartJs | undefined;
  private renderedState = '';
  private chartLayout = '';

  constructor() {
    this.destroyRef.onDestroy(() => this.chart?.destroy());

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
                backgroundColor: labels.map(
                  (_, i) => PALETTE[i % PALETTE.length],
                ),
                borderColor: THEME.surface,
                borderWidth: 2,
              },
            ]
          : series.map((s, i) => ({
              label: s.label,
              data: s.data,
              backgroundColor: PALETTE[i],
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
    this.chart = new ChartJs(this.canvas().nativeElement, {
      type,
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 200 },
        plugins: {
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
