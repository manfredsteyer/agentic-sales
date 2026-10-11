import { z } from 'zod/v3';

const barSchema = z.object({
  label: z.string(),
  series: z
    .string()
    .nullish()
    .describe('Value of the second dimension for grouped bars, e.g. "Europe"'),
  value: z.number(),
});

const barsBindingSchema = z.object({
  path: z.string().describe('Path of the bars in the data model'),
});

export const barChartSchema = z.object({
  title: z.string().describe('Short title, e.g. "Revenue per week"'),
  valueLabel: z.string().describe('What the values are, e.g. "Revenue (USD)"'),
  bars: z.union([z.array(barSchema), barsBindingSchema]).describe(`
    One bar per aggregate row, e.g. { "label": "2020-W50", "value": 59842 }. With a second
    dimension, add its value as series: { "label": "Apparel", "series": "Europe", "value": 21530 }.
    The bars are grouped per label with one color per series (at most 8)
  `),
});
