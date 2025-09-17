import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ChatService } from '../services/chat.service';
import { WebSocketService } from '../services/websocket.service';
import { ConversationListComponent } from '../conversation-list/conversation-list.component';
import { MessageAreaComponent } from '../message-area/message-area.component';
import { MessageInputComponent } from '../message-input/message-input.component';
import { TypingIndicatorComponent } from '../components/typing-indicator/typing-indicator.component';
import { Conversation, Message, SendMessageRequest, ChatEvent } from '../../../core/models/chat.models';

@Component({
  selector: 'app-chat-layout',
  imports: [
    CommonModule,
    FormsModule,
    ConversationListComponent,
    MessageAreaComponent,
    MessageInputComponent,
    TypingIndicatorComponent
  ],
  template: `
    <div class="chat-layout" [class.mobile-chat-open]="selectedConversation && isMobile">
      <!-- Sidebar - Conversation List -->
      <div class="chat-sidebar" [class.mobile-hidden]="selectedConversation && isMobile">
        <div class="chat-header">
          <h2>Messages</h2>
          <button class="btn-icon" (click)="startNewConversation()" title="Start new conversation">
            <i class="icon-add">➕</i>
          </button>
        </div>

        <div class="search-bar">
          <div class="search-field">
            <input [(ngModel)]="searchTerm" (input)="filterConversations()" placeholder="Search conversations">
            <i class="icon-search">🔍</i>
          </div>
        </div>

        <app-conversation-list 
          [conversations]="filteredConversations"
          [selectedId]="selectedConversation?.id"
          [loading]="loadingConversations"
          (select)="selectConversation($event)"
          (loadMore)="loadMoreConversations()">
        </app-conversation-list>
      </div>

      <!-- Main Chat Area -->
      <div class="chat-main" *ngIf="selectedConversation">
        <div class="chat-header">
          <button class="back-button btn-icon" 
                  (click)="goBackToList()" 
                  *ngIf="isMobile">
            <i class="icon-back">←</i>
          </button>
          
          <div class="conversation-info">
            <h3>{{getConversationTitle(selectedConversation)}}</h3>
            <span class="member-count">
              {{selectedConversation.members.length}} member{{selectedConversation.members.length > 1 ? 's' : ''}}
            </span>
          </div>

          <button class="btn-icon" (click)="showConversationMenu = !showConversationMenu">
            <i class="icon-menu">⋮</i>
          </button>
          
          <!-- Conversation Menu -->
          <div class="conversation-menu" *ngIf="showConversationMenu" (click)="showConversationMenu = false">
            <button (click)="viewConversationInfo()">
              <i class="icon-info">ℹ️</i>
              <span>Conversation Info</span>
            </button>
            <button (click)="muteConversation()" *ngIf="selectedConversation?.type === 'GROUP'">
              <i class="icon-mute">🔇</i>
              <span>Mute</span>
            </button>
            <button (click)="leaveConversation()" *ngIf="selectedConversation?.type === 'GROUP'">
              <i class="icon-leave">🚪</i>
              <span>Leave Conversation</span>
            </button>
          </div>
        </div>

        <app-message-area 
          [conversationId]="selectedConversation.id"
          [messages]="messages"
          [loading]="loadingMessages"
          (loadMore)="loadMoreMessages()"
          (editMessage)="editMessage($event)"
          (deleteMessage)="deleteMessage($event)"
          (messageVisible)="onMessageVisible($event)">
        </app-message-area>

        <app-typing-indicator 
          [typingUsers]="typingUsers"
          *ngIf="typingUsers.length > 0">
        </app-typing-indicator>

        <app-message-input 
          [conversationId]="selectedConversation.id"
          (send)="sendMessage($event)"
          (typing)="handleTyping($event)">
        </app-message-input>
      </div>

      <!-- Empty State -->
      <div class="chat-empty" *ngIf="!selectedConversation">
        <div class="empty-icon">💬</div>
        <h3>Select a conversation to start messaging</h3>
        <p>Connect with fellow travelers and share your experiences</p>
        <button class="btn-primary" (click)="startNewConversation()">
          Start New Conversation
        </button>
      </div>

      <!-- Connection Status -->
      <div class="connection-status" *ngIf="!(wsService.isConnected$ | async)">
        <i class="icon-offline">📶</i>
        <span>Reconnecting...</span>
      </div>
    </div>
  `,
  styles: [`
    .chat-layout {
      display: grid;
      grid-template-columns: 350px 1fr;
      height: 100vh;
      background: #fff;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .chat-sidebar {
      border-right: 1px solid #e0e0e0;
      display: flex;
      flex-direction: column;
      background: #f8f9fa;
    }

    .chat-header {
      padding: 20px;
      border-bottom: 1px solid #e0e0e0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #fff;
      z-index: 1;
      position: relative;
    }

    .chat-header h2, .chat-header h3 {
      margin: 0;
      color: #333;
      font-weight: 600;
    }

    .conversation-info {
      flex: 1;
      min-width: 0;
      margin-left: 8px;
    }

    .conversation-info h3 {
      font-size: 1.1rem;
      margin-bottom: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .member-count {
      font-size: 0.85rem;
      color: #666;
    }

    .search-bar {
      padding: 16px 20px;
      border-bottom: 1px solid #e0e0e0;
      background: #fff;
    }

    .search-field {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-field input {
      width: 100%;
      padding: 12px 40px 12px 16px;
      border: 1px solid #ddd;
      border-radius: 24px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
    }

    .search-field input:focus {
      border-color: #007bff;
    }

    .icon-search {
      position: absolute;
      right: 12px;
      color: #666;
      font-size: 16px;
    }

    .chat-main {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: #fff;
    }

    .chat-empty {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100vh;
      color: #666;
      text-align: center;
      padding: 40px;
      background: #f8f9fa;
    }

    .empty-icon {
      font-size: 64px;
      margin-bottom: 20px;
      opacity: 0.6;
    }

    .chat-empty h3 {
      margin: 0 0 12px 0;
      color: #333;
      font-weight: 600;
    }

    .chat-empty p {
      margin: 0 0 24px 0;
      color: #666;
      font-size: 14px;
    }

    .btn-primary {
      background: #007bff;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 24px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .btn-primary:hover {
      background: #0056b3;
    }

    .btn-icon {
      background: none;
      border: none;
      padding: 8px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s;
      font-size: 16px;
    }

    .btn-icon:hover {
      background: #f0f0f0;
    }

    .back-button {
      margin-right: 8px;
    }

    .conversation-menu {
      position: absolute;
      top: 100%;
      right: 20px;
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      z-index: 1000;
      min-width: 180px;
    }

    .conversation-menu button {
      width: 100%;
      background: none;
      border: none;
      padding: 12px 16px;
      text-align: left;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: background-color 0.2s;
    }

    .conversation-menu button:hover {
      background: #f8f9fa;
    }

    .conversation-menu button:first-child {
      border-radius: 8px 8px 0 0;
    }

    .conversation-menu button:last-child {
      border-radius: 0 0 8px 8px;
    }

    .connection-status {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #dc3545;
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      z-index: 1000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }

    /* Mobile Responsive */
    @media (max-width: 768px) {
      .chat-layout {
        grid-template-columns: 1fr;
      }

      .chat-sidebar.mobile-hidden {
        display: none;
      }

      .chat-layout.mobile-chat-open .chat-main {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: #fff;
        z-index: 10;
      }

      .back-button {
        display: flex;
      }
    }

    @media (min-width: 769px) {
      .back-button {
        display: none;
      }
    }
  `]
})
export class ChatLayoutComponent implements OnInit, OnDestroy {
  conversations: Conversation[] = [];
  filteredConversations: Conversation[] = [];
  selectedConversation: Conversation | null = null;
  messages: Message[] = [];
  typingUsers: string[] = [];

  searchTerm = '';
  loadingConversations = false;
  loadingMessages = false;
  currentPage = 0;
  isMobile = false;
  showConversationMenu = false;

  private destroy$ = new Subject<void>();

  constructor(
    public chatService: ChatService,
    public wsService: WebSocketService
  ) { }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.isMobile = event.target.innerWidth <= 768;
  }

  ngOnInit(): void {
    this.isMobile = window.innerWidth <= 768;
    this.loadConversations();
    this.connectWebSocket();
    this.subscribeToWebSocketEvents();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.wsService.disconnect();
  }

  connectWebSocket(): void {
    this.wsService.connect().pipe(takeUntil(this.destroy$)).subscribe();
  }

  loadConversations(): void {
    this.loadingConversations = true;
    // For now, create mock data until backend is ready
    setTimeout(() => {
      this.conversations = this.getMockConversations();
      this.filteredConversations = [...this.conversations];
      this.loadingConversations = false;
    }, 500);

    // Uncomment when backend is ready
    // this.chatService.getConversations(0).subscribe({
    //   next: (response) => {
    //     this.conversations = response.content;
    //     this.filteredConversations = [...this.conversations];
    //     this.loadingConversations = false;
    //   },
    //   error: (error) => {
    //     console.error('Failed to load conversations:', error);
    //     this.loadingConversations = false;
    //   }
    // });
  }

  selectConversation(conversation: Conversation): void {
    this.selectedConversation = conversation;
    this.messages = [];
    this.loadMessages();
    this.showConversationMenu = false;

    // Subscribe to conversation events
    this.wsService.subscribeToConversation(conversation.id);
  }

  loadMessages(): void {
    if (!this.selectedConversation) return;

    this.loadingMessages = true;
    // Mock messages for now
    setTimeout(() => {
      this.messages = this.getMockMessages(this.selectedConversation!.id);
      this.loadingMessages = false;
    }, 300);

    // Uncomment when backend is ready
    // this.chatService.getMessages(this.selectedConversation.id, 0).subscribe({
    //   next: (response) => {
    //     this.messages = response.content.reverse(); // Show newest at bottom
    //     this.loadingMessages = false;
    //   },
    //   error: (error) => {
    //     console.error('Failed to load messages:', error);
    //     this.loadingMessages = false;
    //   }
    // });
  }

  sendMessage(request: SendMessageRequest): void {
    // Add message to local array immediately for better UX
    const newMessage: Message = {
      id: Date.now().toString(),
      conversationId: request.conversationId,
      senderId: 'current-user-id',
      senderName: 'You',
      kind: request.kind,
      content: request.content,
      attachments: request.attachments || [],
      sentAt: new Date(),
      isEdited: false,
      readByUserIds: [],
      readCount: 0
    };

    this.messages.push(newMessage);

    // Send via WebSocket for real-time delivery
    this.wsService.sendMessage(request);

    // Uncomment when backend is ready
    // this.chatService.sendMessage(request).subscribe({
    //   next: (message) => {
    //     console.log('Message sent:', message);
    //   },
    //   error: (error) => {
    //     console.error('Failed to send message:', error);
    //     // Remove from local array if failed
    //     this.messages = this.messages.filter(m => m.id !== newMessage.id);
    //   }
    // });
  }

  handleTyping(isTyping: boolean): void {
    if (this.selectedConversation) {
      this.wsService.sendTypingIndicator(this.selectedConversation.id, isTyping);
    }
  }

  editMessage(event: { messageId: string, content: string }): void {
    // Update local message
    const index = this.messages.findIndex(m => m.id === event.messageId);
    if (index !== -1) {
      this.messages[index] = {
        ...this.messages[index],
        content: event.content,
        isEdited: true,
        editedAt: new Date()
      };
    }

    // Uncomment when backend is ready
    // this.chatService.editMessage(event.messageId, event.content).subscribe({
    //   next: (message) => {
    //     const index = this.messages.findIndex(m => m.id === message.id);
    //     if (index !== -1) {
    //       this.messages[index] = message;
    //     }
    //   },
    //   error: (error) => {
    //     console.error('Failed to edit message:', error);
    //   }
    // });
  }

  deleteMessage(messageId: string): void {
    this.messages = this.messages.filter(m => m.id !== messageId);

    // Uncomment when backend is ready
    // this.chatService.deleteMessage(messageId).subscribe({
    //   next: () => {
    //     this.messages = this.messages.filter(m => m.id !== messageId);
    //   },
    //   error: (error) => {
    //     console.error('Failed to delete message:', error);
    //   }
    // });
  }

  onMessageVisible(message: Message): void {
    // Mark message as read
    if (this.selectedConversation) {
      this.wsService.sendReadReceipt(this.selectedConversation.id, message.id);
    }
  }

  filterConversations(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredConversations = this.conversations.filter(conv =>
      this.getConversationTitle(conv).toLowerCase().includes(term)
    );
  }

  getConversationTitle(conversation: Conversation): string {
    if (conversation.title) {
      return conversation.title;
    }

    // For direct conversations, show the other person's name
    if (conversation.type === 'DIRECT') {
      const otherMember = conversation.members.find(m => m.id !== 'current-user-id');
      return otherMember ? `${otherMember.firstName} ${otherMember.lastName}` : 'Direct Message';
    }

    return 'Group Chat';
  }

  goBackToList(): void {
    this.selectedConversation = null;
  }

  loadMoreConversations(): void {
    // Implement pagination
  }

  loadMoreMessages(): void {
    // Implement message pagination
  }

  startNewConversation(): void {
    // Implement new conversation creation
    console.log('Starting new conversation...');
  }

  viewConversationInfo(): void {
    // Implement conversation info modal
    console.log('Viewing conversation info...');
  }

  muteConversation(): void {
    // Implement mute functionality
    console.log('Muting conversation...');
  }

  leaveConversation(): void {
    // Implement leave conversation
    console.log('Leaving conversation...');
  }

  private subscribeToWebSocketEvents(): void {
    this.wsService.messages$.pipe(takeUntil(this.destroy$)).subscribe((event: ChatEvent) => {
      this.handleWebSocketEvent(event);
    });
  }

  private handleWebSocketEvent(event: ChatEvent): void {
    switch (event.type) {
      case 'MESSAGE_SENT':
        if (event.conversationId === this.selectedConversation?.id) {
          this.messages.push(event.data);
        }
        break;

      case 'USER_TYPING':
        if (event.conversationId === this.selectedConversation?.id) {
          if (!this.typingUsers.includes(event.userName)) {
            this.typingUsers.push(event.userName);
          }
        }
        break;

      case 'USER_STOPPED_TYPING':
        this.typingUsers = this.typingUsers.filter(user => user !== event.userName);
        break;

      case 'MESSAGE_READ':
        // Update read receipts
        break;
    }
  }

  // Mock data for testing
  private getMockConversations(): Conversation[] {
    return [
      {
        id: '1',
        type: 'DIRECT',
        members: [
          {
            id: 'user-1',
            firstName: 'Sarah',
            lastName: 'Johnson',
            avatar: '',
            isOnline: true,
            lastSeen: new Date(),
            role: 'MEMBER'
          }
        ],
        ownerId: 'current-user-id',
        adminIds: [],
        createdAt: new Date(),
        lastMessageAt: new Date(),
        isArchived: false,
        unreadCount: 2,
        lastMessage: {
          id: '1',
          conversationId: '1',
          senderId: 'user-1',
          senderName: 'Sarah Johnson',
          kind: 'TEXT',
          content: 'Hey! Are you still planning to visit Paris next month?',
          attachments: [],
          sentAt: new Date(),
          isEdited: false,
          readByUserIds: [],
          readCount: 0
        }
      },
      {
        id: '2',
        type: 'GROUP',
        title: 'Tokyo Travel Group',
        members: [
          {
            id: 'user-2',
            firstName: 'Mike',
            lastName: 'Chen',
            avatar: '',
            isOnline: false,
            lastSeen: new Date(Date.now() - 3600000),
            role: 'ADMIN'
          },
          {
            id: 'user-3',
            firstName: 'Emma',
            lastName: 'Wilson',
            avatar: '',
            isOnline: true,
            lastSeen: new Date(),
            role: 'MEMBER'
          }
        ],
        ownerId: 'user-2',
        adminIds: ['user-2'],
        createdAt: new Date(),
        lastMessageAt: new Date(),
        isArchived: false,
        unreadCount: 0,
        lastMessage: {
          id: '2',
          conversationId: '2',
          senderId: 'user-3',
          senderName: 'Emma Wilson',
          kind: 'TEXT',
          content: 'I found a great ramen place in Shibuya!',
          attachments: [],
          sentAt: new Date(),
          isEdited: false,
          readByUserIds: [],
          readCount: 0
        }
      }
    ];
  }

  private getMockMessages(conversationId: string): Message[] {
    const baseMessages = [
      {
        id: '1',
        conversationId,
        senderId: 'user-1',
        senderName: 'Sarah Johnson',
        kind: 'TEXT' as const,
        content: 'Hey! Are you still planning to visit Paris next month?',
        attachments: [],
        sentAt: new Date(Date.now() - 3600000),
        isEdited: false,
        readByUserIds: [],
        readCount: 0
      },
      {
        id: '2',
        conversationId,
        senderId: 'current-user-id',
        senderName: 'You',
        kind: 'TEXT' as const,
        content: 'Yes! I\'m so excited. Have you been there before?',
        attachments: [],
        sentAt: new Date(Date.now() - 3000000),
        isEdited: false,
        readByUserIds: [],
        readCount: 0
      },
      {
        id: '3',
        conversationId,
        senderId: 'user-1',
        senderName: 'Sarah Johnson',
        kind: 'TEXT' as const,
        content: 'I was there last year! The Louvre is amazing, but book tickets in advance. Also, try the croissants at Pierre Hermé!',
        attachments: [],
        sentAt: new Date(Date.now() - 1800000),
        isEdited: false,
        readByUserIds: [],
        readCount: 0
      }
    ];

    return baseMessages;
  }
}
