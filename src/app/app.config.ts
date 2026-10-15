import {
  ApplicationConfig,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { initDashboardAgent } from './agents/dashboard/dashboard-agent';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),

    // TODO #4: provideCopilotKit

    // TODO: #4: provide initSalesAgent

    provideAppInitializer(initDashboardAgent),
  ],
};
