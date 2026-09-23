import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { type FrontendToolConfig } from '@copilotkit/angular';
import { z } from 'zod';

import { toQueryParams } from '../../explore/explore-params';

export const exploreDataSchema = z.object({
  fact: z.string().describe('Fact column, e.g. "Revenue"'),
  aggregateFn: z.enum(['sum', 'avg', 'count']),
  dimensions: z
    .array(z.string())
    .min(1)
    .max(2)
    .describe('1-2 columns to group by, e.g. ["Month", "DeviceCategory"]'),
  filters: z
    .array(z.object({ column: z.string(), value: z.string() }))
    .describe('Exact-match filters, e.g. [{ "column": "Country", "value": "Germany" }]'),
  view: z.enum(['bar', 'pie', 'pivot']).describe('Initial view of the explorer'),
});

export type ExploreDataArgs = z.infer<typeof exploreDataSchema>;

export const exploreDataTool: FrontendToolConfig<ExploreDataArgs> = {
  name: 'exploreData',
  description:
    'Opens an aggregation in the interactive Explore view, where the user can change ' +
    'dimensions, filters and the chart type. Call it ONLY when the user wants to explore the ' +
    'data themselves or asks for an interactive view - never on your own initiative, never ' +
    'just to show a result and never for follow-up questions like "and per country?": answer ' +
    'those in the chat. For results computed with executeJavaScript, pass the ' +
    'aggregation they are based on: the view shows these base values, not the derived ones. ' +
    'Not suitable for order counts.',
  parameters: exploreDataSchema,
  handler: async (query) => {
    const router = inject(Router);
    await router.navigate(['/explore'], { queryParams: toQueryParams(query) });
    return { opened: true };
  },
};
