import { z } from 'zod';

const cellSchema = z.object({
  row: z.string(),
  column: z.string(),
  value: z.number(),
});

export const pivotTableSchema = z.object({
  title: z
    .string()
    .describe('Short title, e.g. "Revenue per month and device"'),
  rowDimension: z
    .string()
    .describe('Dimension spanning the rows, e.g. "Month"'),
  columnDimension: z
    .string()
    .describe('Dimension spanning the columns, e.g. "DeviceCategory"'),
  valueLabel: z.string().describe('What the values are, e.g. "Revenue (USD)"'),
  cells: z
    .array(cellSchema)
    .min(1)
    .describe(
      'One cell per aggregate row, e.g. { "row": "2020-12", "column": "mobile", "value": 60423 }',
    ),
});

export type PivotTableArgs = z.infer<typeof pivotTableSchema>;
