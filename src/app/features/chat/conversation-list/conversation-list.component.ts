import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Conversation } from '../../../core/models/chat.models';

@Component({
  selector: 'app-conversation-list',
  imports: [CommonModule],
  template: `
    <div class="conversation-list">
      <div class="loading-spinner" *ngIf="loading">
        <div class="spinner"></div>
        <span>Loading conversations...</span>
      </div>
      
      <div class="conversations" *ngIf="!loading">
        <div class="conversation-item" 
             *ngFor="let conversation of conversations"
             [class.selected]="conversation.id === selectedId"
             (click)="select.emit(conversation)">
          
          <div class="conversation-avatar">
            <div class="avatar-circle" [class.group-avatar]="conversation.type === 'GROUP'">
              {{ getAvatarText(conversation) }}
            </div>
            <div class="online-indicator" 
                 *ngIf="conversation.type === 'DIRECT' && isUserOnline(conversation)">
            </div>
          </div>
          
          <div class="conversation-content">
            <div class="conversation-header">
              <h4 class="conversation-title">{{ getConversationTitle(conversation) }}</h4>
              <span class="conversation-time">{{ formatTime(conversation.lastMessageAt) }}</span>
            </div>
            
            <div class="conversation-preview">
              <p class="last-message" [class.unread]="conversation.unreadCount > 0">
                {{ getLastMessagePreview(conversation) }}
              </p>
              <div class="unread-badge" *ngIf="conversation.unreadCount > 0">
                {{ conversation.unreadCount > 99 ? '99+' : conversation.unreadCount }}
              </div>
            </div>
          </div>
        </div>
        
        <div class="empty-state" *ngIf="conversations.length === 0">
          <div class="empty-icon">💬</div>
          <p>No conversations yet</p>
          <small>Start a new conversation to connect with travelers</small>
        </div>
      </div>
      
      <div class="load-more" *ngIf="!loading && conversations.length > 0">
        <button class="load-more-btn" (click)="loadMore.emit()">
          Load More
        </button>
      </div>
    </div>
  `,
  styles: [`
    .conversation-list {
      flex: 1;
      overflow-y: auto;
      background: #f8f9fa;
    }

    .loading-spinner {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
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

    .conversations {
      flex: 1;
    }

    .conversation-item {
      display: flex;
      padding: 16px 20px;
      cursor: pointer;
      border-bottom: 1px solid #e8e8e8;
      transition: background-color 0.2s;
      background: #fff;
    }

    .conversation-item:hover {
      background: #f8f9fa;
    }

    .conversation-item.selected {
      background: #e3f2fd;
      border-right: 3px solid #007bff;
    }

    .conversation-avatar {
      position: relative;
      margin-right: 12px;
      flex-shrink: 0;
    }

    .avatar-circle {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 16px;
    }

    .avatar-circle.group-avatar {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }

    .online-indicator {
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 12px;
      height: 12px;
      background: #28a745;
      border: 2px solid white;
      border-radius: 50%;
    }

    .conversation-content {
      flex: 1;
      min-width: 0;
    }

    .conversation-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 4px;
    }

    .conversation-title {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      color: #333;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
      margin-right: 8px;
    }

    .conversation-time {
      font-size: 12px;
      color: #666;
      flex-shrink: 0;
    }

    .conversation-preview {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .last-message {
      margin: 0;
      font-size: 14px;
      color: #666;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
      margin-right: 8px;
    }

    .last-message.unread {
      color: #333;
      font-weight: 500;
    }

    .unread-badge {
      background: #007bff;
      color: white;
      font-size: 11px;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 10px;
      min-width: 18px;
      text-align: center;
      flex-shrink: 0;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      text-align: center;
      color: #666;
    }

    .empty-icon {
      font-size: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .empty-state p {
      margin: 0 0 8px 0;
      font-weight: 500;
    }

    .empty-state small {
      color: #999;
      font-size: 13px;
    }

    .load-more {
      padding: 16px 20px;
      text-align: center;
      border-top: 1px solid #e8e8e8;
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
  `]
})
export class ConversationListComponent {
  @Input() conversations: Conversation[] = [];
  @Input() selectedId: string | undefined;
  @Input() loading = false;

  @Output() select = new EventEmitter<Conversation>();
  @Output() loadMore = new EventEmitter<void>();

  getConversationTitle(conversation: Conversation): string {
    if (conversation.title) {
      return conversation.title;
    }

    if (conversation.type === 'DIRECT') {
      const otherMember = conversation.members.find(m => m.id !== 'current-user-id');
      return otherMember ? `${otherMember.firstName} ${otherMember.lastName}` : 'Direct Message';
    }

    return 'Group Chat';
  }

  getAvatarText(conversation: Conversation): string {
    if (conversation.type === 'GROUP') {
      return conversation.title ? conversation.title.charAt(0).toUpperCase() : 'G';
    }

    const otherMember = conversation.members.find(m => m.id !== 'current-user-id');
    return otherMember ? otherMember.firstName.charAt(0).toUpperCase() : 'U';
  }

  isUserOnline(conversation: Conversation): boolean {
    if (conversation.type === 'DIRECT') {
      const otherMember = conversation.members.find(m => m.id !== 'current-user-id');
      return otherMember ? otherMember.isOnline : false;
    }
    return false;
  }

  getLastMessagePreview(conversation: Conversation): string {
    if (conversation.lastMessage) {
      const prefix = conversation.lastMessage.senderId === 'current-user-id' ? 'You: ' :
        (conversation.type === 'GROUP' ? `${conversation.lastMessage.senderName}: ` : '');

      if (conversation.lastMessage.kind === 'IMAGE') {
        return `${prefix}📷 Image`;
      } else if (conversation.lastMessage.kind === 'FILE') {
        return `${prefix}📎 File`;
      }

      return `${prefix}${conversation.lastMessage.content}`;
    }
    return 'No messages yet';
  }

  formatTime(date: Date): string {
    const now = new Date();
    const messageDate = new Date(date);
    const diffMs = now.getTime() - messageDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'now';
    } else if (diffMins < 60) {
      return `${diffMins}m`;
    } else if (diffHours < 24) {
      return `${diffHours}h`;
    } else if (diffDays < 7) {
      return `${diffDays}d`;
    } else {
      return messageDate.toLocaleDateString();
    }
  }
}
