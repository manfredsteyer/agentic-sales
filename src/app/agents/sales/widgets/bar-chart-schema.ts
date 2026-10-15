import { z } from 'zod';

const barSchema = z.object({
  // TODO #1: Add
  //  - label (string)
  //  - series (nullish string)
  //      Description: value for 2nd dimension for grouped bars, e.g. "Europe"
  //  - value (number)
});

export const barChartSchema = z.object({
  title: z.string().describe('Short title, e.g. "Revenue per week"'),
  valueLabel: z.string().describe('What the values are, e.g. "Revenue (USD)"'),

  // TODO #1: Add bars (array of bars)
  //   Description: One bar per aggregate row, e.g. { "label": "2020-W50", "value": 59842 }. With a second
  //   dimension, add its value as series: { "label": "Apparel", "series": "Europe", "value": 21530 }
});

export type BarChartArgs = z.infer<typeof barChartSchema>;
