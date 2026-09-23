import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

import { MAX_ROWS } from '../config';
import { runSandbox } from '../utils/sandbox';
import {
  approvalResumeSchema,
  approvalSuspendSchema,
  askForApproval,
  DECLINED,
  notExecutedSchema,
} from './row-limit';
import { aggregate, type AggregateQuery, details, type DetailsQuery } from './sales-api';

// Keeps a runaway result (e.g. thousands of raw rows) out of the model's context.
const MAX_RESULT_CHARS = 50_000;

export const executeJavaScript = createTool({
  id: 'execute-javascript',
  description: `
    Runs a JavaScript snippet in a QuickJS sandbox for calculations the aggregation API
    can't do, e.g. shares, growth rates, rankings or order counts.

    The snippet runs as an ES module: use top-level \`await\`, no \`return\`, no \`import\`.
    Host functions:
      \`await aggregate({ fact, aggregateFn, dimensions, filter })\` returns rows like
        \`{ Country: "Germany", value: 123.4 }\`
      \`await details({ columns, filter, sort, limit, offset })\` returns \`{ rows, totalCount }\`,
        limit up to 1000
      \`submitResult(result)\` - call it exactly once with the JSON result
    Here, \`filter\` is a plain object, e.g. \`{ Country: "Germany" }\`.

    For a visualization, submit the data in the shape the visualization tool expects and pass
    it on unchanged.

    There are no other APIs (no fetch, console or require). Limits: 30 s, 64 MB and results
    of up to ${MAX_RESULT_CHARS} characters. A query with more than ${MAX_ROWS} result rows
    needs the user's approval; the snippet then runs again from the start.
  `,
  inputSchema: z.object({
    code: z
      .string()
      .describe(
        'Module body. Load data with `await aggregate(...)` or `await details(...)`, ' +
          'transform it, then call `submitResult(result)` exactly once.',
      ),
  }),
  outputSchema: z.union([z.object({ result: z.unknown() }), notExecutedSchema]),
  suspendSchema: approvalSuspendSchema,
  resumeSchema: approvalResumeSchema,
  execute: async ({ code }, context) => {
    const approval = context?.agent?.resumeData;
    if (approval && !approval.approved) {
      return DECLINED;
    }

    // Set when a query exceeds MAX_ROWS without approval. The host function
    // then withholds the data and aborts the snippet; this flag, not the
    // snippet, decides, so catching the error inside the snippet won't help.
    let tooLarge: number | undefined;
    const checkRowLimit = (rows: number) => {
      if (rows > MAX_ROWS && !approval?.approved) {
        tooLarge = Math.max(tooLarge ?? 0, rows);
        throw new Error(`The result has ${rows} rows (max. ${MAX_ROWS}) and needs approval.`);
      }
    };
    let submitted: { result: unknown } | undefined;

    try {
      await runSandbox(code, {
        functions: {
          aggregate: async (query: AggregateQuery) => {
            const { rowCount, rows } = await aggregate(query);
            checkRowLimit(rowCount);
            return rows;
          },
          details: async (query: DetailsQuery) => {
            const { rows, totalCount } = await details(query);
            checkRowLimit(totalCount);
            return { rows, totalCount };
          },
          submitResult: (result: unknown) => {
            submitted = { result };
          },
        },
      });
    } catch (err) {
      if (tooLarge === undefined) throw err;
    }

    if (tooLarge !== undefined) {
      // resuming with approval runs the whole snippet again
      return askForApproval(context, tooLarge);
    }
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
