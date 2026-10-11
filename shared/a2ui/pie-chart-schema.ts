import { z } from 'zod/v3';

const sliceSchema = z.object({ label: z.string(), value: z.number() });

const slicesBindingSchema = z.object({
  path: z.string().describe('Path of the slices in the data model'),
});

export const pieChartSchema = z.object({
  title: z.string().describe('Short title, e.g. "Revenue share per category"'),
  valueLabel: z.string().describe('What the values are, e.g. "Revenue (USD)"'),
  slices: z.union([z.array(sliceSchema), slicesBindingSchema]).describe(`
    One slice per aggregate row, e.g. { "label": "Apparel", "value": 171727 }. Shares of a whole
    (sum or count, never avg): at most 8 slices, combine the smallest ones into a slice named "Other"
  `),
});
