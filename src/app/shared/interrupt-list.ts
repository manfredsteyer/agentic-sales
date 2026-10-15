import { type Interrupt } from '@ag-ui/core';
import { Component, computed, input, signal } from '@angular/core';
import {
  CopilotChatMessageViewCursor,
  type InterruptController,
} from '@copilotkit/angular';

interface ApprovalOption {
  label: string;
  payload: unknown;
}

interface ApprovalInterrupt extends Interrupt {
  metadata: {
    mastra: { suspendPayload: { message: string; options: ApprovalOption[] } };
  };
}

interface ApprovalRequest {
  id: string;
  message: string;
  options: ApprovalOption[];
}

@Component({
  selector: 'app-interrupt-list',
  imports: [CopilotChatMessageViewCursor],
  template: `
    @for (interrupt of interrupts(); track interrupt.id) {
      <div
        class="interrupt"
        role="group"
        aria-label="Question from the assistant"
      >
        <span class="interrupt-icon">
          <img src="icons/question.svg" width="14" height="14" alt="" />
        </span>
        <div class="interrupt-body">
          <p class="interrupt-message">{{ interrupt.message }}</p>
          <div class="interrupt-actions">
            @for (option of interrupt.options; track $index) {
              <button
                type="button"
                class="btn btn-sm"
                [class.btn-primary]="$first"
                (click)="resolve(interrupt.id, option.payload)"
              >
                {{ option.label }}
              </button>
            }
          </div>
        </div>
      </div>
    }
    @if (resuming()) {
      <copilot-chat-message-view-cursor />
    }
  `,
})
export class InterruptList {
  readonly controller = input.required<InterruptController>();

  private readonly answered = signal(new Set<string>());
  protected readonly resuming = signal(false);

  // TODO #6: Calculate open interrupts
  protected readonly interrupts = computed(() => [] as any[]);

  protected resolve(interruptId: string, payload: unknown): void {
    this.answered.update((ids) => new Set(ids).add(interruptId));
    // TODO #6: Resolve interrupt
  }

  // TODO #6: Register template with InterruptList in sales-chat.html
}

function findOpen(
  interrupts: readonly Interrupt[],
  answered: ReadonlySet<string>,
): ApprovalRequest[] {
  const approvals = interrupts as ApprovalInterrupt[];
  return approvals
    .filter((interrupt) => !answered.has(interrupt.id))
    .map((interrupt) => ({
      id: interrupt.id,
      ...interrupt.metadata.mastra.suspendPayload,
    }));
}
