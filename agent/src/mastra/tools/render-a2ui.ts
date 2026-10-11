import { RENDER_A2UI_TOOL } from '@ag-ui/a2ui-middleware';
import { buildA2UIEnvelope } from '@ag-ui/a2ui-toolkit';
import { createTool } from '@mastra/core/tools';
import { validateSurface, type RenderA2uiArgs } from './validate-surface';

export const render_a2ui = createTool({
  id: 'render-a2ui',
  description: RENDER_A2UI_TOOL.description,
  strict: false,
  inputSchema: RENDER_A2UI_TOOL.parameters,
  execute: async (input) => {
    const args = input as RenderA2uiArgs;
    validateSurface(args);
    return buildA2UIEnvelope({ args, isUpdate: false });
  },
});
