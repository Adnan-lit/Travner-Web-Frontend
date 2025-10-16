import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ChatService } from '../../services/chat.service';
import { WebSocketService } from '../../services/websocket.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { Conversation, ChatMessage, CreateConversationRequest } from '../../models/common.model';

@Component({
    selector: 'app-chat',
    standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
    template: `
    <div class="chat-container">
      <!-- Header -->
      <div class="chat-header">
        <h1>Messages</h1>
        <button class="new-conversation-btn" (click)="startNewConversation()" *ngIf="isAuthenticated">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"></path>
          </svg>
          New Message
        </button>
      </div>

      <div class="chat-layout">
        <!-- Conversations Sidebar -->
        <div class="conversations-sidebar">
          <div class="sidebar-header">
            <h3>Conversations</h3>
            <div class="connection-status" [class.connected]="isConnected" [class.disconnected]="!isConnected">
              <div class="status-indicator"></div>
              <span>{{ isConnected ? 'Connected' : 'Disconnected' }}</span>
            </div>
          </div>

          <!-- Conversations List -->
          <div class="conversations-list">
            <div 
              *ngFor="let conversation of conversations" 
              class="conversation-item"
              [class.active]="selectedConversation?.id === conversation.id"
              (click)="selectConversation(conversation)"
            >
              <div class="conversation-avatar">
                {{ getInitials(conversation.participants[0].username || 'U') }}
              </div>
              <div class="conversation-info">
                <div class="conversation-title">
                  {{ getConversationTitle(conversation) }}
                </div>
                <div class="conversation-preview">
                  {{ conversation.lastMessage || 'No messages yet' }}
                </div>
                <div class="conversation-time">
                  {{ formatTime(conversation.lastMessageAt || '') }}
                </div>
              </div>
              <div class="unread-indicator" *ngIf="conversation.unreadCount > 0">
                {{ conversation.unreadCount }}
              </div>
            </div>

            <!-- Empty State -->
            <div class="empty-conversations" *ngIf="conversations.length === 0 && !loadingConversations">
              <div class="empty-icon">💬</div>
              <p>No conversations yet</p>
              <p class="empty-subtitle">Start a conversation with other travelers!</p>
            </div>

            <!-- Loading State -->
            <div class="loading-conversations" *ngIf="loadingConversations">
              <div class="loader"></div>
              <p>Loading conversations...</p>
            </div>
          </div>
        </div>

        <!-- Chat Area -->
        <div class="chat-area">
          <!-- No Conversation Selected -->
          <div class="no-conversation" *ngIf="!selectedConversation">
            <div class="no-conversation-content">
              <div class="no-conversation-icon">💬</div>
              <h3>Select a conversation</h3>
              <p>Choose a conversation from the sidebar to start chatting</p>
            </div>
          </div>

          <!-- Selected Conversation -->
          <div class="conversation-view" *ngIf="selectedConversation">
            <!-- Conversation Header -->
            <div class="conversation-header">
              <div class="conversation-title">
                <div class="conversation-avatar">
                  {{ getInitials(getConversationTitle(selectedConversation)) }}
                </div>
                <div class="conversation-details">
                  <h3>{{ getConversationTitle(selectedConversation) }}</h3>
                  <div class="participants-count">
                    {{ selectedConversation.participants.length }} participant(s)
                  </div>
                </div>
              </div>
              <div class="conversation-actions">
                <button class="action-btn" (click)="toggleTyping()" title="Typing indicator">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Messages Area -->
            <div class="messages-container" #messagesContainer>
              <div class="messages-list">
                <!-- Loading Messages -->
                <div class="loading-messages" *ngIf="loadingMessages">
                  <div class="loader"></div>
                  <p>Loading messages...</p>
                </div>

                <!-- Messages -->
                <div 
                  *ngFor="let message of messages" 
                  class="message"
                  [class.own-message]="isOwnMessage(message)"
                >
                  <div class="message-avatar" *ngIf="!isOwnMessage(message)">
                    {{ getInitials(message.senderUsername || 'U') }}
                  </div>
                  
                  <div class="message-content">
                    <div class="message-header">
                      <span class="sender-name">{{ message.senderUsername || 'Unknown' }}</span>
                      <span class="message-time">{{ formatTime(message.createdAt) }}</span>
                    </div>
                    
                    <div class="message-body">
                      <div class="message-text" *ngIf="message.kind === 'TEXT'">{{ message.content }}</div>
                      <div class="message-image" *ngIf="message.kind === 'IMAGE'">
                        <img [src]="message.content" [alt]="'Image from ' + message.senderUsername" />
                      </div>
                      <div class="message-file" *ngIf="message.kind === 'FILE'">
                        <div class="file-icon">📎</div>
                        <div class="file-info">
                          <div class="file-name">{{ getFileName(message.content) }}</div>
                          <div class="file-size">{{ getFileSize(message.content) }}</div>
                        </div>
                        <a [href]="message.content" download class="download-btn">Download</a>
                      </div>
                    </div>
                    
                    <div class="message-status" *ngIf="isOwnMessage(message)">
                      <span class="status-delivered" *ngIf="message.readBy && message.readBy.length > 0">✓</span>
                      <span class="status-read" *ngIf="message.readBy && message.readBy.length > 1">✓✓</span>
                    </div>
                  </div>
                </div>

                <!-- Typing Indicator -->
                <div class="typing-indicator" *ngIf="isTyping">
                  <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <span class="typing-text">{{ typingUser }} is typing...</span>
                </div>
              </div>
            </div>

            <!-- Message Input -->
            <div class="message-input-container" *ngIf="isAuthenticated">
              <form (ngSubmit)="sendMessage()" class="message-form">
                <div class="input-group">
                  <input
                    type="text"
                    [(ngModel)]="newMessage"
                    placeholder="Type your message..."
                    class="message-input"
                    (keydown)="onKeyDown($event)"
                    (input)="onTyping()"
                    name="message"
                    #messageInput
                  />
                  <button type="button" class="attach-btn" (click)="attachFile()" title="Attach file">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.64 16.2a2 2 0 0 1-2.83-2.83l8.49-8.49"></path>
                    </svg>
                  </button>
                  <button type="submit" class="send-btn" [disabled]="!newMessage.trim() || sendingMessage">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22,2 15,22 11,13 2,9 22,2"></polygon>
                    </svg>
                  </button>
                </div>
              </form>
            </div>

            <!-- Not Authenticated -->
            <div class="not-authenticated" *ngIf="!isAuthenticated">
              <div class="auth-prompt">
                <h3>Sign in to start chatting</h3>
                <p>Connect with other travelers and share your experiences</p>
                <button class="signin-btn" routerLink="/signin">Sign In</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .chat-container {
      height: 100vh;
      display: flex;
      flex-direction: column;
      background: #f8f9fa;
    }

    .chat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 2rem;
      background: white;
      border-bottom: 1px solid #e9ecef;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .chat-header h1 {
      margin: 0;
      color: #333;
      font-size: 1.5rem;
    }

    .new-conversation-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: background-color 0.2s;
    }

    .new-conversation-btn:hover {
      background: #0056b3;
    }

    .chat-layout {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    .conversations-sidebar {
      width: 300px;
      background: white;
      border-right: 1px solid #e9ecef;
      display: flex;
      flex-direction: column;
    }

    .sidebar-header {
      padding: 1rem;
      border-bottom: 1px solid #e9ecef;
    }

    .sidebar-header h3 {
      margin: 0 0 0.5rem 0;
      color: #333;
      font-size: 1.1rem;
    }

    .connection-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8rem;
    }

    .status-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #dc3545;
    }

    .connection-status.connected .status-indicator {
      background: #28a745;
    }

    .conversations-list {
      flex: 1;
      overflow-y: auto;
    }

    .conversation-item {
      display: flex;
      align-items: center;
      padding: 1rem;
      border-bottom: 1px solid #f1f3f4;
      cursor: pointer;
      transition: background-color 0.2s;
      position: relative;
    }

    .conversation-item:hover {
      background: #f8f9fa;
    }

    .conversation-item.active {
      background: #e3f2fd;
      border-left: 3px solid #2196f3;
    }

    .conversation-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #007bff;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 0.9rem;
      margin-right: 0.75rem;
      flex-shrink: 0;
    }

    .conversation-info {
      flex: 1;
      min-width: 0;
    }

    .conversation-title {
      font-weight: 600;
      color: #333;
      margin-bottom: 0.25rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .conversation-preview {
      font-size: 0.85rem;
      color: #666;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 0.25rem;
    }

    .conversation-time {
      font-size: 0.75rem;
      color: #999;
    }

    .unread-indicator {
      background: #dc3545;
      color: white;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.7rem;
      font-weight: bold;
      margin-left: 0.5rem;
    }

    .empty-conversations, .loading-conversations {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      text-align: center;
      color: #666;
    }

    .empty-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .empty-subtitle {
      font-size: 0.9rem;
      color: #999;
    }

    .loader {
      width: 20px;
      height: 20px;
      border: 2px solid #f3f3f3;
      border-top: 2px solid #007bff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 0.5rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .chat-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: white;
    }

    .no-conversation {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .no-conversation-content {
      text-align: center;
      color: #666;
    }

    .no-conversation-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .conversation-view {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .conversation-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #e9ecef;
      background: white;
    }

    .conversation-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .conversation-details h3 {
      margin: 0;
      color: #333;
      font-size: 1.1rem;
    }

    .participants-count {
      font-size: 0.8rem;
      color: #666;
    }

    .conversation-actions {
      display: flex;
      gap: 0.5rem;
    }

    .action-btn {
      padding: 0.5rem;
      background: none;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      color: #666;
      transition: background-color 0.2s;
    }

    .action-btn:hover {
      background: #f8f9fa;
    }

    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
      background: #f8f9fa;
    }

    .messages-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .message {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
    }

    .message.own-message {
      flex-direction: row-reverse;
    }

    .message.system-message {
      justify-content: center;
      margin: 1rem 0;
    }

    .message-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #6c757d;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      font-weight: bold;
      flex-shrink: 0;
    }

    .message-content {
      max-width: 70%;
      background: white;
      border-radius: 12px;
      padding: 0.75rem 1rem;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }

    .message.own-message .message-content {
      background: #007bff;
      color: white;
    }

    .message.system-message .message-content {
      background: #e9ecef;
      color: #666;
      text-align: center;
      font-style: italic;
    }

    .message-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.25rem;
    }

    .sender-name {
      font-weight: 600;
      font-size: 0.85rem;
    }

    .message-time {
      font-size: 0.75rem;
      color: #999;
    }

    .message.own-message .message-time {
      color: rgba(255,255,255,0.8);
    }

    .message-text {
      line-height: 1.4;
    }

    .message-image img {
      max-width: 200px;
      border-radius: 8px;
      margin-top: 0.5rem;
    }

    .message-file {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      background: rgba(0,0,0,0.05);
      border-radius: 6px;
      margin-top: 0.5rem;
    }

    .file-icon {
      font-size: 1.2rem;
    }

    .file-info {
      flex: 1;
    }

    .file-name {
      font-weight: 500;
      font-size: 0.9rem;
    }

    .file-size {
      font-size: 0.8rem;
      color: #666;
    }

    .download-btn {
      padding: 0.25rem 0.5rem;
      background: #007bff;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      font-size: 0.8rem;
    }

    .message-status {
      text-align: right;
      margin-top: 0.25rem;
      font-size: 0.8rem;
    }

    .status-delivered {
      color: #999;
    }

    .status-read {
      color: #007bff;
    }

    .typing-indicator {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
      margin-bottom: 0.5rem;
    }

    .typing-dots {
      display: flex;
      gap: 2px;
    }

    .typing-dots span {
      width: 4px;
      height: 4px;
      background: #999;
      border-radius: 50%;
      animation: typing 1.4s infinite;
    }

    .typing-dots span:nth-child(2) {
      animation-delay: 0.2s;
    }

    .typing-dots span:nth-child(3) {
      animation-delay: 0.4s;
    }

    @keyframes typing {
      0%, 60%, 100% {
        transform: translateY(0);
      }
      30% {
        transform: translateY(-10px);
      }
    }

    .typing-text {
      font-size: 0.85rem;
      color: #666;
      font-style: italic;
    }

    .message-input-container {
      padding: 1rem 1.5rem;
      background: white;
      border-top: 1px solid #e9ecef;
    }

    .message-form {
      width: 100%;
    }

    .input-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #f8f9fa;
      border-radius: 24px;
      padding: 0.5rem 1rem;
    }

    .message-input {
      flex: 1;
      border: none;
      background: none;
      outline: none;
      font-size: 0.9rem;
      padding: 0.5rem 0;
    }

    .attach-btn, .send-btn {
      padding: 0.5rem;
      background: none;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      color: #666;
      transition: all 0.2s;
    }

    .attach-btn:hover, .send-btn:hover {
      background: #e9ecef;
    }

    .send-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .not-authenticated {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .auth-prompt {
      text-align: center;
      color: #666;
    }

    .auth-prompt h3 {
      margin-bottom: 0.5rem;
      color: #333;
    }

    .signin-btn {
      padding: 0.75rem 1.5rem;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9rem;
      margin-top: 1rem;
    }

    .loading-messages {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      color: #666;
    }
  `]
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  conversations: Conversation[] = [];
  selectedConversation: Conversation | null = null;
  messages: ChatMessage[] = [];
  
  newMessage = '';
  sendingMessage = false;
  loadingConversations = false;
  loadingMessages = false;
  
  isAuthenticated = false;
  isConnected = false;
  isTyping = false;
  typingUser = '';
  
  private typingTimeout: any;
  private conversationSubscription: any;

  constructor(
    private chatService: ChatService,
    private webSocketService: WebSocketService,
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkAuthentication();
    this.loadConversations();
    this.setupWebSocketConnection();
  }

  ngAfterViewInit(): void {
    this.scrollToBottom();
  }

  ngOnDestroy(): void {
    if (this.conversationSubscription) {
      this.conversationSubscription.unsubscribe();
    }
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
  }

  private checkAuthentication(): void {
    this.authService.isAuthenticated$.subscribe(isAuth => {
      this.isAuthenticated = isAuth;
      if (isAuth) {
        this.setupWebSocketConnection();
      }
    });
  }

  private setupWebSocketConnection(): void {
    if (!this.isAuthenticated) return;

    this.webSocketService.connect();
    
    this.webSocketService.isConnected$.subscribe(connected => {
      this.isConnected = connected;
      if (connected) {
        this.toastService.success('Connected to chat', '');
      } else {
        this.toastService.warning('Disconnected from chat', '');
      }
    });

    this.webSocketService.messages$.subscribe(message => {
      if (this.selectedConversation && message.conversationId === this.selectedConversation.id) {
        // Convert Message to ChatMessage format
        const chatMessage: ChatMessage = {
          id: message.id,
          conversationId: message.conversationId,
          senderId: message.senderId,
          senderUsername: message.senderUsername,
          content: message.body,
          kind: message.kind as 'TEXT' | 'IMAGE' | 'FILE',
          attachments: message.attachments,
          replyTo: message.replyTo,
          createdAt: message.createdAt,
          readBy: message.readBy
        };
        this.messages.push(chatMessage);
        this.scrollToBottom();
      }
    });
  }

  loadConversations(): void {
    if (!this.isAuthenticated) return;

    this.loadingConversations = true;
    this.chatService.getConversations().subscribe({
      next: (response) => {
        this.conversations = response.data || [];
        this.loadingConversations = false;
      },
      error: (error) => {
        console.error('Error loading conversations:', error);
        this.toastService.error('Failed to load conversations', '');
        this.loadingConversations = false;
      }
    });
  }

  selectConversation(conversation: Conversation): void {
    this.selectedConversation = conversation;
    this.loadMessages();
  }

  loadMessages(): void {
    if (!this.selectedConversation) return;

    this.loadingMessages = true;
    this.chatService.getMessages(this.selectedConversation.id).subscribe({
      next: (response) => {
        // Convert Message[] to ChatMessage[]
        this.messages = (response.data || []).map((message: any) => ({
          id: message.id,
          conversationId: message.conversationId,
          senderId: message.senderId,
          senderUsername: message.senderUsername,
          content: message.body,
          kind: message.kind as 'TEXT' | 'IMAGE' | 'FILE',
          attachments: message.attachments,
          replyTo: message.replyTo,
          createdAt: message.createdAt,
          readBy: message.readBy
        }));
        this.loadingMessages = false;
        this.scrollToBottom();
      },
      error: (error) => {
        console.error('Error loading messages:', error);
        this.toastService.error('Failed to load messages', '');
        this.loadingMessages = false;
      }
    });
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.selectedConversation || this.sendingMessage) return;

    this.sendingMessage = true;
    const messageContent = this.newMessage.trim();
    this.newMessage = '';

    this.chatService.sendMessage(this.selectedConversation.id, messageContent).subscribe({
      next: (response) => {
        this.sendingMessage = false;
        if (response.data) {
          // Convert Message to ChatMessage format
          const chatMessage: ChatMessage = {
            id: response.data.id,
            conversationId: response.data.conversationId,
            senderId: response.data.senderId,
            senderUsername: response.data.senderUsername,
            content: response.data.body,
            kind: response.data.kind as 'TEXT' | 'IMAGE' | 'FILE',
            attachments: response.data.attachments,
            replyTo: response.data.replyTo,
            createdAt: response.data.createdAt,
            readBy: response.data.readBy
          };
          this.messages.push(chatMessage);
          this.scrollToBottom();
        }
      },
      error: (error) => {
        console.error('Error sending message:', error);
        this.toastService.error('Failed to send message', '');
        this.sendingMessage = false;
        this.newMessage = messageContent; // Restore message on error
      }
    });
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  onTyping(): void {
    if (!this.selectedConversation) return;

    this.webSocketService.sendTypingIndicator(this.selectedConversation.id, true);
    
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    
    this.typingTimeout = setTimeout(() => {
      this.webSocketService.sendTypingIndicator(this.selectedConversation!.id, false);
    }, 1000);
  }

  startNewConversation(): void {
    // This would typically open a modal or navigate to a new conversation page
    this.toastService.info('New conversation feature coming soon!', '');
  }

  toggleTyping(): void {
    this.toastService.info('Typing indicator toggled', '');
  }

  attachFile(): void {
    this.toastService.info('File attachment coming soon!', '');
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }

  // Utility methods
  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ')
      .map(part => part.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  getConversationTitle(conversation: Conversation): string {
    if (conversation.participants.length === 0) return 'Unknown';
    if (conversation.participants.length === 1) return conversation.participants[0].username;
    return `${conversation.participants.length} participants`;
  }

  formatTime(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  }

  isOwnMessage(message: ChatMessage): boolean {
    const currentUser = this.authService.getCurrentUser();
    return !!(currentUser && currentUser.id === message.senderId);
  }

  getFileName(url: string): string {
    return url.split('/').pop() || 'Unknown file';
  }

  getFileSize(url: string): string {
    return 'Unknown size';
  }
}