/**
 * Message Status Component
 * Shows delivery and read status for chat messages
 */
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

@Component({
    selector: 'app-message-status',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="message-status" [attr.aria-label]="getStatusLabel()">
      <!-- Sending -->
      <div *ngIf="status === 'sending'" class="status-sending">
        <div class="spinner"></div>
      </div>
      
      <!-- Sent (single check) -->
      <svg *ngIf="status === 'sent'" class="status-icon sent" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      
      <!-- Delivered (double check) -->
      <div *ngIf="status === 'delivered'" class="status-delivered">
        <svg class="status-icon delivered" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"></polyline>
          <polyline points="16 6 5 17 0 12" transform="translate(4, 0)"></polyline>
        </svg>
      </div>
      
      <!-- Read (double check, colored) -->
      <div *ngIf="status === 'read'" class="status-read">
        <svg class="status-icon read" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"></polyline>
          <polyline points="16 6 5 17 0 12" transform="translate(4, 0)"></polyline>
        </svg>
      </div>
      
      <!-- Failed -->
      <svg *ngIf="status === 'failed'" class="status-icon failed" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>
      
      <!-- Timestamp (optional) -->
      <span *ngIf="showTime && timestamp" class="message-time">
        {{ formatTime(timestamp) }}
      </span>
    </div>
  `,
    styles: [`
    .message-status {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 4px;
      font-size: 10px;
      opacity: 0.7;
    }
    
    .status-icon {
      width: 12px;
      height: 12px;
      flex-shrink: 0;
    }
    
    .status-icon.sent {
      color: #64748b;
    }
    
    .status-icon.delivered {
      color: #64748b;
    }
    
    .status-icon.read {
      color: #10b981;
    }
    
    .status-icon.failed {
      color: #ef4444;
    }
    
    .status-sending {
      display: flex;
      align-items: center;
    }
    
    .spinner {
      width: 8px;
      height: 8px;
      border: 1px solid #e2e8f0;
      border-top: 1px solid #64748b;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    .status-delivered,
    .status-read {
      position: relative;
    }
    
    .status-delivered svg,
    .status-read svg {
      position: relative;
    }
    
    .message-time {
      color: #64748b;
      font-size: 10px;
      margin-left: 4px;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    /* Dark mode */
    @media (prefers-color-scheme: dark) {
      .status-icon.sent,
      .status-icon.delivered {
        color: #94a3b8;
      }
      
      .message-time {
        color: #94a3b8;
      }
      
      .spinner {
        border-color: #475569;
        border-top-color: #94a3b8;
      }
    }
  `]
})
export class MessageStatusComponent {
    @Input() status: MessageStatus = 'sent';
    @Input() timestamp?: string;
    @Input() showTime = true;

    getStatusLabel(): string {
        switch (this.status) {
            case 'sending': return 'Sending message';
            case 'sent': return 'Message sent';
            case 'delivered': return 'Message delivered';
            case 'read': return 'Message read';
            case 'failed': return 'Message failed to send';
            default: return 'Message status';
        }
    }

    formatTime(timestamp: string): string {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffInHours < 24 * 7) {
            return date.toLocaleDateString([], { weekday: 'short' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    }
}