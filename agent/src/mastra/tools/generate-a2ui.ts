import {
  assembleOps,
  wrapAsOperationsEnvelope,
  type A2UIOperation,
} from '@ag-ui/a2ui-toolkit';
import { createTool } from '@mastra/core/tools';
import { SALES_CATALOG_ID } from '@shared/a2ui/sales-catalog-definitions';
import { z } from 'zod';
import { a2uiDesigner } from '../agents/a2ui-designer';
import { evaluateExpression } from './evaluate-jsonata';
import { validateSurface, type RenderA2uiArgs } from './validate-surface';

export const generateA2uiSchema = z.object({
  surfaceId: z
    .string()
    .describe(
      'Unique id of the surface, lowercase and hyphenated, e.g. "google-camp-mug-ivory"',
    ),
  request: z
    .string()
    .describe(
      'What the surface shows and how: the layout, the fields of the data model and buttons',
    ),
  expression: z
    .string()
    .describe(
      'JSONata expression as for evaluateJsonata that returns the data model of the surface',
    ),
});

export type GenerateA2uiArgs = z.infer<typeof generateA2uiSchema>;

export const generate_a2ui = createTool({
  id: 'generate-a2ui',
  description: `
    Shows the user an A2UI surface: a designer agent builds it from the request and binds
    it to the data model that the JSONata expression returns. The result contains the data
    model.
  `,
  inputSchema: generateA2uiSchema,
  execute: async (args) => {
    const operations = await generateSurface(args);
    return wrapAsOperationsEnvelope(operations);
  },
});

export async function generateSurface({
  surfaceId,
  request,
  expression,
}: GenerateA2uiArgs): Promise<A2UIOperation[]> {
  const evaluated = await evaluateExpression(expression);
  const data = 'result' in evaluated ? evaluated.result : undefined;
  const model = JSON.stringify(data);

  const prompt = `Surface ${surfaceId}: ${request}\n\nData model:\n${model}`;
  const designed = await a2uiDesigner.generate(prompt);

  const [renderCall] = designed.toolCalls;

  const args = {
    ...renderCall.payload.args,
    surfaceId,
    data,
  } as RenderA2uiArgs;

  validateSurface(args);

  return assembleOps({
    intent: 'create',
    surfaceId,
    catalogId: SALES_CATALOG_ID,
    components: args.components,
    data: args.data,
  });
}
