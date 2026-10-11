import { z } from 'zod/v3';

const cellSchema = z.object({
  row: z.string(),
  column: z.string(),
  value: z.number(),
});

const cellsBindingSchema = z.object({
  path: z.string().describe('Path of the cells in the data model'),
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
  cells: z.union([z.array(cellSchema), cellsBindingSchema]).describe(`
    One cell per aggregate row, e.g. { "row": "2020-12", "column": "mobile", "value": 60423 }
  `),
});
