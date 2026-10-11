import { Mastra } from '@mastra/core';
import { registerApiRoute } from '@mastra/core/server';
import { LibSQLStore } from '@mastra/libsql';
import { a2uiDesigner } from './agents/a2ui-designer';
import { dashboardAgent } from './agents/dashboard-agent';
import { salesAgent } from './agents/sales-agent';
import { agUiRouteHandler } from './routes/ag-ui-route';

export const mastra = new Mastra({
  agents: { salesAgent, dashboardAgent, a2uiDesigner },
  storage: new LibSQLStore({ id: 'mastra-storage', url: ':memory:' }),
  server: {
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
