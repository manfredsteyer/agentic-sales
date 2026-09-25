import { z } from 'zod';

const barSchema = z.object({
  label: z.string(),
  series: z
    .string()
    .nullish()
    .describe('Value of the second dimension for grouped bars, e.g. "Europe"'),
  value: z.number(),
});

export const barChartSchema = z.object({
  title: z.string().describe('Short title, e.g. "Revenue per week"'),
  valueLabel: z.string().describe('What the values are, e.g. "Revenue (USD)"'),
  bars: z.array(barSchema).min(1).describe(`
    One bar per aggregate row, e.g. { "label": "2020-W50", "value": 59842 }. With a second
    dimension, add its value as series: { "label": "Apparel", "series": "Europe", "value": 21530 }
  `),
});

export type BarChartArgs = z.infer<typeof barChartSchema>;
