import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Message } from '../../../../core/models/chat.models';

@Component({
  selector: 'app-message-bubble',
  imports: [CommonModule],
  template: `
    <div class="message-bubble" [class.own-message]="isOwn" [class.system-message]="message.kind === 'SYSTEM'">
      <div class="message-avatar" *ngIf="!isOwn && message.kind !== 'SYSTEM'">
        <div class="avatar-circle">
          {{ getSenderInitial() }}
        </div>
      </div>
      
      <div class="message-content">
        <div class="message-header" *ngIf="!isOwn && message.kind !== 'SYSTEM'">
          <span class="sender-name">{{ message.senderName }}</span>
          <span class="message-time">{{ formatTime(message.sentAt) }}</span>
        </div>
        
        <div class="message-body" [class.own-body]="isOwn" [class.system-body]="message.kind === 'SYSTEM'">
          <!-- Text Message -->
          <div class="text-content" *ngIf="message.kind === 'TEXT' || message.kind === 'SYSTEM'">
            {{ message.content }}
            <span class="edited-indicator" *ngIf="message.isEdited">(edited)</span>
          </div>
          
          <!-- Image Message -->
          <div class="image-content" *ngIf="message.kind === 'IMAGE'">
            <img [src]="getAttachmentUrl()" [alt]="message.content" (load)="visible.emit(message)">
            <p *ngIf="message.content" class="image-caption">{{ message.content }}</p>
          </div>
          
          <!-- File Message -->
          <div class="file-content" *ngIf="message.kind === 'FILE'">
            <div class="file-icon">📎</div>
            <div class="file-info">
              <span class="file-name">{{ getFileName() }}</span>
              <span class="file-size">{{ getFileSize() }}</span>
            </div>
            <button class="download-btn" (click)="downloadFile()">⬇️</button>
          </div>
          
          <div class="message-footer" *ngIf="isOwn && message.kind !== 'SYSTEM'">
            <span class="message-time">{{ formatTime(message.sentAt) }}</span>
            <div class="message-actions">
              <button class="action-btn" (click)="editMessage()" title="Edit message">✏️</button>
              <button class="action-btn" (click)="deleteMessage()" title="Delete message">🗑️</button>
            </div>
          </div>
        </div>
        
        <!-- Read receipts for own messages -->
        <div class="read-receipts" *ngIf="isOwn && message.readCount > 0">
          <span class="read-count">Read by {{ message.readCount }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .message-bubble {
      display: flex;
      margin-bottom: 16px;
      animation: fadeIn 0.3s ease-in;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .message-bubble.own-message {
      flex-direction: row-reverse;
    }

    .message-bubble.system-message {
      justify-content: center;
    }

    .message-avatar {
      margin-right: 12px;
      flex-shrink: 0;
    }

    .own-message .message-avatar {
      margin-right: 0;
      margin-left: 12px;
    }

    .avatar-circle {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 12px;
    }

    .message-content {
      max-width: 70%;
      min-width: 120px;
    }

    .system-message .message-content {
      max-width: 300px;
    }

    .message-header {
      display: flex;
      align-items: baseline;
      margin-bottom: 4px;
      gap: 8px;
    }

    .sender-name {
      font-weight: 600;
      font-size: 13px;
      color: #333;
    }

    .message-time {
      font-size: 11px;
      color: #999;
    }

    .message-body {
      background: #fff;
      border-radius: 18px;
      padding: 12px 16px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
      position: relative;
      word-wrap: break-word;
    }

    .message-body.own-body {
      background: #007bff;
      color: white;
    }

    .message-body.system-body {
      background: #f8f9fa;
      color: #666;
      text-align: center;
      font-style: italic;
      border-radius: 12px;
      padding: 8px 12px;
    }

    .text-content {
      line-height: 1.4;
      font-size: 14px;
    }

    .edited-indicator {
      font-size: 11px;
      opacity: 0.7;
      margin-left: 4px;
    }

    .image-content img {
      max-width: 100%;
      border-radius: 12px;
      cursor: pointer;
    }

    .image-caption {
      margin: 8px 0 0 0;
      font-size: 13px;
      color: inherit;
    }

    .file-content {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 4px;
    }

    .file-icon {
      font-size: 24px;
    }

    .file-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .file-name {
      font-weight: 500;
      font-size: 14px;
    }

    .file-size {
      font-size: 12px;
      opacity: 0.7;
    }

    .download-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 18px;
      padding: 4px;
      border-radius: 4px;
      transition: background-color 0.2s;
    }

    .download-btn:hover {
      background: rgba(0,0,0,0.1);
    }

    .message-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 4px;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .message-bubble:hover .message-footer {
      opacity: 1;
    }

    .message-actions {
      display: flex;
      gap: 4px;
    }

    .action-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 12px;
      padding: 4px;
      border-radius: 4px;
      opacity: 0.7;
      transition: all 0.2s;
    }

    .action-btn:hover {
      opacity: 1;
      background: rgba(255,255,255,0.1);
    }

    .read-receipts {
      text-align: right;
      margin-top: 4px;
    }

    .read-count {
      font-size: 11px;
      color: #999;
    }

    /* Mobile responsive */
    @media (max-width: 768px) {
      .message-content {
        max-width: 85%;
      }
    }
  `]
})
export class MessageBubbleComponent {
  @Input() message!: Message;
  @Input() isOwn = false;

  @Output() edit = new EventEmitter<{ messageId: string, content: string }>();
  @Output() delete = new EventEmitter<{ messageId: string }>();
  @Output() visible = new EventEmitter<Message>();

  getSenderInitial(): string {
    return this.message.senderName.charAt(0).toUpperCase();
  }

  formatTime(date: Date): string {
    const messageDate = new Date(date);
    return messageDate.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  getAttachmentUrl(): string {
    if (this.message.attachments && this.message.attachments.length > 0) {
      return this.message.attachments[0].url;
    }
    return '';
  }

  getFileName(): string {
    if (this.message.attachments && this.message.attachments.length > 0) {
      return this.message.attachments[0].filename;
    }
    return 'Unknown file';
  }

  getFileSize(): string {
    if (this.message.attachments && this.message.attachments.length > 0) {
      const bytes = this.message.attachments[0].size;
      if (bytes === 0) return '0 Bytes';

      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));

      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
    return '0 Bytes';
  }

  editMessage(): void {
    if (this.message.kind === 'TEXT') {
      const newContent = prompt('Edit message:', this.message.content);
      if (newContent && newContent !== this.message.content) {
        this.edit.emit({ messageId: this.message.id, content: newContent });
      }
    }
  }

  deleteMessage(): void {
    if (confirm('Are you sure you want to delete this message?')) {
      this.delete.emit({ messageId: this.message.id });
    }
  }

  downloadFile(): void {
    if (this.message.attachments && this.message.attachments.length > 0) {
      const attachment = this.message.attachments[0];
      const link = document.createElement('a');
      link.href = attachment.url;
      link.download = attachment.filename;
      link.click();
    }
  }

  ngOnInit(): void {
    // Emit visible event when message is loaded
    setTimeout(() => {
      this.visible.emit(this.message);
    }, 100);
  }
}
