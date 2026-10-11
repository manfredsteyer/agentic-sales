import {
  ApplicationConfig,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideCopilotKit } from '@copilotkit/angular';
import { provideMCPApps } from '@copilotkit/angular/mcp-apps';
import { initDashboardAgent } from './agents/dashboard/dashboard-agent';
import { initSalesAgent } from './agents/sales/sales-agent';
import { routes } from './app.routes';
import { mcpAppsConfig } from './mcp-apps.config';
import { salesCatalog } from './shared/a2ui/sales-catalog';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),

    provideCopilotKit({
      defaultToolRendering: true,
      enableInspector: false,
      a2ui: { catalog: salesCatalog, includeSchema: false },
    }),
    provideMCPApps(mcpAppsConfig),
    provideAppInitializer(initSalesAgent),
    provideAppInitializer(initDashboardAgent),
  ],
};
