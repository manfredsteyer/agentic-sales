import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { type FrontendToolConfig } from '@copilotkit/angular';
import { z } from 'zod';

export const explorerToolSchema = z.object({
  fact: z.string().describe('Fact column, e.g. "Revenue"'),
  aggregateFn: z.enum(['sum', 'avg', 'count']),
  dimensions: z
    .array(z.string())
    .min(1)
    .max(2)
    .describe('1-2 columns to group by, e.g. ["Month", "DeviceCategory"]'),
  filters: z
    .array(z.object({ column: z.string(), value: z.string() }))
    .describe(
      'Exact-match filters, e.g. [{ "column": "Country", "value": "Germany" }]',
    ),
  view: z
    .enum(['bar', 'pie', 'pivot'])
    .describe('Initial view of the explorer'),
});

export type ExplorerToolArgs = z.infer<typeof explorerToolSchema>;

export const explorerTool: FrontendToolConfig<ExplorerToolArgs> = {
  name: 'explorer',
  description: `
    Opens an aggregation in the interactive Explorer, where the user can change
    dimensions, filters and the chart type. Call it ONLY when the user wants to explore the
    data themselves or asks for an interactive view - never on your own initiative, never
    just to show a result and never for follow-up questions like "and per country?": answer
    those in the chat. For results computed with evaluateJsonata, pass the
    aggregation they are based on: the view shows these base values, not the derived ones.
    Not suitable for order counts.
  `,
  parameters: explorerToolSchema,
  handler: async (input) => {
    const router = inject(Router);
    await router.navigate([
      '/explorer',
      {
        agg: input.aggregateFn,
        fact: input.fact,
        dim1: input.dimensions[0],
        dim2: input.dimensions[1] ?? '',
        filter: input.filters.map((f) => `${f.column}:${f.value}`).join(','),
        view: input.view,
      },
    ]);
    return { opened: true };
  },
};
