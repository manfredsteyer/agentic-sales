import { RENDER_A2UI_TOOL } from '@ag-ui/a2ui-middleware';
import { buildA2UIEnvelope } from '@ag-ui/a2ui-toolkit';
import { createTool } from '@mastra/core/tools';
import { evaluateDataModel } from './evaluate-jsonata';
import { validateSurface } from './validate-surface';

export interface SurfaceArgs {
  surfaceId: string;
  components: Record<string, unknown>[];
  expression?: string;
}

const renderA2uiProperties = RENDER_A2UI_TOOL.parameters.properties;

export const surfaceInputSchema = {
  ...RENDER_A2UI_TOOL.parameters,
  properties: {
    surfaceId: renderA2uiProperties.surfaceId,
    components: renderA2uiProperties.components,
    expression: {
      type: 'string',
      description: `
        evaluateJsonata expression that returns the complete data model of the surface.
        The app runs it to fill the data model, in the chat and on the dashboard. Leave it
        out only for a surface without query data, e.g. with an McpApp.
      `,
    },
  },
};

export const render_a2ui = createTool({
  id: 'render-a2ui',
  description: RENDER_A2UI_TOOL.description,
  strict: false,
  inputSchema: surfaceInputSchema,
  execute: async (input) => buildSurfaceEnvelope(input as SurfaceArgs),
});

export async function buildSurfaceEnvelope({
  surfaceId,
  components,
  expression,
}: SurfaceArgs): Promise<string> {
  const data = expression ? await evaluateDataModel(expression) : undefined;
  const args = { surfaceId, components, data };
  validateSurface(args);
  return buildA2UIEnvelope({ args, isUpdate: false });
}
