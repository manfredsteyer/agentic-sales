import { Component, viewChild } from '@angular/core';
import { CopilotChat, injectInterrupt } from '@copilotkit/angular';
import { SALES_AGENT_ID } from '../agents/sales/sales-agent';
import { InterruptList } from '../shared/interrupt-list';
import { ExamplePrompt } from '../shared/utils/example-prompt';
import { examplePrompts } from './example-prompts';

@Component({
  selector: 'app-sales-chat',
  imports: [CopilotChat, InterruptList],
  templateUrl: './sales-chat.html',
  styleUrl: './sales-chat.css',
})
export class SalesChat {
  protected readonly agentId = SALES_AGENT_ID;
  protected readonly interruptController = injectInterrupt(this.agentId);
  protected readonly examples = examplePrompts;

  private readonly chat = viewChild.required(CopilotChat);

  protected sendExample(example: ExamplePrompt): void {
    void this.chat().submitInput(example.prompt);
  }
}
