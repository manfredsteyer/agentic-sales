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
import { injectPrefersDark } from '../../prefers-dark';
import { formatValue } from '../../sales-api';

export interface ChartSeries {
  label: string;
  data: number[];
}

// Reference dataviz palette: fixed slot order, stepped separately for
// light and dark surfaces. Never cycled - the dashboard caps series at 8.
const PALETTE_LIGHT = [
  '#2a78d6',
  '#eb6834',
  '#1baf7a',
  '#eda100',
  '#e87ba4',
  '#008300',
  '#4a3aa7',
  '#e34948',
];
const PALETTE_DARK = [
  '#3987e5',
  '#d95926',
  '#199e70',
  '#c98500',
  '#d55181',
  '#008300',
  '#9085e9',
  '#e66767',
];

const THEME = {
  light: {
    palette: PALETTE_LIGHT,
    surface: '#fcfcfb',
    text: '#0b0b0b',
    muted: '#52514e',
    grid: 'rgba(11, 11, 11, 0.08)',
  },
  dark: {
    palette: PALETTE_DARK,
    surface: '#1a1a19',
    text: '#ffffff',
    muted: '#c3c2b7',
    grid: 'rgba(255, 255, 255, 0.1)',
  },
};

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
  private readonly dark = injectPrefersDark();
  private chart: Chart | undefined;
  private renderedState = '';
  private chartLayout = '';

  constructor() {
    inject(DestroyRef).onDestroy(() => this.chart?.destroy());

    afterRenderEffect(() => this.render());
  }

  private render() {
    const theme = THEME[this.dark() ? 'dark' : 'light'];
    const type = this.type();
    const labels = this.labels();
    const series = this.datasets();

    const state = JSON.stringify([theme, type, labels, series]);
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
                backgroundColor: labels.map((_, i) => theme.palette[i % theme.palette.length]),
                borderColor: theme.surface,
                borderWidth: 2,
              },
            ]
          : series.map((s, i) => ({
              label: s.label,
              data: s.data,
              backgroundColor: theme.palette[i],
              // rounded data-end anchored to the baseline
              borderRadius: 4,
              borderSkipped: 'start' as const,
              maxBarThickness: 40,
            })),
    };

    const layout = JSON.stringify([theme, type, series.length]);
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
            labels: { color: theme.text, usePointStyle: true, boxHeight: 8 },
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
                x: { grid: { display: false }, ticks: { color: theme.muted } },
                y: {
                  beginAtZero: true,
                  grid: { color: theme.grid },
                  border: { display: false },
                  ticks: {
                    color: theme.muted,
                    callback: (v) => formatValue(v),
                  },
                },
              }
            : undefined,
      },
    });
  }
}
