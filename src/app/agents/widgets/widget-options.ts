import { Service, signal } from '@angular/core';

@Service()
export class WidgetOptions {
  readonly showAddToDashboard = signal(false);
}
