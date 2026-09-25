import { ExamplePrompt } from '../../shared/utils/example-prompt';

export const examplePrompts: ExamplePrompt[] = [
  { label: 'Example 1', prompt: 'Show me the revenue per category.' },
  {
    label: 'Example 2',
    prompt:
      'Add a bar chart to the dashboard that compares Europe and the Americas regarding the revenue per category.',
  },
  {
    label: 'Example 3',
    prompt:
      'Add one pie chart per continent to the dashboard. Each chart should show the revenue of the products in the Bags category.',
  },
];
