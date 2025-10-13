import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-chat',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="chat-container">
      <h1>Chat</h1>
      <p>Chat functionality will be implemented here...</p>
    </div>
  `,
    styles: [`
    .chat-container {
      padding: 20px;
    }
  `]
})
export class ChatComponent {
    constructor() { }
}