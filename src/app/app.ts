import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AssistantChat } from './assistant/assistant-chat';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AssistantChat],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
