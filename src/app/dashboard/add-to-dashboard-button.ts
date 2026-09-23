import { Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { injectAgentStore } from '@copilotkit/angular';

import { DASHBOARD_AGENT_ID } from '../assistant/agent-ids';
import { WidgetOptions } from '../assistant/tools/widget-options';
import { DashboardArgs, DashboardKind, withItem } from './dashboard-state';

@Component({
  selector: 'app-add-to-dashboard',
  template: `
    @if (visible()) {
      <button type="button" (click)="add()">+ Add to dashboard</button>
    }
  `,
  styles: `
    :host {
      display: block;
      text-align: right;
    }

    button {
      margin-top: 0.5rem;
      padding: 0.3rem 0.75rem;
      border: 1px dashed var(--app-border);
      border-radius: 0.5rem;
      background: transparent;
      color: var(--text-secondary);
      font-size: 0.85rem;
      cursor: pointer;
    }

    button:hover {
      color: var(--text-primary);
      border-color: var(--text-secondary);
    }
  `,
})
export class AddToDashboardButton {
  readonly kind = input.required<DashboardKind>();
  readonly args = input.required<DashboardArgs>();

  private readonly options = inject(WidgetOptions);
  private readonly store = injectAgentStore(DASHBOARD_AGENT_ID);
  private readonly router = inject(Router);

  protected readonly visible = this.options.showAddToDashboard;

  protected add(): void {
    const agent = this.store().agent;
    agent.setState(withItem(agent.state, this.kind(), this.args()));
    void this.router.navigate(['/dashboard']);
  }
}
