import { type Interrupt } from '@ag-ui/core';
import { Component, computed, input, signal } from '@angular/core';
import { CopilotChat, injectInterrupt } from '@copilotkit/angular';

import { injectPrefersDark } from '../prefers-dark';
import { type InterruptModel, toInterruptModel } from './interrupt-model';

/** CopilotKit's prebuilt chat, talking to an agent via AG-UI. */
@Component({
  selector: 'app-assistant-chat',
  imports: [CopilotChat],
  templateUrl: './assistant-chat.html',
  styleUrl: './assistant-chat.css',
  // CopilotKit switches its dark theme by a .dark class on an ancestor
  host: { '[class.dark]': 'dark()' },
})
export class AssistantChat {
  readonly agentId = input.required<string>();

  protected readonly dark = injectPrefersDark();

  private readonly controller = injectInterrupt(this.agentId);
  private readonly answered = signal<ReadonlySet<string>>(new Set());

  /**
   * Open questions of the agent, e.g. approving a large query. Answered ones
   * disappear right away; the agent store keeps reporting isRunning while an
   * interrupt is pending, so it can't be used to hide them.
   */
  readonly interrupts = computed(() => unanswered(this.controller.interrupts(), this.answered()));

  /** Resumes the interrupted run with the chosen answer. */
  protected resolve(interruptId: string, payload: unknown): void {
    this.answered.update((ids) => new Set(ids).add(interruptId));
    void this.controller.resolve(payload, interruptId);
  }
}

function unanswered(
  interrupts: readonly Interrupt[],
  answered: ReadonlySet<string>,
): InterruptModel[] {
  const open = interrupts.filter((interrupt) => !answered.has(interrupt.id));
  return open.map(toInterruptModel);
}
