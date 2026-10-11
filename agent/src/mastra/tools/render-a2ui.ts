import {
  assembleOps,
  wrapAsOperationsEnvelope,
  type A2UIOperation,
} from '@ag-ui/a2ui-toolkit';
import type { ToolCallChunk } from '@mastra/core/stream';
import { createTool } from '@mastra/core/tools';
import { SALES_CATALOG_ID } from '@shared/a2ui/sales-catalog-definitions';
import { z } from 'zod';
import { a2uiDesigner } from '../agents/a2ui-designer';
import { evaluateExpression } from './evaluate-jsonata';
import { validateSurface, type GenerateA2uiArgs } from './validate-surface';

export const surfaceRequestSchema = z.object({
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

export const renderA2uiSchema = z.object({
  surfaces: z
    .array(surfaceRequestSchema)
    .describe('All surfaces of the answer, e.g. one per tile'),
});

export type SurfaceRequest = z.infer<typeof surfaceRequestSchema>;

export const render_a2ui = createTool({
  id: 'render-a2ui',
  description: `
    Shows the user one or more A2UI surfaces: a designer agent builds them from the
    requests and binds each to the data model that its JSONata expression returns. The
    result contains the data models.
  `,
  inputSchema: renderA2uiSchema,
  execute: async ({ surfaces }) => {
    const operations = await generateSurfaces(surfaces);
    return wrapAsOperationsEnvelope(operations.flat());
  },
});

export async function generateSurfaces(
  surfaces: SurfaceRequest[],
): Promise<A2UIOperation[][]> {
  const models = await Promise.all(surfaces.map(evaluateModel));
  const prompt = surfaces
    .map((surface, i) => describeSurface(surface, models[i]))
    .join('\n\n---\n\n');
  const designed = await a2uiDesigner.generate(prompt);
  const calls = designed.toolCalls;
  return surfaces.map((surface, i) =>
    toOperations(surface.surfaceId, models[i], calls),
  );
}

async function evaluateModel({ expression }: SurfaceRequest): Promise<unknown> {
  const evaluated = await evaluateExpression(expression);
  return 'result' in evaluated ? evaluated.result : undefined;
}

function describeSurface(
  { surfaceId, request }: SurfaceRequest,
  model: unknown,
): string {
  const json = JSON.stringify(model);
  return `Surface ${surfaceId}: ${request}\n\nData model:\n${json}`;
}

function toOperations(
  surfaceId: string,
  data: unknown,
  calls: ToolCallChunk[],
): A2UIOperation[] {
  const designs = calls.map((call) => call.payload.args as GenerateA2uiArgs);
  const design = designs.find((candidate) => candidate.surfaceId === surfaceId);
  if (!design) {
    throw new Error(`The designer built no surface ${surfaceId}.`);
  }

  const args = { ...design, surfaceId, data } as GenerateA2uiArgs;
  validateSurface(args);

  return assembleOps({
    intent: 'create',
    surfaceId,
    catalogId: SALES_CATALOG_ID,
    components: args.components,
    data: args.data,
  });
}
