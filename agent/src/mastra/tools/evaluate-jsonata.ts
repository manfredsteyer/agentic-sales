import { createTool } from '@mastra/core/tools';
import jsonata from 'jsonata';
import { z } from 'zod';
import { MAX_ROWS } from '../config';
import {
  approvalResumeSchema,
  approvalSuspendSchema,
  askForApproval,
  DECLINED,
  isApproved,
  notExecutedSchema,
  rememberApproval,
  type ApprovalContext,
  type NotExecuted,
} from './row-limit';
import {
  aggregate,
  details,
  type AggregateQuery,
  type DetailsQuery,
} from './sales/sales-api';

const MAX_RESULT_CHARS = 50_000;
const TIMEOUT_MS = 30_000;

const dataModelSchema = z.record(z.string(), z.unknown());

export const jsonataDescription = `
    Functions:
      \`$aggregate({ "fact", "aggregateFn", "dimensions", "filter", "sort", "limit" })\`
        returns rows like \`{ "Country": "Germany", "value": 123.4 }\`; \`dimensions\` lists
        1 or 2 columns, for a grand total sum these rows, e.g.
        \`$sum($aggregate({ ..., "dimensions": ["ItemName"] }).value)\`
      \`$details({ "columns", "filter", "sort", "limit", "offset" })\` returns
        \`{ "rows", "totalCount" }\`
    Here, \`filter\` is a plain object with a single value per column, e.g.
    \`{ "Country": "Germany" }\`, not a list like
    \`[{ "column": "Country", "value": "Germany" }]\`. For several values, add the column
    as a dimension and select the rows, e.g. \`$rows[Continent in ["Europe", "Americas"]]\`.
    \`sort\` is like \`[{ "column": "Price", "direction": "desc" }]\`; $aggregate sorts by
    a dimension or by "value". \`limit\` is up to 1000 and silently drops further rows.
    For the top items of each group, e.g. the 3 best products per continent, call
    $aggregate once per group with a filter, a sort by "value" and a limit, all groups
    in a single expression:
      ["Africa", "Europe"].{ "continent": $, "rows": $aggregate({ "fact": "Revenue",
        "aggregateFn": "sum", "dimensions": ["ItemName"], "filter": { "Continent": $ },
        "sort": [{ "column": "value", "direction": "desc" }], "limit": 3 })[] }
    Rows of both functions with ItemName or ItemCategory also contain ItemImageUrl or
    ItemCategoryImageUrl, the URL of the image. Don't request these URLs as columns or
    dimensions.
    Compute sums, averages and counts with \`$aggregate\`, never from \`$details\` rows.
    Use \`$details\` only for values of single rows, e.g. prices.

    The value of the expression is the result. Bind intermediate results with \`:=\` in a
    block \`( ...; ...; ... )\`. JSONata unwraps arrays with a single item: append \`[]\`
    to a path that must return an array, e.g. \`$rows.{ "label": Country }[]\`.

    JSONata is not JavaScript:
      Sort with the order-by operator, e.g. \`$rows^(>value)\` for descending values. A
      \`$sort\` comparator returns a boolean: true if the two items need to be swapped.
      Select by position with a range in double brackets, e.g. \`$rows[[0..6]]\`.
      Functions like \`$sum\` return nothing, not 0, for an empty selection.
      \`and\` and \`or\` return booleans: \`$v or 0\` is no fallback, write \`$exists($v) ? $v : 0\`.
      Inside a filter \`[...]\`, \`$\` is the filtered item: bind an outer value to a variable,
        e.g. \`$map($cats, function($c) { $sum($rows[ItemCategory = $c].value) })\`.

    The 7 largest items plus "Other" for the rest:
      ( $slices := $rows.{ "label": ItemName, "value": value }^(>value);
        $rest := $slices[[7..$count($slices)]];
        $append($slices[[0..6]], $rest ? { "label": "Other", "value": $sum($rest.value) } : []) )

    The 7 largest series plus "Other" per label, as bars of a bar chart:
      ( $rows := $aggregate({ "fact": "Revenue", "aggregateFn": "sum", "dimensions": ["Continent", "ItemCategory"] });
        $totals := $each($rows{ ItemCategory: $sum(value) }, function($v, $k) { { "series": $k, "value": $v } })^(>value);
        $top := $totals[[0..6]].series;
        $other := $rows[$not(ItemCategory in $top)]{ Continent: $sum(value) };
        $append($rows[ItemCategory in $top].{ "label": Continent, "series": ItemCategory, "value": value },
          $each($other, function($v, $k) { { "label": $k, "series": "Other", "value": $v } })) )
`;

export const jsonataLimitsDescription = `
    Limits: ${TIMEOUT_MS / 1000} s and results of up to ${MAX_RESULT_CHARS} characters.
    A query with more than ${MAX_ROWS} result rows needs the user's approval; the
    expression then runs again from the start.
`;

export const evaluateJsonata = createTool({
  id: 'evaluate-jsonata',
  description: `
    Evaluates a JSONata expression for calculations the aggregation API can't do,
    e.g. shares, growth rates, rankings or order counts.
    ${jsonataDescription}
    ${jsonataLimitsDescription}
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
  execute: async ({ expression }, context) =>
    evaluateExpression(expression, context),
});

export async function evaluateExpression(
  expression: string,
  context?: ApprovalContext,
): Promise<{ result: unknown } | NotExecuted> {
  const agent = context?.agent;
  const approval = agent?.resumeData;
  if (approval && !approval.approved) {
    return DECLINED;
  }
  rememberApproval(context);

  let tooLarge: number | undefined;
  const checkRowLimit = (rows: number) => {
    if (
      agent &&
      rows > MAX_ROWS &&
      !approval?.approved &&
      !isApproved(context, rows)
    ) {
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
}

export async function evaluateDataModel(
  expression: string,
): Promise<Record<string, unknown>> {
  const evaluated = await evaluateExpression(expression);
  if (!('result' in evaluated)) {
    throw new Error(evaluated.message);
  }
  const dataModel = dataModelSchema.safeParse(evaluated.result);
  if (!dataModel.success) {
    throw new Error(
      'The expression must return an object: the data model of the surface.',
    );
  }
  return dataModel.data;
}

function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  const { code, message, position } = error as jsonata.JsonataError;
  return new Error(`JSONata ${code} at position ${position}: ${message}`);
}
