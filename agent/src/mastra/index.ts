import { Mastra } from '@mastra/core';
import { registerApiRoute } from '@mastra/core/server';

import { salesAgent } from './agents/sales-agent';
import { agUiRouteHandler } from './routes/ag-ui-route';

export const mastra = new Mastra({
  agents: { salesAgent },
  server: {
    // The Angular dev server calls the AG-UI endpoint from another origin.
    cors: {
      origin: ['http://localhost:4200', 'http://localhost:4111'],
      allowHeaders: ['Content-Type', 'Authorization'],
      allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    },
    apiRoutes: [
      registerApiRoute('/ag-ui/:agentId', {
        method: 'POST',
        handler: agUiRouteHandler,
      }),
    ],
  },
});
