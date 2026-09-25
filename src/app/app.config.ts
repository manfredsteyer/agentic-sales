import {
  ApplicationConfig,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideCopilotKit } from '@copilotkit/angular';
import { initDashboardAgent } from './agents/dashboard/dashboard-agent';
import { initSalesAgent } from './agents/sales/sales-agent';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),

    provideCopilotKit({
      defaultToolRendering: true,
      enableInspector: false,
    }),
    provideAppInitializer(initSalesAgent),
    provideAppInitializer(initDashboardAgent),
  ],
};
