import {
  ApplicationConfig,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideCopilotKit } from '@copilotkit/angular';

import { routes } from './app.routes';
import { initDashboardAgent } from './assistant/dashboard-agent';
import { initSalesAgent } from './assistant/sales-agent';

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
