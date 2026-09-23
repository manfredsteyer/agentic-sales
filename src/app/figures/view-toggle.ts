import { Component, computed, model } from '@angular/core';

@Component({
  selector: 'app-view-toggle',
  template: `
    <button type="button" [attr.aria-label]="label()" [title]="label()" (click)="toggle()">
      @if (table()) {
        <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
          <path d="M3 13V7M8 13V3M13 13V9" />
        </svg>
      } @else {
        <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
          <rect x="2" y="3" width="12" height="10" rx="1" />
          <path d="M2 7h12M6 3v10" />
        </svg>
      }
    </button>
  `,
  styles: `
    button {
      display: inline-flex;
      padding: 0.3rem;
      border: 1px solid transparent;
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--text-secondary);
      cursor: pointer;
      transition:
        background-color 0.15s,
        color 0.15s;
    }

    button:hover {
      background: var(--surface-2);
      color: var(--text-primary);
    }

    button:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring);
    }

    svg {
      fill: none;
      stroke: currentColor;
      stroke-width: 1.5;
      stroke-linecap: round;
    }
  `,
})
export class ViewToggle {
  readonly table = model.required<boolean>();

  protected readonly label = computed(() => (this.table() ? 'Show chart' : 'Show table'));

  protected toggle(): void {
    this.table.update((table) => !table);
  }
}
