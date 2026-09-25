import { Component, computed, model } from '@angular/core';

@Component({
  selector: 'app-view-toggle',
  template: `
    <button
      type="button"
      [attr.aria-label]="label()"
      [title]="label()"
      (click)="toggle()"
    >
      <img [src]="icon()" width="16" height="16" alt="" />
    </button>
  `,
})
export class ViewToggle {
  readonly table = model.required<boolean>();

  protected readonly label = computed(() =>
    this.table() ? 'Show chart' : 'Show table',
  );
  protected readonly icon = computed(() =>
    this.table() ? 'icons/chart.svg' : 'icons/table.svg',
  );

  protected toggle(): void {
    this.table.update((table) => !table);
  }
}
