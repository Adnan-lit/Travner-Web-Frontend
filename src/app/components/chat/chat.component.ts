import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';
import { WebSocketService } from '../../services/websocket.service';
import { UserService } from '../../services/user.service';
import { 
  ChatMessage, 
  ChatConversation, 
  ConversationWithParticipants, 
  SendMessageRequest,
  TypingIndicator 
} from '../../models/chat.model';
import { User } from '../../models/common.model';
import { UserSearchComponent } from './user-search/user-search.component';

@Component({
    selector: 'app-chat',
    standalone: true,
  imports: [CommonModule, FormsModule, UserSearchComponent],
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef;

    // Data
  conversations: ConversationWithParticipants[] = [];
  selectedConversation: ConversationWithParticipants | null = null;
  messages: ChatMessage[] = [];
  filteredConversations: ConversationWithParticipants[] = [];
    
    // UI State
  newMessage = '';
  sendingMessage = false;
  loadingConversations = false;
  loadingMessages = false;
    showUserSearch = false;
  conversationSearchQuery = '';
  isConnected = false;
  
  // Authentication
  currentUser: User | null = null;
  
  // WebSocket
    private destroy$ = new Subject<void>();
  private typingTimeout: any;

  constructor(
    private authService: AuthService,
    private chatService: ChatService,
        private webSocketService: WebSocketService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.checkAuthentication()) {
      return;
    }
    
    this.loadConversations();
    this.connectWebSocket();
    this.setupSubscriptions();
  }

  ngAfterViewInit(): void {
    this.scrollToBottom();
  }

  ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.webSocketService.disconnect();
    
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
  }

  private checkAuthentication(): boolean {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/signin']);
      return false;
    }
    
    this.currentUser = this.authService.getCurrentUser();
    return true;
  }

  private loadConversations(): void {
    this.loadingConversations = true;
    this.chatService.getConversations().subscribe({
      next: (conversations) => {
        this.conversations = conversations;
        this.filteredConversations = conversations;
        this.loadingConversations = false;
      },
      error: (error) => {
        console.error('Error loading conversations:', error);
        this.loadingConversations = false;
      }
    });
  }

  private connectWebSocket(): void {
    this.webSocketService.connect();
    this.webSocketService.getConnectionStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe(connected => {
        this.isConnected = connected;
        if (connected) {
          console.log('WebSocket connected successfully');
        } else {
          console.warn('WebSocket disconnected');
        }
      });
  }

  private setupSubscriptions(): void {
    // Subscribe to conversations updates
    this.chatService.conversations$
      .pipe(takeUntil(this.destroy$))
      .subscribe(conversations => {
        this.conversations = conversations;
        this.filteredConversations = conversations;
      });

    // Subscribe to messages updates
    this.chatService.messages$
      .pipe(takeUntil(this.destroy$))
      .subscribe(messagesMap => {
        if (this.selectedConversation) {
          this.messages = messagesMap.get(this.selectedConversation.id) || [];
          setTimeout(() => this.scrollToBottom(), 100);
        }
      });
  }

  selectConversation(conversation: ConversationWithParticipants): void {
    // Unsubscribe from previous conversation
    if (this.selectedConversation && this.selectedConversation.id !== conversation.id) {
      this.webSocketService.unsubscribeFromConversation(this.selectedConversation.id);
    }
    
    this.selectedConversation = conversation;
    this.loadMessages(conversation.id);
    this.markMessagesAsRead(conversation.id);
    
    // Subscribe to conversation WebSocket channel
    this.webSocketService.subscribeToConversation(conversation.id);
  }

  private loadMessages(conversationId: string): void {
    this.loadingMessages = true;
    this.chatService.getMessages(conversationId).subscribe({
      next: (messages) => {
        this.messages = messages;
        this.loadingMessages = false;
        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: (error) => {
        console.error('Error loading messages:', error);
        this.messages = [];
        this.loadingMessages = false;
      }
    });
  }

  private markMessagesAsRead(conversationId: string): void {
    this.chatService.markMessagesAsRead(conversationId).subscribe({
      error: (error) => {
        console.error('Error marking messages as read:', error);
      }
    });
  }

  sendMessage(): void {
    if (!this.selectedConversation || !this.newMessage.trim() || this.sendingMessage) {
      return;
    }

    if (!this.isConnected) {
      alert('Not connected to chat server. Please refresh the page and try again.');
            return;
        }

    const messageContent = this.newMessage.trim();
    this.newMessage = '';
        this.sendingMessage = true;

    const request: SendMessageRequest = {
      conversationId: this.selectedConversation.id,
      content: messageContent,
      messageType: 'TEXT'
    };

    this.chatService.sendMessage(request).subscribe({
      next: (message) => {
                this.sendingMessage = false;
        console.log('Message sent successfully:', message);
            },
      error: (error) => {
                console.error('Error sending message:', error);
                this.sendingMessage = false;
        this.newMessage = messageContent; // Restore message on error
        
        if (error.status === 401) {
          alert('Authentication failed. Please sign in again.');
          this.router.navigate(['/signin']);
        } else if (error.status === 403) {
          alert('You do not have permission to send messages in this conversation.');
        } else if (error.status === 404) {
          alert('Conversation not found. Please refresh and try again.');
        } else {
          alert('Failed to send message. Please try again.');
        }
      }
    });
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  onMessageInput(): void {
    if (this.selectedConversation) {
      this.sendTypingIndicator(true);
        
        // Clear existing timeout
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
        }
        
      // Set timeout to stop typing indicator
        this.typingTimeout = setTimeout(() => {
                this.sendTypingIndicator(false);
      }, 1000);
    }
    }

    private sendTypingIndicator(isTyping: boolean): void {
        if (this.selectedConversation) {
            this.webSocketService.sendTypingIndicator(this.selectedConversation.id, isTyping);
        }
    }

  onConversationSearch(event: any): void {
    const query = event.target.value.toLowerCase();
    this.conversationSearchQuery = query;
    
    if (!query.trim()) {
      this.filteredConversations = this.conversations;
    } else {
      this.filteredConversations = this.conversations.filter(conversation => 
        conversation.title.toLowerCase().includes(query)
      );
    }
  }

  getConversationTitle(conversation: ConversationWithParticipants): string {
    if (conversation.type === 'DIRECT') {
      // For direct conversations, show the other participant's name
      const otherParticipant = this.getOtherParticipantFromConversation(conversation);
      if (otherParticipant) {
        return this.getParticipantDisplayName(otherParticipant);
      }
      // Fallback if we can't find the other participant
      return 'Direct Message';
    }
    
    // For group conversations, use the conversation title
    return conversation.title || 'Group Chat';
  }

  private getOtherParticipantFromConversation(conversation: ConversationWithParticipants): User | null {
    if (!this.currentUser || !conversation.participants) {
      return null;
    }
    
    const otherParticipant = conversation.participants.find(participant => participant.id !== this.currentUser!.id);
    if (otherParticipant) {
      return {
        id: otherParticipant.id,
        userName: otherParticipant.username || otherParticipant.id,
        firstName: otherParticipant.firstName || 'User',
        lastName: otherParticipant.lastName || 'Name',
        isOnline: otherParticipant.isOnline || false
      };
    }
    
    return null;
  }

  getSenderDisplayName(message: ChatMessage): string {
    // If it's our own message, don't show sender name (handled by isOwnMessage)
    if (this.isOwnMessage(message)) {
      return '';
    }

    // For direct conversations, show the other participant's name
    if (this.selectedConversation && this.selectedConversation.type === 'DIRECT') {
      const otherParticipant = this.getOtherParticipant();
      if (otherParticipant) {
        return this.getParticipantDisplayName(otherParticipant);
      }
    }

    // For group conversations, find the participant who sent the message
    if (this.selectedConversation && this.selectedConversation.type === 'GROUP') {
      const senderParticipant = this.selectedConversation.participants?.find(
        participant => participant.id === message.senderId
      );
      if (senderParticipant) {
        return this.getParticipantDisplayName(senderParticipant);
      }
    }

    // Fallback to message sender username or a default
    return message.senderUsername || 'Unknown User';
  }

  getConversationLastMessage(conversation: ConversationWithParticipants): string {
    return conversation.lastMessage || 'No messages yet';
  }

  getMessageTime(message: ChatMessage): string {
    const date = new Date(message.createdAt);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  getConversationTime(conversation: ConversationWithParticipants): string {
    if (!conversation.lastMessageAt) {
      return '';
    }
    const date = new Date(conversation.lastMessageAt);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  isOwnMessage(message: ChatMessage): boolean {
    if (!this.currentUser || !message.senderId) {
      return false;
    }
    return this.currentUser.id === message.senderId;
  }

  getOtherParticipant(): User | null {
    if (!this.selectedConversation || !this.currentUser) {
      return null;
    }
    
    return this.getOtherParticipantFromConversation(this.selectedConversation);
  }

  getParticipantDisplayName(participant: any): string {
    if (!participant) {
      return 'Unknown User';
    }
    
    // Try different property names that might exist
    const userName = participant.userName || participant.username;
    const firstName = participant.firstName;
    const lastName = participant.lastName;
    
    if (userName) {
      return userName;
    }
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    
    if (firstName) {
      return firstName;
    }
    
    return 'Unknown User';
  }

  getChatHeaderTitle(): string {
    if (!this.selectedConversation) {
      return 'Chat';
    }
    
    if (this.selectedConversation.type === 'DIRECT') {
      const otherParticipant = this.getOtherParticipant();
      if (otherParticipant) {
        return this.getParticipantDisplayName(otherParticipant);
      }
      return 'Direct Message';
    }
    
    // For group conversations, use the conversation title
    return this.selectedConversation.title || 'Group Chat';
  }

  getConnectionStatusText(): string {
    return this.isConnected ? 'Connected' : 'Disconnected';
  }

  getConnectionStatusClass(): string {
    return this.isConnected ? 'status-connected' : 'status-disconnected';
  }

  private scrollToBottom(): void {
      if (this.messagesContainer) {
      const element = this.messagesContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }

  // User search functionality
  onUserSelected(user: User): void {
    console.log('User selected for chat:', user);
    
    // Create or get direct conversation with selected user
    this.chatService.getDirectConversation(user.id).subscribe({
      next: (conversation) => {
        this.selectConversation(conversation);
        this.showUserSearch = false;
        console.log('Started conversation with:', user.userName);
                },
                error: (error) => {
        console.error('Error creating conversation:', error);
        alert('Failed to start conversation. Please try again.');
                }
            });
        }

  toggleUserSearch(): void {
    this.showUserSearch = !this.showUserSearch;
  }

  onCloseUserSearch(): void {
    this.showUserSearch = false;
  }

  attachFile(): void {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*,.pdf,.doc,.docx,.txt';
    fileInput.multiple = false;
    
    fileInput.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        this.uploadFile(file);
      }
    };
    
    fileInput.click();
  }

  private uploadFile(file: File): void {
    if (!this.selectedConversation) {
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      alert('File type not supported. Please select an image, PDF, or document file.');
      return;
    }

    this.sendingMessage = true;
    
    // For now, just send the file name as a text message
    // TODO: Implement proper file upload when backend endpoint is ready
    const request: SendMessageRequest = {
      conversationId: this.selectedConversation.id,
      content: `📎 ${file.name} (File upload feature coming soon)`,
      messageType: 'TEXT'
    };
    
    this.chatService.sendMessage(request).subscribe({
      next: (message) => {
        this.sendingMessage = false;
        console.log('File message sent:', message);
      },
      error: (error: any) => {
        console.error('Error sending file message:', error);
        this.sendingMessage = false;
        alert('Failed to send file. Please try again.');
      }
    });
  }

  showConversationInfo(): void {
    console.log('Show conversation info');
    // TODO: Implement conversation info
  }
}