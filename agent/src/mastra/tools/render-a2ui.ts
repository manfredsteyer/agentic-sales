import { RENDER_A2UI_TOOL } from '@ag-ui/a2ui-middleware';
import {
  buildA2UIEnvelope,
  formatValidationErrors,
  validateA2UIComponents,
} from '@ag-ui/a2ui-toolkit';
import {
  basicCatalog,
  extractCatalogComponentSchemas,
} from '@copilotkit/a2ui-renderer/web-components';
import { createTool, type ToolExecutionContext } from '@mastra/core/tools';
import { z } from 'zod';
import { A2UI_SURFACES_KEY } from '../config';

interface RenderA2uiArgs extends Record<string, unknown> {
  surfaceId: string;
  components: Record<string, unknown>[];
  data?: Record<string, unknown>;
}

type RenderedSurfaces = Record<string, RenderA2uiArgs>;

interface AgentMessage {
  content: unknown;
}

const renderA2uiCallSchema = z.object({
  type: z.literal('tool-call'),
  toolName: z.literal('render_a2ui'),
  input: z.looseObject({ surfaceId: z.string() }),
});

export const render_a2ui = createTool({
  id: 'render-a2ui',
  description: RENDER_A2UI_TOOL.description,
  strict: false,
  inputSchema: RENDER_A2UI_TOOL.parameters,
  execute: async (input, context) => {
    const args = input as RenderA2uiArgs;
    const { valid, errors } = validateA2UIComponents({
      components: args.components,
      data: args.data,
      catalog: extractCatalogComponentSchemas(basicCatalog),
    });
    if (!valid) {
      throw new Error(formatValidationErrors(errors));
    }
    const surfaces = context?.requestContext?.get<
      string,
      RenderedSurfaces | undefined
    >(A2UI_SURFACES_KEY);
    context?.requestContext?.set(A2UI_SURFACES_KEY, {
      ...surfaces,
      [args.surfaceId]: args,
    });
    return buildA2UIEnvelope({ args, isUpdate: false });
  },
});

export function renderedSurface(
  surfaceId: string,
  context: ToolExecutionContext | undefined,
): Record<string, unknown>[] {
  const surfaces = context?.requestContext?.get<
    string,
    RenderedSurfaces | undefined
  >(A2UI_SURFACES_KEY);
  const args =
    surfaces?.[surfaceId] ??
    lastRenderArgs(context?.agent?.messages ?? [], surfaceId);
  if (!args) {
    throw new Error(`Show the surface ${surfaceId} with render_a2ui first.`);
  }
  const envelope = JSON.parse(buildA2UIEnvelope({ args, isUpdate: false }));
  return envelope.a2ui_operations;
}

function lastRenderArgs(messages: AgentMessage[], surfaceId: string) {
  const renderCalls = messages
    .flatMap((message) => message.content)
    .map((part) => renderA2uiCallSchema.safeParse(part))
    .flatMap((result) => (result.success ? [result.data.input] : []))
    .filter((args) => args.surfaceId === surfaceId);
  return renderCalls.at(-1);
}
