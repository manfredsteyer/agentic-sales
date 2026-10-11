import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createMcpExpressApp } from '@modelcontextprotocol/express';
import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from '@modelcontextprotocol/ext-apps/server';
import { NodeStreamableHTTPServerTransport } from '@modelcontextprotocol/node';
import { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';

const PORT = 3001;
const WIDGET_URI = 'ui://stock/stock-widget.html';
const WIDGET_PATH = join(import.meta.dirname, 'dist', 'stock-widget.html');
const WAREHOUSES = ['A', 'B', 'C'];

const stockByProduct = new Map<string, Record<string, number>>();

function getStock(productName: string): Record<string, number> {
  const stock = stockByProduct.get(productName) ?? randomStock();
  stockByProduct.set(productName, stock);
  return stock;
}

function randomStock(): Record<string, number> {
  return Object.fromEntries(
    WAREHOUSES.map((warehouse) => [
      warehouse,
      100 + Math.floor(Math.random() * 901),
    ]),
  );
}

function createServer(): McpServer {
  const server = new McpServer({ name: 'Stock Server', version: '1.0.0' });

  registerAppTool(
    server,
    'get-stock',
    {
      title: 'Get Stock',
      description: 'Shows the stock of a product per warehouse.',
      inputSchema: z.object({ productName: z.string() }),
      _meta: { ui: { resourceUri: WIDGET_URI } },
    },
    async ({ productName }) => {
      const result = { productName, stock: getStock(productName) };
      return {
        content: [{ type: 'text', text: JSON.stringify(result) }],
        structuredContent: result,
      };
    },
  );

  registerAppResource(
    server,
    'Stock Widget',
    WIDGET_URI,
    { mimeType: RESOURCE_MIME_TYPE },
    async () => ({
      contents: [
        {
          uri: WIDGET_URI,
          mimeType: RESOURCE_MIME_TYPE,
          text: await readFile(WIDGET_PATH, 'utf-8'),
        },
      ],
    }),
  );

  return server;
}

const app = createMcpExpressApp();

app.all('/mcp', async (req, res) => {
  const server = createServer();
  const transport = new NodeStreamableHTTPServerTransport();
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

app.listen(PORT, () => console.log(`MCP server: http://localhost:${PORT}/mcp`));
