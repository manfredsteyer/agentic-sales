import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import {
  evaluateExpression,
  jsonataDescription,
  jsonataLimitsDescription,
} from './evaluate-jsonata';
import {
  barsSchema,
  cellsSchema,
  queryResultSchema,
  querySchema,
  slicesSchema,
  type Query,
  type QueryResult,
} from './query-schema';
import {
  approvalResumeSchema,
  approvalSuspendSchema,
  type ApprovalContext,
} from './row-limit';

export const runQuery = createTool({
  id: 'run-query',
  description: `
    Shows the result of a query to the user as a bar chart, pie chart or pivot table,
    depending on its kind: evaluates its JSONata expression and returns the data.
    ${jsonataDescription}
    ${jsonataLimitsDescription}
  `,
  inputSchema: z.object({ spec: querySchema }),
  outputSchema: queryResultSchema,
  suspendSchema: approvalSuspendSchema,
  resumeSchema: approvalResumeSchema,
  execute: async ({ spec }, context) => {
    try {
      return await evaluateQuery(spec, context);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { kind: 'message' as const, status: 'failed' as const, message };
    }
  },
});

export async function evaluateQuery(
  spec: Query,
  context?: ApprovalContext,
): Promise<QueryResult> {
  const evaluated = await evaluateExpression(spec.expression, context);
  if (!('result' in evaluated)) {
    return { kind: 'message', ...evaluated };
  }
  return toQueryResult(spec, evaluated.result);
}

function toQueryResult(spec: Query, value: unknown): QueryResult {
  switch (spec.kind) {
    case 'barChart':
      return {
        kind: spec.kind,
        data: {
          title: spec.title,
          valueLabel: spec.valueLabel,
          bars: parseData(barsSchema, value),
        },
      };
    case 'pieChart':
      return {
        kind: spec.kind,
        data: {
          title: spec.title,
          valueLabel: spec.valueLabel,
          slices: parseData(slicesSchema, value),
        },
      };
    case 'pivotTable':
      return {
        kind: spec.kind,
        data: {
          title: spec.title,
          rowDimension: spec.rowDimension,
          columnDimension: spec.columnDimension,
          valueLabel: spec.valueLabel,
          cells: parseData(cellsSchema, value),
        },
      };
  }
}

function parseData<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new Error(
      `The expression returned data in the wrong shape.\n${z.prettifyError(result.error)}`,
    );
  }
  return result.data;
}
