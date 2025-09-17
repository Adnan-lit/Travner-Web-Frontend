import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-typing-indicator',
  imports: [CommonModule],
  template: `
    <div class="typing-indicator" *ngIf="typingUsers.length > 0">
      <div class="typing-content">
        <div class="typing-avatar">
          <div class="avatar-circle">
            {{ getTypingInitial() }}
          </div>
        </div>
        
        <div class="typing-message">
          <div class="typing-text">{{ getTypingText() }}</div>
          <div class="typing-dots">
            <span class="dot dot1"></span>
            <span class="dot dot2"></span>
            <span class="dot dot3"></span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .typing-indicator {
      padding: 8px 20px 16px;
      background: #fafafa;
      border-top: 1px solid #f0f0f0;
      animation: slideUp 0.3s ease-out;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .typing-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .typing-avatar {
      flex-shrink: 0;
    }

    .avatar-circle {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 10px;
    }

    .typing-message {
      background: #fff;
      border-radius: 18px;
      padding: 12px 16px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .typing-text {
      font-size: 12px;
      color: #666;
      font-style: italic;
    }

    .typing-dots {
      display: flex;
      gap: 4px;
      align-items: center;
    }

    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #999;
      animation: typingPulse 1.4s infinite ease-in-out;
    }

    .dot1 {
      animation-delay: 0s;
    }

    .dot2 {
      animation-delay: 0.2s;
    }

    .dot3 {
      animation-delay: 0.4s;
    }

    @keyframes typingPulse {
      0%, 60%, 100% {
        transform: scale(0.8);
        opacity: 0.5;
      }
      30% {
        transform: scale(1);
        opacity: 1;
      }
    }
  `]
})
export class TypingIndicatorComponent {
  @Input() typingUsers: string[] = [];

  getTypingText(): string {
    if (this.typingUsers.length === 0) {
      return '';
    } else if (this.typingUsers.length === 1) {
      return `${this.typingUsers[0]} is typing`;
    } else if (this.typingUsers.length === 2) {
      return `${this.typingUsers[0]} and ${this.typingUsers[1]} are typing`;
    } else {
      return `${this.typingUsers[0]} and ${this.typingUsers.length - 1} others are typing`;
    }
  }

  getTypingInitial(): string {
    if (this.typingUsers.length > 0) {
      return this.typingUsers[0].charAt(0).toUpperCase();
    }
    return '';
  }
}
