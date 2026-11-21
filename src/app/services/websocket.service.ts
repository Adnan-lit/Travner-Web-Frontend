import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject, Subscription, filter, skip, takeUntil } from 'rxjs';
import { Client, IMessage, StompConfig } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getWebSocketUrl } from '../config/runtime.config';
import { ChatMessage, TypingIndicator } from '../models/chat.model';
import { ChatService } from './chat.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService implements OnDestroy {
  private stompClient: Client | null = null;
  private connectionStatus = new BehaviorSubject<boolean>(false);
  private destroy$ = new Subject<void>();
  private subscribedConversations = new Set<string>();
  private tokenSubscription?: Subscription;
  
  private readonly WS_URL = getWebSocketUrl();

  constructor(
    private chatService: ChatService,
    private authService: AuthService
  ) {}

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.stompClient && this.stompClient.connected) {
      return;
    }

    this.watchTokenForReconnect();

    try {
      const socket = new SockJS(this.WS_URL);
      this.stompClient = new Client({
        webSocketFactory: () => socket,
        // STOMP debug output includes CONNECT frames with authorization headers.
        connectHeaders: this.getAuthHeaders(),
      });

      this.stompClient.onConnect = () => {
        this.connectionStatus.next(true);
        this.subscribeToChannels();
      };

      // Log errors without the frame/error object: CONNECT frames can carry
      // authorization headers, so logging them would leak credentials.
      this.stompClient.onStompError = () => {
        console.error('WebSocket STOMP error');
        this.connectionStatus.next(false);
      };

      this.stompClient.onWebSocketError = () => {
        console.error('WebSocket connection error');
        this.connectionStatus.next(false);
      };

      this.stompClient.onWebSocketClose = () => {
        this.connectionStatus.next(false);
      };

      this.stompClient.activate();
    } catch {
      console.error('WebSocket connection could not be established');
      this.connectionStatus.next(false);
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.stompClient = null;
    }
    this.connectionStatus.next(false);
    this.subscribedConversations.clear();
  }

  /**
   * Subscribe to conversation
   */
  subscribeToConversation(conversationId: string): void {
    if (!this.stompClient || !this.stompClient.connected) {
      return;
    }

    if (this.subscribedConversations.has(conversationId)) {
      return;
    }

    // Subscribe to conversation messages
    this.stompClient.subscribe(`/topic/conversation/${conversationId}`, (message: IMessage) => {
      const chatMessage: ChatMessage = JSON.parse(message.body);
      this.chatService.addMessageToCache(chatMessage);
    });

    // Subscribe to typing indicators
    this.stompClient.subscribe(`/topic/conversation/${conversationId}/typing`, (message: IMessage) => {
      const typingIndicator: TypingIndicator = JSON.parse(message.body);
      this.chatService.updateTypingIndicator(
        conversationId,
        typingIndicator.userId,
        typingIndicator.isTyping
      );
    });

    this.subscribedConversations.add(conversationId);
  }

  /**
   * Unsubscribe from conversation
   */
  unsubscribeFromConversation(conversationId: string): void {
    if (!this.stompClient) {
      return;
    }

    this.stompClient.unsubscribe(`/topic/conversation/${conversationId}`);
    this.stompClient.unsubscribe(`/topic/conversation/${conversationId}/typing`);
    this.subscribedConversations.delete(conversationId);
  }

  /**
   * Send message via WebSocket
   */
  sendMessage(request: any): void {
    if (!this.stompClient || !this.stompClient.connected) {
      return;
    }

    this.stompClient.publish({
      destination: '/app/chat.sendMessage',
      body: JSON.stringify(request)
    });
  }

  /**
   * Send typing indicator
   */
  sendTypingIndicator(conversationId: string, isTyping: boolean): void {
    if (!this.stompClient || !this.stompClient.connected) {
      return;
    }

    const typingIndicator = {
      conversationId,
      isTyping,
      timestamp: Date.now()
    };

    this.stompClient.publish({
      destination: '/app/chat.typing',
      body: JSON.stringify(typingIndicator)
    });
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): Observable<boolean> {
    return this.connectionStatus.asObservable();
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.stompClient?.connected || false;
  }

  private subscribeToChannels(): void {
    if (!this.stompClient || !this.stompClient.connected) {
      return;
    }

    // Subscribe to user-specific message notifications
    this.stompClient.subscribe('/user/queue/messages', () => {
      // Message delivery is handled through the conversation subscriptions.
    });
  }

  private getAuthHeaders(): Record<string, string> {
    const token = this.authService.getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /** A refreshed access token requires a fresh STOMP CONNECT frame. */
  private watchTokenForReconnect(): void {
    if (this.tokenSubscription) {
      return;
    }
    this.tokenSubscription = this.authService.accessToken$
      .pipe(
        skip(1),
        filter((token): token is string => !!token),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        if (this.stompClient) {
          this.disconnect();
          this.connect();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.tokenSubscription?.unsubscribe();
    this.disconnect();
  }
}