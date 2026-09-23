import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

import { runSandbox } from '../utils/sandbox';
import { aggregate, type AggregateQuery, details, type DetailsQuery } from './sales-api';

// Keeps a runaway result (e.g. thousands of raw rows) out of the model's context.
const MAX_RESULT_CHARS = 50_000;

export const executeJavaScriptTool = createTool({
  id: 'execute-javascript',
  description: `
    Runs a snippet of JavaScript inside a hardened QuickJS sandbox to load sales data and
    transform it beyond what the aggregation API can do: shares and percentages, differences
    and growth rates, rankings and top-N lists, ratios such as revenue per order, or
    combinations of several queries.

    The snippet is executed AS AN ES MODULE, so top-level \`await\` is supported. There is NO
    wrapping function — write straight-line statements; do NOT use \`return\`.

    THREE host functions are exposed:

      \`await aggregate({ fact, aggregateFn, dimensions, filter }): Promise<Row[]>\`
        Like the aggregateSales tool; rows look like \`{ Country: "Germany", value: 123.4 }\`.
      \`await details({ columns, filter, sort, limit, offset }): Promise<{ rows: Row[], totalCount: number }>\`
        Like the getSalesDetails tool, but limit may be up to 1000;
        sort looks like \`[{ column: "Revenue", direction: "desc" }]\`.
      \`submitResult(result): void\`
        Call it EXACTLY ONCE with the final, JSON-serializable result.

    Unlike in the tools, \`filter\` is a plain object here: \`{ Country: "Germany", Medium: "organic" }\`.

    To visualize the result, submit the points barChart, pieChart and pivotTable expect,
    e.g. \`[{ label: "2020-12", value: 42.5 }]\` or
    \`[{ label: "2020-12", series: "mobile", value: 42.5 }]\`, and pass them on unchanged.

    The sandbox has NO other host APIs: no \`fetch\`, no \`import\`, no \`require\`, no \`process\`,
    no \`console\`, no network beyond the functions above. \`import\`/\`export\` statements are
    rejected. It is killed after 30 s wall-clock time and is hard-capped at 64 MB memory and
    1 MB stack. Results longer than ${MAX_RESULT_CHARS} characters of JSON are rejected:
    aggregate further instead of returning raw rows.
  `,
  inputSchema: z.object({
    code: z
      .string()
      .describe(
        'Module body. Load data with `await aggregate(...)` or `await details(...)`, ' +
          'transform it, then call `submitResult(result)` exactly once.',
      ),
  }),
  outputSchema: z.object({
    result: z.unknown(),
  }),
  execute: async ({ code }) => {
    let submitted: { result: unknown } | undefined;

    await runSandbox(code, {
      functions: {
        aggregate: async (query: AggregateQuery) => (await aggregate(query)).rows,
        details: async (query: DetailsQuery) => {
          const { rows, totalCount } = await details(query);
          return { rows, totalCount };
        },
        submitResult: (result: unknown) => {
          submitted = { result };
        },
      },
    });

    if (!submitted) {
      throw new Error('The snippet finished without calling submitResult(result).');
    }
    const size = JSON.stringify(submitted.result ?? null).length;
    if (size > MAX_RESULT_CHARS) {
      throw new Error(
        `The result has ${size} characters of JSON (max. ${MAX_RESULT_CHARS}). ` +
          'Aggregate further or return fewer rows.',
      );
    }
    return submitted;
  },
});
