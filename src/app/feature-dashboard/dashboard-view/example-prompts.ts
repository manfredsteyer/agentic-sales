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
      'Add one pie chart per continent to the dashboard. Each chart should show the revenue of the 3 best-selling products of the continent in the Bags category.',
  },
  {
    label: 'Example 4',
    prompt:
      'Show me the Google Camp Mug Ivory: its image on the left and, next to it, the product name as a heading followed by the lines "Price: …", "Quantity sold: …" and "Revenue: …". Use the most common price.',
  },
  {
    label: 'Example 5',
    prompt:
      'Add one tile per continent to the dashboard. Each tile should show a table of the 3 best-selling products of the continent with their image, name and revenue.',
  },
  {
    label: 'Example 6',
    prompt:
      'Find the 6 best-selling products worldwide and add one tile per product to the dashboard. Each tile should show the product name, image, revenue and quantity sold.',
  },
];
