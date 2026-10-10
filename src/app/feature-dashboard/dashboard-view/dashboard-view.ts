import { Component, inject, signal, viewChild } from '@angular/core';
import { CopilotChat } from '@copilotkit/angular';
import { DASHBOARD_AGENT_ID } from '../../agents/dashboard/dashboard-agent';
import { A2uiSurface } from '../../shared/a2ui-surface';
import { InterruptList } from '../../shared/interrupt-list';
import { ExamplePrompt } from '../../shared/utils/example-prompt';
import { DashboardStore } from '../dashboard-store/dashboard-store';
import { DashboardTile } from '../dashboard-tile';
import { examplePrompts } from './example-prompts';

@Component({
  selector: 'app-dashboard-view',
  imports: [CopilotChat, DashboardTile, A2uiSurface, InterruptList],
  templateUrl: './dashboard-view.html',
  styleUrl: './dashboard-view.css',
})
export class DashboardView {
  protected readonly agentId = DASHBOARD_AGENT_ID;
  protected readonly examples = examplePrompts;
  protected readonly store = inject(DashboardStore);

  protected readonly chatVisible = signal(true);

  private readonly chat = viewChild.required(CopilotChat);

  protected sendExample(example: ExamplePrompt): void {
    void this.chat().submitInput(example.prompt);
  }

  protected toggleChat(): void {
    this.chatVisible.update((visible) => !visible);
  }
}
