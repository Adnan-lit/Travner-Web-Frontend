import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Client, IMessage, StompConfig } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { EnvironmentConfig } from '../config/environment.config';
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
  
  private readonly API_BASE_URL = EnvironmentConfig.getApiBaseUrl();
  private readonly WS_URL = `${this.API_BASE_URL}/ws`;

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

    try {
      const socket = new SockJS(this.WS_URL);
      this.stompClient = new Client({
        webSocketFactory: () => socket,
        debug: (str) => console.log('WebSocket Debug:', str),
        connectHeaders: this.getAuthHeaders(),
      });

      this.stompClient.onConnect = (frame) => {
        console.log('WebSocket Connected:', frame);
        this.connectionStatus.next(true);
        this.subscribeToChannels();
      };

      this.stompClient.onStompError = (frame) => {
        console.error('WebSocket STOMP Error:', frame);
        this.connectionStatus.next(false);
      };

      this.stompClient.onWebSocketError = (error) => {
        console.error('WebSocket Error:', error);
        this.connectionStatus.next(false);
      };

      this.stompClient.onWebSocketClose = (event) => {
        console.log('WebSocket Closed:', event);
        this.connectionStatus.next(false);
      };

      this.stompClient.activate();
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
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
      console.warn('WebSocket not connected');
      return;
    }

    if (this.subscribedConversations.has(conversationId)) {
      return;
    }

    // Subscribe to conversation messages
    this.stompClient.subscribe(`/topic/conversation/${conversationId}`, (message: IMessage) => {
      const chatMessage: ChatMessage = JSON.parse(message.body);
      console.log('WebSocket received message:', chatMessage);
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
      console.warn('WebSocket not connected');
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
    this.stompClient.subscribe('/user/queue/messages', (message: IMessage) => {
      console.log('Received user-specific message:', message.body);
    });
  }

  private getAuthHeaders(): any {
    const authData = this.authService.getAuthData();
    if (authData && authData.username && authData.password) {
      return {
        Authorization: `Basic ${btoa(`${authData.username}:${authData.password}`)}`
      };
    }
    return {};
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.disconnect();
  }
}