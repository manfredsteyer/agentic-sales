import { type Interrupt } from '@ag-ui/core';
import { Component, computed, input, signal } from '@angular/core';
import { CopilotChat, injectInterrupt } from '@copilotkit/angular';

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
  selector: 'app-assistant-chat',
  imports: [CopilotChat],
  templateUrl: './assistant-chat.html',
  styleUrl: './assistant-chat.css',
})
export class AssistantChat {
  readonly agentId = input.required<string>();

  private readonly controller = injectInterrupt(this.agentId);
  private readonly answered = signal(new Set<string>());

  readonly interrupts = computed(() =>
    unanswered(this.controller.interrupts(), this.answered()),
  );

  protected resolve(interruptId: string, payload: unknown): void {
    this.answered.update((ids) => new Set(ids).add(interruptId));
    void this.controller.resolve(payload, interruptId);
  }
}

function unanswered(
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
