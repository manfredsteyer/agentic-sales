import { Component, computed, inject, input } from '@angular/core';
import { DashboardItem } from '@shared/dashboard-schema';
import { DashboardStore } from '../../../feature-dashboard/dashboard-store/dashboard-store';

@Component({
  selector: 'app-add-to-dashboard-button',
  template: `
    @if (isOnDashboard()) {
      <button type="button" class="btn btn-sm add-to-dashboard" disabled>
        On the dashboard
      </button>
    } @else {
      <button
        type="button"
        class="btn btn-sm add-to-dashboard"
        [disabled]="dashboardStore.isRunning()"
        (click)="addToDashboard()"
      >
        <img src="icons/plus.svg" width="14" height="14" alt="" />
        Add to dashboard
      </button>
    }
  `,
})
export class AddToDashboardButton {
  readonly item = input.required<DashboardItem>();

  protected readonly dashboardStore = inject(DashboardStore);

  protected readonly isOnDashboard = computed(() =>
    hasItem(this.dashboardStore.items(), this.item().surfaceId),
  );

  protected addToDashboard(): void {
    this.dashboardStore.addItem(this.item());
  }
}

function hasItem(items: DashboardItem[], surfaceId: string): boolean {
  return items.some((item) => item.surfaceId === surfaceId);
}
