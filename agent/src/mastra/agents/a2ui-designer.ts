import { Agent } from '@mastra/core/agent';
import { DEFAULT_OPTIONS, MODEL } from '../config';
import { render_a2ui } from '../tools/render-a2ui';
import { a2uiDesignerPrompt } from './a2ui-designer.prompt';

export const a2uiDesigner = new Agent({
  id: 'a2ui-designer',
  name: 'A2UI Designer',
  instructions: a2uiDesignerPrompt,
  model: MODEL,
  defaultOptions: {
    ...DEFAULT_OPTIONS,
    toolChoice: 'required',
    maxSteps: 1,
  },
  tools: { render_a2ui },
});
