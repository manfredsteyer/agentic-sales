import { z } from 'zod';

const queryBaseSchema = z.object({
  title: z.string().describe('Short title, e.g. "Revenue per week"'),
  valueLabel: z.string().describe('What the values are, e.g. "Revenue (USD)"'),
});

export const barChartQuerySchema = queryBaseSchema.extend({
  kind: z.literal('barChart'),
  expression: z.string().describe(`
    JSONata expression returning one bar per aggregate row, e.g.
    [{ "label": "2020-W50", "value": 59842 }]. With a second dimension, add its value as
    series: { "label": "Apparel", "series": "Europe", "value": 21530 }. The bars are
    grouped per label with one color per series, at most 8.
  `),
});

export const pieChartQuerySchema = queryBaseSchema.extend({
  kind: z.literal('pieChart'),
  expression: z.string().describe(`
    JSONata expression returning one slice per aggregate row, e.g.
    [{ "label": "Apparel", "value": 171727 }]. Only for shares of a whole (sum or count,
    never avg): at most 8 slices, combine the smallest ones into a slice named "Other".
  `),
});

export const pivotTableQuerySchema = queryBaseSchema.extend({
  kind: z.literal('pivotTable'),
  rowDimension: z
    .string()
    .describe('Dimension spanning the rows, e.g. "Month"'),
  columnDimension: z
    .string()
    .describe('Dimension spanning the columns, e.g. "DeviceCategory"'),
  expression: z.string().describe(`
    JSONata expression returning one cell per aggregate row, e.g.
    [{ "row": "2020-12", "column": "mobile", "value": 60423 }]
  `),
});

export const querySchema = z
  .union([barChartQuerySchema, pieChartQuerySchema, pivotTableQuerySchema])
  .describe(
    'Kind, labels and the JSONata expression that computes the data of the visualization',
  );

export type Query = z.infer<typeof querySchema>;

export const barsSchema = z
  .array(
    z.object({
      label: z.string(),
      series: z.string().nullish(),
      value: z.number(),
    }),
  )
  .min(1);

export const slicesSchema = z
  .array(z.object({ label: z.string(), value: z.number() }))
  .min(1);

export const cellsSchema = z
  .array(z.object({ row: z.string(), column: z.string(), value: z.number() }))
  .min(1);

const dataBaseSchema = z.object({ title: z.string(), valueLabel: z.string() });

const barChartResultSchema = z.object({
  kind: z.literal('barChart'),
  data: dataBaseSchema.extend({ bars: barsSchema }),
});

const pieChartResultSchema = z.object({
  kind: z.literal('pieChart'),
  data: dataBaseSchema.extend({ slices: slicesSchema }),
});

const pivotTableResultSchema = z.object({
  kind: z.literal('pivotTable'),
  data: dataBaseSchema.extend({
    rowDimension: z.string(),
    columnDimension: z.string(),
    cells: cellsSchema,
  }),
});

const queryMessageSchema = z.object({
  kind: z.literal('message'),
  status: z.enum(['awaiting-approval', 'declined', 'failed']),
  message: z.string(),
});

export const queryResultSchema = z.discriminatedUnion('kind', [
  barChartResultSchema,
  pieChartResultSchema,
  pivotTableResultSchema,
  queryMessageSchema,
]);

export type QueryResult = z.infer<typeof queryResultSchema>;
