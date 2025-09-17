import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageBubbleComponent } from '../components/message-bubble/message-bubble.component';
import { Message } from '../../../core/models/chat.models';

@Component({
  selector: 'app-message-area',
  imports: [CommonModule, MessageBubbleComponent],
  template: `
    <div class="message-area" #messageArea>
      <div class="loading-spinner" *ngIf="loading">
        <div class="spinner"></div>
        <span>Loading messages...</span>
      </div>
      
      <div class="messages-container" *ngIf="!loading">
        <div class="load-more-messages" *ngIf="messages.length > 0">
          <button class="load-more-btn" (click)="loadMore.emit()">
            Load Earlier Messages
          </button>
        </div>
        
        <div class="messages-list" #messagesList>
          <app-message-bubble
            *ngFor="let message of messages; trackBy: trackByMessageId"
            [message]="message"
            [isOwn]="message.senderId === 'current-user-id'"
            (edit)="editMessage.emit($event)"
            (delete)="deleteMessage.emit($event.messageId)"
            (visible)="onMessageVisible($event)">
          </app-message-bubble>
        </div>
        
        <div class="empty-messages" *ngIf="messages.length === 0">
          <div class="empty-icon">💬</div>
          <h4>No messages yet</h4>
          <p>Start the conversation by sending a message below</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .message-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: #fafafa;
    }

    .loading-spinner {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex: 1;
      color: #666;
    }

    .spinner {
      width: 24px;
      height: 24px;
      border: 2px solid #e0e0e0;
      border-top: 2px solid #007bff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 12px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .messages-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .load-more-messages {
      padding: 16px;
      text-align: center;
      border-bottom: 1px solid #e8e8e8;
      background: #fff;
    }

    .load-more-btn {
      background: none;
      border: 1px solid #ddd;
      color: #666;
      padding: 8px 16px;
      border-radius: 16px;
      cursor: pointer;
      font-size: 13px;
      transition: all 0.2s;
    }

    .load-more-btn:hover {
      background: #f8f9fa;
      border-color: #007bff;
      color: #007bff;
    }

    .messages-list {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      scroll-behavior: smooth;
    }

    .messages-list::-webkit-scrollbar {
      width: 6px;
    }

    .messages-list::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 3px;
    }

    .messages-list::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 3px;
    }

    .messages-list::-webkit-scrollbar-thumb:hover {
      background: #a8a8a8;
    }

    .empty-messages {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      color: #666;
      padding: 40px;
    }

    .empty-icon {
      font-size: 64px;
      margin-bottom: 20px;
      opacity: 0.5;
    }

    .empty-messages h4 {
      margin: 0 0 8px 0;
      color: #333;
      font-weight: 600;
    }

    .empty-messages p {
      margin: 0;
      font-size: 14px;
      color: #999;
    }
  `]
})
export class MessageAreaComponent implements AfterViewChecked {
  @Input() conversationId!: string;
  @Input() messages: Message[] = [];
  @Input() loading = false;

  @Output() loadMore = new EventEmitter<void>();
  @Output() editMessage = new EventEmitter<{ messageId: string, content: string }>();
  @Output() deleteMessage = new EventEmitter<string>();
  @Output() messageVisible = new EventEmitter<Message>();

  @ViewChild('messagesList', { static: false }) messagesListRef!: ElementRef;

  private shouldScrollToBottom = true;
  private lastMessageCount = 0;

  ngAfterViewChecked(): void {
    // Auto-scroll to bottom when new messages arrive
    if (this.shouldScrollToBottom && this.messages.length > this.lastMessageCount) {
      this.scrollToBottom();
    }
    this.lastMessageCount = this.messages.length;
  }

  trackByMessageId(index: number, message: Message): string {
    return message.id;
  }

  onMessageVisible(message: Message): void {
    this.messageVisible.emit(message);
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesListRef?.nativeElement) {
        const element = this.messagesListRef.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }
}
