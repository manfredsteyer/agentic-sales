import { RENDER_A2UI_TOOL } from '@ag-ui/a2ui-middleware';
import { createTool } from '@mastra/core/tools';

export const render_a2ui = createTool({
  id: 'render-a2ui',
  description: RENDER_A2UI_TOOL.description,
  strict: false,
  inputSchema: RENDER_A2UI_TOOL.parameters,
});
