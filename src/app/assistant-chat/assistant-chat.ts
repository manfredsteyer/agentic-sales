import { type Interrupt } from '@ag-ui/core';
import { Component, computed, input, signal, viewChild } from '@angular/core';
import {
  CopilotChat,
  injectAgentStore,
  injectInterrupt,
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

interface ExamplePrompt {
  label: string;
  prompt: string;
}

@Component({
  selector: 'app-assistant-chat',
  imports: [CopilotChat],
  templateUrl: './assistant-chat.html',
  styleUrl: './assistant-chat.css',
})
export class AssistantChat {
  readonly agentId = input.required<string>();

  private readonly chat = viewChild.required(CopilotChat);
  private readonly agentStore = injectAgentStore(this.agentId);
  private readonly controller = injectInterrupt(this.agentId);
  private readonly answered = signal(new Set<string>());

  readonly interrupts = computed(() =>
    unanswered(this.controller.interrupts(), this.answered()),
  );

  protected readonly isRunning = computed(() => this.agentStore().isRunning());

  protected readonly examples: ExamplePrompt[] = [
    { label: 'Example 1', prompt: 'Show me the revenue per category.' },
    {
      label: 'Example 2',
      prompt:
        'Compare Europe and the Americas regarding the revenue per category as a bar chart.',
    },
    {
      label: 'Example 3',
      prompt:
        'For each continent, show me a pie chart with the revenue of the products in the Bags category.',
    },
  ];

  protected sendExample(example: ExamplePrompt): void {
    void this.chat().submitInput(example.prompt);
  }

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
