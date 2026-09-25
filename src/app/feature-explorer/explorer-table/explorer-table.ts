import { Component, computed, input } from '@angular/core';
import { AggRow } from '../../data/sales-model';
import { formatValue } from '../../shared/utils/format-value';

const SEP = '\u0000';

@Component({
  selector: 'app-explorer-table',
  templateUrl: './explorer-table.html',
  styleUrl: './explorer-table.css',
})
export class ExplorerTable {
  readonly rows = input.required<AggRow[]>();
  readonly dimensions = input.required<string[]>();
  readonly valueLabel = input.required<string>();

  readonly formatValue = formatValue;

  readonly pivot = computed(() => toPivot(this.rows(), this.dimensions()));

  cellValue(rowKey: string, colKey?: string): string {
    const { cell } = this.pivot();
    const value =
      colKey === undefined
        ? cell.get(rowKey)
        : cell.get(`${rowKey}${SEP}${colKey}`);
    return value === undefined ? '–' : formatValue(value);
  }
}

function toPivot(rows: AggRow[], dimensions: string[]) {
  const [d1, d2] = dimensions;

  if (!d2) {
    return {
      rowDim: d1,
      colKeys: [] as string[],
      rowKeys: rows.map((r) => String(r[d1])),
      cell: new Map(rows.map((r) => [String(r[d1]), Number(r['value'])])),
    };
  }

  const rowKeys = [...new Set(rows.map((r) => String(r[d1])))];
  const colKeys = [...new Set(rows.map((r) => String(r[d2])))].sort((a, b) =>
    a.localeCompare(b, 'en'),
  );
  const cell = new Map(
    rows.map((r) => [`${r[d1]}${SEP}${r[d2]}`, Number(r['value'])]),
  );
  return { rowDim: d1, colKeys, rowKeys, cell };
}
