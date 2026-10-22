import { createTool } from '@mastra/core/tools';
import jsonata from 'jsonata';
import { z } from 'zod';
import {
  aggregate,
  details,
  type AggregateQuery,
  type DetailsQuery,
} from './sales/sales-api';

const MAX_RESULT_CHARS = 50_000;
const TIMEOUT_MS = 30_000;

export const jsonataDescription = `
    Functions:
      \`$aggregate({ "fact", "aggregateFn", "dimensions", "filter" })\` returns rows like
        \`{ "Country": "Germany", "value": 123.4 }\`
      \`$details({ "columns", "filter", "sort", "limit", "offset" })\` returns
        \`{ "rows", "totalCount" }\`, limit up to 1000
    Here, \`filter\` is a plain object with a single value per column, e.g.
    \`{ "Country": "Germany" }\`, not a list like
    \`[{ "column": "Country", "value": "Germany" }]\`. For several values, add the column
    as a dimension and select the rows, e.g. \`$rows[Continent in ["Europe", "Americas"]]\`.
    Only "fact", "aggregateFn" and "dimensions" of $aggregate are required. Leave out the
    keys you don't need instead of passing empty values: \`{ "ItemName": "" }\` selects
    the rows with an empty ItemName, i.e. none.

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
      A function body with several statements needs its own block, e.g.
        \`function($c) { ( $x := $rows[Continent = $c]; { "continent": $c, "rows": $x } ) }\`.

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
  outputSchema: z.object({ result: z.unknown() }),
  execute: async ({ expression }) => evaluateExpression(expression),
});

export async function evaluateExpression(
  expression: string,
): Promise<{ result: unknown }> {
  let result: unknown;

  try {
    result = await jsonata(expression, { timeout: TIMEOUT_MS }).evaluate(
      undefined,
      {
        aggregate: async (query: AggregateQuery) => {
          const { rows } = await aggregate(query);
          return rows;
        },
        details: async (query: DetailsQuery) => {
          const { rows, totalCount } = await details(query);
          return { rows, totalCount };
        },
      },
    );
  } catch (err) {
    throw toError(err);
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

function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  const { code, message, position } = error as jsonata.JsonataError;
  return new Error(`JSONata ${code} at position ${position}: ${message}`);
}
