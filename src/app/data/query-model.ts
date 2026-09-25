import { z } from 'zod';

const queryBaseSchema = z.object({
  title: z.string(),
  valueLabel: z.string(),
  expression: z.string(),
});

const barChartQuerySchema = queryBaseSchema.extend({
  kind: z.literal('barChart'),
});

const pieChartQuerySchema = queryBaseSchema.extend({
  kind: z.literal('pieChart'),
});

const pivotTableQuerySchema = queryBaseSchema.extend({
  kind: z.literal('pivotTable'),
  rowDimension: z.string(),
  columnDimension: z.string(),
});

export const querySchema = z.discriminatedUnion('kind', [
  barChartQuerySchema,
  pieChartQuerySchema,
  pivotTableQuerySchema,
]);

export type Query = z.infer<typeof querySchema>;

const barSchema = z.object({
  label: z.string(),
  series: z.string().nullish(),
  value: z.number(),
});

const sliceSchema = z.object({ label: z.string(), value: z.number() });

const cellSchema = z.object({
  row: z.string(),
  column: z.string(),
  value: z.number(),
});

const dataBaseSchema = z.object({ title: z.string(), valueLabel: z.string() });

const barChartResultSchema = z.object({
  kind: z.literal('barChart'),
  data: dataBaseSchema.extend({ bars: z.array(barSchema) }),
});

const pieChartResultSchema = z.object({
  kind: z.literal('pieChart'),
  data: dataBaseSchema.extend({ slices: z.array(sliceSchema) }),
});

const pivotTableResultSchema = z.object({
  kind: z.literal('pivotTable'),
  data: dataBaseSchema.extend({
    rowDimension: z.string(),
    columnDimension: z.string(),
    cells: z.array(cellSchema),
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
