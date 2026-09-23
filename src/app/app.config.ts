import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideCopilotKit } from '@copilotkit/angular';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // Server-side tool calls (queries, sandbox) appear as collapsible cards
    provideCopilotKit({
      defaultToolRendering: true,
      // the floating dev inspector covers the docked chat
      enableInspector: false,
    }),
  ],
};
