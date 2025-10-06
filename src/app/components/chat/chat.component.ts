import { Component, OnInit, OnDestroy, inject, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, combineLatest, Observable, BehaviorSubject } from 'rxjs';
import { ChatService, Conversation, Message, SendMessageRequest } from '../../services/chat.service';
import { WebSocketService } from '../../services/websocket.service';
import { CentralizedAuthService } from '../../services/centralized-auth.service';
import { map, debounceTime, distinctUntilChanged, take } from 'rxjs/operators';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  private destroy$ = new Subject<void>();
  private chatService = inject(ChatService);
  private wsService = inject(WebSocketService);
  private auth = inject(CentralizedAuthService);
  private router = inject(Router);

  // Observable streams
  conversations$ = this.chatService.getConversations$();
  messages$ = this.chatService.getMessages$();
  activeConversation$ = this.chatService.getActiveConversation$();

  // UI state
  newMessage = '';
  isConnected$ = this.wsService.connected$;
  connectionStatus$ = this.wsService.connected$; // Use connected$ for status

  // Chat participants input
  newChatParticipant = '';
  showNewChatModal = false;

  // Search and filtering
  private searchSubject = new BehaviorSubject<string>('');
  searchTerm$ = this.searchSubject.asObservable();

  filteredConversations$ = combineLatest([
    this.conversations$,
    this.searchTerm$
  ]).pipe(
    map(([conversations, searchTerm]) => {
      if (!searchTerm.trim()) return conversations;
      return conversations.filter(conv =>
        conv.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.members.some(member =>
          member.userName?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    })
  );

  // User info
  currentUser$ = this.auth.currentUser$; // Use currentUser$ observable instead of getCurrentUser()

  ngOnInit(): void {
    // Check authentication
    this.auth.isAuthenticated$.pipe(takeUntil(this.destroy$)).subscribe(authenticated => {
      if (!authenticated) {
        this.router.navigate(['/signin']);
        return;
      }
    });    // Initialize chat service
    this.initializeChat();

    // Listen for incoming messages
    this.wsService.messages$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (message: any) => {
          console.log('Received WebSocket message:', message);
          this.chatService.addMessageToState(message);
        },
        error: (error: any) => console.error('WebSocket message error:', error)
      });

    // Listen for connection status changes
    this.isConnected$
      .pipe(takeUntil(this.destroy$))
      .subscribe((connected: any) => {
        console.log('WebSocket connection status:', connected);
        if (connected) {
          // Reload conversations when connected
          this.chatService.loadConversationsReactive();
        }
      });

    // Auto-scroll to bottom when new messages arrive
    this.messages$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      setTimeout(() => this.scrollToBottom(), 100);
    });
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.wsService.disconnect();
  }

  private initializeChat(): void {
    // Connect to WebSocket (will fail gracefully if not available)
    this.wsService.connect();

    // Load initial data
    this.chatService.loadConversationsReactive();

    // Set up polling for updates (fallback when WebSocket is not available)
    this.setupPollingFallback();
  }

  private setupPollingFallback(): void {
    // Poll for new messages every 5 seconds if WebSocket is not connected
    setInterval(() => {
      this.wsService.connected$.pipe(take(1)).subscribe(isConnected => {
        if (!isConnected) {
          this.chatService.loadConversationsReactive();

          // If we have an active conversation, refresh its messages
          this.chatService.getActiveConversation$().pipe(take(1)).subscribe(activeConv => {
            if (activeConv && activeConv.id) {
              this.chatService.loadMessagesReactive(activeConv.id);
            }
          });
        }
      });
    }, 5000);
  }

  selectConversation(conversation: Conversation): void {
    console.log('Selecting conversation:', conversation);
    this.chatService.setActiveConversation(conversation);

    // Mark as read (if needed)
    // this.markAsRead(conversation.id);
  }

  sendMessage(): void {
    const content = this.newMessage.trim();
    if (!content) return;

    this.activeConversation$.pipe(takeUntil(this.destroy$)).subscribe(activeConversation => {
      if (!activeConversation) {
        console.warn('No active conversation selected');
        return;
      }

      const request: SendMessageRequest = {
        conversationId: activeConversation.id,
        content: content
      };

      this.chatService.sendMessageReactive(request)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (message) => {
            console.log('Message sent successfully:', message);
            this.newMessage = '';

            // Send via WebSocket for real-time delivery
            const wsRequest = {
              conversationId: activeConversation.id,
              kind: 'TEXT' as const,
              content: message.content
            };
            this.wsService.sendMessage(wsRequest);
          },
          error: (error) => {
            console.error('Error sending message:', error);
          }
        });
    }).unsubscribe(); // Unsubscribe immediately since we only need the current value
  }

  onMessageKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  // New chat functionality
  openNewChatModal(): void {
    this.showNewChatModal = true;
    this.newChatParticipant = '';
  }

  closeNewChatModal(): void {
    this.showNewChatModal = false;
    this.newChatParticipant = '';
  }

  createNewChat(): void {
    const participant = this.newChatParticipant.trim();
    if (!participant) return;

    const participants = [participant]; // Add current user automatically on backend

    this.chatService.createConversationReactive(participants)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (conversation) => {
          console.log('New conversation created:', conversation);
          this.closeNewChatModal();
        },
        error: (error) => {
          console.error('Error creating conversation:', error);
        }
      });
  }

  // Search functionality
  onSearchChange(searchTerm: string): void {
    this.searchSubject.next(searchTerm);
  }

  // Typing indicator
  onTyping(): void {
    this.activeConversation$.pipe(takeUntil(this.destroy$)).subscribe(activeConversation => {
      if (activeConversation) {
        this.wsService.sendTypingIndicator({
          conversationId: activeConversation.id,
          isTyping: true
        });
      }
    }).unsubscribe();
  }

  onStoppedTyping(): void {
    this.activeConversation$.pipe(takeUntil(this.destroy$)).subscribe(activeConversation => {
      if (activeConversation) {
        this.wsService.sendTypingIndicator({
          conversationId: activeConversation.id,
          isTyping: false
        });
      }
    }).unsubscribe();
  }

  // Utility methods
  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        const element = this.messagesContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }

  getConversationTitle(conversation: Conversation): string {
    if (conversation.title) {
      return conversation.title;
    }

    // For direct messages, show the other participant's name
    if (conversation.type === 'DIRECT' && conversation.members.length === 2) {
      // Simplified approach - return a placeholder or first member name
      const otherMember = conversation.members.find(m => m.userName !== 'currentUser');
      return otherMember?.userName || 'Direct Message';
    }

    return `Group Chat (${conversation.members.length} members)`;
  }

  isMyMessage(message: Message): Observable<boolean> {
    if (!this.currentUser$) {
      return new BehaviorSubject(false).asObservable();
    }
    return this.currentUser$.pipe(
      map((currentUser: any) => message.senderId === currentUser?.id)
    );
  }

  // Debug methods
  debugWebSocketStatus(): void {
    this.wsService.connected$.subscribe((status: any) => {
      console.log('WebSocket Debug Status:', status);
    });
  }

  reconnectWebSocket(): void {
    console.log('Manually reconnecting WebSocket...');
    this.wsService.disconnect();
    setTimeout(() => {
      this.wsService.connect();
    }, 1000);
  }

  // TrackBy functions for ngFor performance
  trackConversation(index: number, conversation: Conversation): string {
    return conversation.id;
  }

  trackMessage(index: number, message: Message): string {
    return message.id;
  }
}
