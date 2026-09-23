import { Component } from '@angular/core';
import { AssistantChat } from './assistant/assistant-chat';
import { Dashboard } from './dashboard/dashboard';

@Component({
  selector: 'app-root',
  imports: [Dashboard, AssistantChat],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
