import { createTool } from '@mastra/core/tools';
import jsonata from 'jsonata';
import { z } from 'zod';
import { MAX_ROWS } from '../config';
import {
  approvalResumeSchema,
  approvalSuspendSchema,
  askForApproval,
  DECLINED,
  notExecutedSchema,
} from './row-limit';
import {
  aggregate,
  details,
  type AggregateQuery,
  type DetailsQuery,
} from './sales-api';

const MAX_RESULT_CHARS = 50_000;
const TIMEOUT_MS = 30_000;

export const evaluateJsonata = createTool({
  id: 'evaluate-jsonata',
  description: `
    Evaluates a JSONata expression for calculations the aggregation API can't do,
    e.g. shares, growth rates, rankings or order counts.

    Functions:
      \`$aggregate({ "fact", "aggregateFn", "dimensions", "filter" })\` returns rows like
        \`{ "Country": "Germany", "value": 123.4 }\`
      \`$details({ "columns", "filter", "sort", "limit", "offset" })\` returns
        \`{ "rows", "totalCount" }\`, limit up to 1000
    Here, \`filter\` is a plain object, e.g. \`{ "Country": "Germany" }\`.

    The value of the expression is the result. Bind intermediate results with \`:=\` in a
    block \`( ...; ...; ... )\`. JSONata unwraps arrays with a single item: append \`[]\`
    to a path that must return an array, e.g. \`$rows.{ "label": Country }[]\`.

    For a visualization, return the data in the shape the visualization tool expects and
    pass it on unchanged.

    Limits: ${TIMEOUT_MS / 1000} s and results of up to ${MAX_RESULT_CHARS} characters.
    A query with more than ${MAX_ROWS} result rows needs the user's approval; the
    expression then runs again from the start.
  `,
  inputSchema: z.object({
    expression: z.string().describe(`
      JSONata expression that loads data with $aggregate or $details and transforms it, e.g.
      ( $rows := $aggregate({ "fact": "Revenue", "aggregateFn": "sum", "dimensions": ["Country"] });
        $total := $sum($rows.value);
        $rows.{ "label": Country, "value": $round(value / $total * 100, 1) }[] )
    `),
  }),
  outputSchema: z.union([z.object({ result: z.unknown() }), notExecutedSchema]),
  suspendSchema: approvalSuspendSchema,
  resumeSchema: approvalResumeSchema,
  execute: async ({ expression }, context) => {
    const approval = context?.agent?.resumeData;
    if (approval && !approval.approved) {
      return DECLINED;
    }

    let tooLarge: number | undefined;
    const checkRowLimit = (rows: number) => {
      if (rows > MAX_ROWS && !approval?.approved) {
        tooLarge = Math.max(tooLarge ?? 0, rows);
        throw new Error(
          `The result has ${rows} rows (max. ${MAX_ROWS}) and needs approval.`,
        );
      }
    };
    let result: unknown;

    try {
      result = await jsonata(expression, { timeout: TIMEOUT_MS }).evaluate(
        undefined,
        {
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
        },
      );
    } catch (err) {
      if (tooLarge === undefined) throw toError(err);
    }

    if (tooLarge !== undefined) {
      return askForApproval(context, tooLarge);
    }
    if (result === undefined) {
      throw new Error(
        'The expression returned nothing. Check the field names and filter values.',
      );
    }
    const size = JSON.stringify(result).length;
    if (size > MAX_RESULT_CHARS) {
      throw new Error(
        `The result has ${size} characters of JSON (max. ${MAX_RESULT_CHARS}). ` +
          'Aggregate further or return fewer rows.',
      );
    }
    return { result };
  },
});

function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  const { code, message, position } = error as jsonata.JsonataError;
  return new Error(`JSONata ${code} at position ${position}: ${message}`);
}
