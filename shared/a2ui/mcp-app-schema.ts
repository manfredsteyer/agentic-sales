import { z } from 'zod/v3';

export const mcpAppSchema = z
  .object({
    resourceUri: z
      .string()
      .describe('The UI Resource from the description of the MCP App tool'),
    toolInput: z
      .record(z.unknown())
      .describe(
        'The args for the MCP App tool, e.g. { "productName": "Google Mug" }',
      ),
  })
  .describe(
    'Shows an MCP App, e.g. the stock of a product. The app loads its data itself with the tool args.',
  );
