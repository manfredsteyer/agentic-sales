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
      <button type="button" class="btn btn-sm" (click)="add()">
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
          <path d="M8 3v10M3 8h10" />
        </svg>
        Add to dashboard
      </button>
    }
  `,
  styles: `
    :host {
      display: flex;
      justify-content: flex-end;
      margin-top: 0.75rem;
    }

    svg {
      fill: none;
      stroke: currentColor;
      stroke-width: 1.75;
      stroke-linecap: round;
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
