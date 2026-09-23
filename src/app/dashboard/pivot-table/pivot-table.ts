import { Component, computed, input } from '@angular/core';
import { AggRow, formatValue } from '../../sales-api';

const SEP = '\u0000'; // key separator that cannot occur in data values

@Component({
  selector: 'app-pivot-table',
  templateUrl: './pivot-table.html',
  styleUrl: './pivot-table.css',
})
export class PivotTable {
  readonly rows = input.required<AggRow[]>();
  readonly dimensions = input.required<string[]>();
  readonly valueLabel = input.required<string>();

  readonly formatValue = formatValue;

  /** With 2 dimensions: dim1 spans the rows, dim2 the columns. */
  readonly pivot = computed(() => {
    const [d1, d2] = this.dimensions();
    const rows = this.rows();

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
      a.localeCompare(b, 'de'),
    );
    const cell = new Map(
      rows.map((r) => [`${r[d1]}${SEP}${r[d2]}`, Number(r['value'])]),
    );
    return { rowDim: d1, colKeys, rowKeys, cell };
  });

  cellValue(rowKey: string, colKey?: string): string {
    const { cell } = this.pivot();
    const value = colKey === undefined ? cell.get(rowKey) : cell.get(`${rowKey}${SEP}${colKey}`);
    return value === undefined ? '–' : formatValue(value);
  }
}
