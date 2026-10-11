import { randomUUID } from 'node:crypto';
import {
  assembleOps,
  wrapAsOperationsEnvelope,
  type A2UIOperation,
} from '@ag-ui/a2ui-toolkit';
import { A2UI_RENDER_STREAM_TYPE } from '@ag-ui/mastra';
import { createTool, type ToolStream } from '@mastra/core/tools';
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
  execute: async ({ surfaces }, context) => {
    const operations = await generateSurfaces(surfaces, context?.writer);
    return wrapAsOperationsEnvelope(operations.flat());
  },
});

export async function generateSurfaces(
  surfaces: SurfaceRequest[],
  writer?: ToolStream,
): Promise<A2UIOperation[][]> {
  const models = await Promise.all(surfaces.map(evaluateModel));
  const prompt = surfaces
    .map((surface, i) => describeSurface(surface, models[i]))
    .join('\n\n---\n\n');
  const callIds = surfaces.map(() => randomUUID());
  await showBuilding(writer, callIds);

  const designed = await a2uiDesigner.stream(prompt);
  const built = new Map<string, A2UIOperation[]>();
  for await (const chunk of designed.fullStream) {
    if (chunk.type !== 'tool-call') {
      continue;
    }
    const design = chunk.payload.args as GenerateA2uiArgs;
    const index = surfaces.findIndex(
      ({ surfaceId }) => surfaceId === design.surfaceId,
    );
    if (index < 0) {
      continue;
    }
    const args = { ...design, data: models[index] } as GenerateA2uiArgs;
    validateSurface(args);
    built.set(args.surfaceId, toOperations(args));
    await showSurface(writer, callIds[index], args);
  }
  return surfaces.map(({ surfaceId }) => builtSurface(built, surfaceId));
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

function toOperations({
  surfaceId,
  components,
  data,
}: GenerateA2uiArgs): A2UIOperation[] {
  return assembleOps({
    intent: 'create',
    surfaceId,
    catalogId: SALES_CATALOG_ID,
    components,
    data,
  });
}

function builtSurface(
  built: Map<string, A2UIOperation[]>,
  surfaceId: string,
): A2UIOperation[] {
  const operations = built.get(surfaceId);
  if (!operations) {
    throw new Error(`The designer built no surface ${surfaceId}.`);
  }
  return operations;
}

async function showBuilding(
  writer: ToolStream | undefined,
  callIds: string[],
): Promise<void> {
  for (const toolCallId of callIds) {
    await emitRender(writer, {
      phase: 'start',
      toolCallId,
      toolName: 'generate_a2ui',
    });
  }
}

async function showSurface(
  writer: ToolStream | undefined,
  toolCallId: string,
  args: GenerateA2uiArgs,
): Promise<void> {
  const argsTextDelta = JSON.stringify(args);
  await emitRender(writer, { phase: 'delta', toolCallId, argsTextDelta });
  await emitRender(writer, { phase: 'end', toolCallId });
}

async function emitRender(
  writer: ToolStream | undefined,
  payload: Record<string, unknown>,
): Promise<void> {
  // the AG-UI bridge reads payload, Mastra's chunk type wants data
  const chunk = {
    type: A2UI_RENDER_STREAM_TYPE,
    data: payload,
    payload,
    transient: true,
  };
  await writer?.custom(chunk);
}
