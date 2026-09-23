import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  template: `
    <header>
      <h1>Agentic Sales</h1>
    </header>
  `,
  styles: `
    :host {
      display: block;
    }

    header {
      box-sizing: border-box;
      width: 100%;
      max-width: 50rem;
      margin-inline: auto;
      padding: 2rem 1rem 1.5rem;
    }

    h1 {
      margin: 0;
      font-size: 1.5rem;
      letter-spacing: -0.02em;
    }
  `,
})
export class Home {}
