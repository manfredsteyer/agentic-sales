import { AggRow } from '../sales-api';
import { ChartSeries } from './result-chart/result-chart';

export interface ChartData {
  labels: string[];
  datasets: ChartSeries[];
  note: string;
}

const MAX_SERIES = 8; // fixed categorical palette, never cycled
const SEP = '\u0000'; // key separator that cannot occur in data values

/**
 * Turns aggregate rows (1-2 dimension properties plus `value`) into chart
 * labels and series. Shared by the dashboard and the chat visualizations.
 */
export function toChartData(
  rows: AggRow[],
  dimensions: string[],
  valueLabel: string,
  type: 'bar' | 'pie',
): ChartData {
  const [d1, d2] = dimensions;

  if (!d2) {
    let entries = rows.map((r) => ({
      label: String(r[d1]),
      value: Number(r['value']),
    }));
    let note = '';
    // Pie: fold the smallest slices so the fixed 8-color palette suffices.
    if (type === 'pie' && entries.length > MAX_SERIES) {
      const sorted = [...entries].sort((a, b) => b.value - a.value);
      const keep = new Set(sorted.slice(0, MAX_SERIES - 1).map((e) => e.label));
      const rest = entries.filter((e) => !keep.has(e.label));
      entries = entries.filter((e) => keep.has(e.label));
      entries.push({
        label: 'Other',
        value: rest.reduce((a, e) => a + e.value, 0),
      });
      note = `${rest.length} smaller values combined into "Other".`;
    }
    return {
      labels: entries.map((e) => e.label),
      datasets: [{ label: valueLabel, data: entries.map((e) => e.value) }],
      note,
    };
  }

  const labels = [...new Set(rows.map((r) => String(r[d1])))];
  const seriesNames = [...new Set(rows.map((r) => String(r[d2])))];
  const byKey = new Map(rows.map((r) => [`${r[d1]}${SEP}${r[d2]}`, Number(r['value'])]));
  const shown = seriesNames.slice(0, MAX_SERIES);
  const datasets = shown.map((s) => ({
    label: s,
    data: labels.map((l) => byKey.get(`${l}${SEP}${s}`) ?? 0),
  }));
  const hidden = seriesNames.length - shown.length;
  return {
    labels,
    datasets,
    note:
      hidden > 0
        ? `${hidden} series hidden (the palette has ${MAX_SERIES} colors) – the pivot table shows all of them.`
        : '',
  };
}
