import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SendMessageRequest } from '../../../core/models/chat.models';

@Component({
  selector: 'app-message-input',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="message-input-container">
      <div class="input-actions">
        <button class="action-btn" (click)="attachFile()" title="Attach file">
          📎
        </button>
        <button class="action-btn" (click)="attachImage()" title="Attach image">
          🖼️
        </button>
      </div>
      
      <div class="input-area">
        <textarea 
          #messageInput
          [(ngModel)]="messageText"
          (keydown)="onKeyDown($event)"
          (input)="onTyping()"
          (focus)="onFocus()"
          (blur)="onBlur()"
          placeholder="Type a message..."
          class="message-textarea"
          [class.has-text]="messageText.trim().length > 0"
          rows="1">
        </textarea>
        
        <button 
          class="send-button"
          [disabled]="!canSend()"
          (click)="sendMessage()"
          [class.active]="canSend()">
          <span class="send-icon">➤</span>
        </button>
      </div>
      
      <!-- File input (hidden) -->
      <input 
        #fileInput
        type="file"
        (change)="onFileSelected($event)"
        style="display: none;"
        multiple
        accept="*/*">
      
      <!-- Image input (hidden) -->
      <input 
        #imageInput
        type="file"
        (change)="onImageSelected($event)"
        style="display: none;"
        multiple
        accept="image/*">
    </div>
  `,
  styles: [`
    .message-input-container {
      background: #fff;
      border-top: 1px solid #e0e0e0;
      padding: 16px 20px;
      display: flex;
      align-items: flex-end;
      gap: 12px;
    }

    .input-actions {
      display: flex;
      gap: 8px;
      margin-bottom: 8px;
    }

    .action-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 18px;
      padding: 8px;
      border-radius: 50%;
      transition: background-color 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
    }

    .action-btn:hover {
      background: #f0f0f0;
    }

    .input-area {
      flex: 1;
      display: flex;
      align-items: flex-end;
      background: #f8f9fa;
      border-radius: 24px;
      padding: 8px 12px;
      border: 1px solid #e0e0e0;
      transition: border-color 0.2s;
    }

    .input-area:focus-within {
      border-color: #007bff;
    }

    .message-textarea {
      flex: 1;
      border: none;
      background: none;
      resize: none;
      outline: none;
      font-family: inherit;
      font-size: 14px;
      line-height: 1.4;
      max-height: 120px;
      min-height: 20px;
      padding: 8px 12px;
      border-radius: 16px;
      transition: all 0.2s;
    }

    .message-textarea::placeholder {
      color: #999;
    }

    .message-textarea.has-text {
      background: #fff;
    }

    .send-button {
      background: #ccc;
      border: none;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      margin-left: 8px;
    }

    .send-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .send-button.active {
      background: #007bff;
      color: white;
    }

    .send-button.active:hover {
      background: #0056b3;
      transform: scale(1.05);
    }

    .send-icon {
      font-size: 16px;
      font-weight: bold;
    }

    /* Auto-expanding textarea */
    .message-textarea {
      field-sizing: content;
    }

    /* Mobile responsive */
    @media (max-width: 768px) {
      .message-input-container {
        padding: 12px 16px;
        gap: 8px;
      }

      .input-actions {
        gap: 4px;
      }

      .action-btn {
        width: 32px;
        height: 32px;
        font-size: 16px;
      }

      .send-button {
        width: 32px;
        height: 32px;
      }

      .send-icon {
        font-size: 14px;
      }
    }
  `]
})
export class MessageInputComponent {
  @Input() conversationId!: string;

  @Output() send = new EventEmitter<SendMessageRequest>();
  @Output() typing = new EventEmitter<boolean>();

  @ViewChild('messageInput', { static: false }) messageInputRef!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('fileInput', { static: false }) fileInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('imageInput', { static: false }) imageInputRef!: ElementRef<HTMLInputElement>;

  messageText = '';
  private typingTimer: any;
  private isTyping = false;

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  onTyping(): void {
    // Auto-resize textarea
    this.autoResize();

    // Handle typing indicator
    if (!this.isTyping) {
      this.isTyping = true;
      this.typing.emit(true);
    }

    // Clear existing timer
    clearTimeout(this.typingTimer);

    // Set new timer to stop typing indicator
    this.typingTimer = setTimeout(() => {
      this.isTyping = false;
      this.typing.emit(false);
    }, 2000);
  }

  onFocus(): void {
    // Could implement focus-related logic here
  }

  onBlur(): void {
    // Stop typing indicator when input loses focus
    if (this.isTyping) {
      this.isTyping = false;
      this.typing.emit(false);
    }
    clearTimeout(this.typingTimer);
  }

  canSend(): boolean {
    return this.messageText.trim().length > 0;
  }

  sendMessage(): void {
    const content = this.messageText.trim();
    if (!content) return;

    const request: SendMessageRequest = {
      conversationId: this.conversationId,
      kind: 'TEXT',
      content: content
    };

    this.send.emit(request);
    this.messageText = '';

    // Stop typing indicator
    if (this.isTyping) {
      this.isTyping = false;
      this.typing.emit(false);
    }
    clearTimeout(this.typingTimer);

    // Reset textarea height
    this.resetTextareaHeight();
  }

  attachFile(): void {
    this.fileInputRef.nativeElement.click();
  }

  attachImage(): void {
    this.imageInputRef.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      // Handle file upload
      Array.from(input.files).forEach(file => {
        this.uploadFile(file, 'FILE');
      });
    }
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      // Handle image upload
      Array.from(input.files).forEach(file => {
        this.uploadFile(file, 'IMAGE');
      });
    }
  }

  private uploadFile(file: File, kind: 'FILE' | 'IMAGE'): void {
    // For now, just send a mock message
    // In real implementation, you'd upload to a file service first
    const request: SendMessageRequest = {
      conversationId: this.conversationId,
      kind: kind,
      content: kind === 'IMAGE' ? 'Image' : file.name,
      attachments: [{
        mediaId: 'mock-id',
        url: URL.createObjectURL(file), // Mock URL for preview
        filename: file.name,
        size: file.size,
        type: kind === 'IMAGE' ? 'IMAGE' : 'DOCUMENT'
      }]
    };

    this.send.emit(request);
  }

  private autoResize(): void {
    const textarea = this.messageInputRef?.nativeElement;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }

  private resetTextareaHeight(): void {
    const textarea = this.messageInputRef?.nativeElement;
    if (textarea) {
      textarea.style.height = 'auto';
    }
  }
}
