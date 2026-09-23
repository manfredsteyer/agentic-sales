import { z } from 'zod';

export const barChartSchema = z.object({
  title: z.string().describe('Short title, e.g. "Revenue per week"'),
  valueLabel: z.string().describe('What the values are, e.g. "Revenue (USD)"'),
  bars: z
    .array(
      z.object({
        label: z.string(),
        series: z
          .string()
          .nullish()
          .describe('Value of the second dimension for grouped bars, e.g. "Europe"'),
        value: z.number(),
      }),
    )
    .min(1)
    .describe(
      'One bar per aggregate row, e.g. { "label": "2020-W50", "value": 59842 }. With a second ' +
        'dimension, add its value as series: { "label": "Apparel", "series": "Europe", "value": 21530 }',
    ),
});

export type BarChartArgs = z.infer<typeof barChartSchema>;

export const pieChartSchema = z.object({
  title: z.string().describe('Short title, e.g. "Revenue share per category"'),
  valueLabel: z.string().describe('What the values are, e.g. "Revenue (USD)"'),
  slices: z
    .array(z.object({ label: z.string(), value: z.number() }))
    .min(1)
    .describe('One slice per aggregate row, e.g. { "label": "Apparel", "value": 171727 }'),
});

export type PieChartArgs = z.infer<typeof pieChartSchema>;

export const pivotTableSchema = z.object({
  title: z.string().describe('Short title, e.g. "Revenue per month and device"'),
  rowDimension: z.string().describe('Dimension spanning the rows, e.g. "Month"'),
  columnDimension: z.string().describe('Dimension spanning the columns, e.g. "DeviceCategory"'),
  valueLabel: z.string().describe('What the values are, e.g. "Revenue (USD)"'),
  cells: z
    .array(z.object({ row: z.string(), column: z.string(), value: z.number() }))
    .min(1)
    .describe(
      'One cell per aggregate row, e.g. { "row": "2020-12", "column": "mobile", "value": 60423 }',
    ),
});

export type PivotTableArgs = z.infer<typeof pivotTableSchema>;
