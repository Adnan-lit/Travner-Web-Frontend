import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BehaviorSubject, Subject, Observable } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { EnvironmentConfig } from '../../../config/environment.config';
import { ChatEvent, SendMessageRequest } from '../../../core/models/chat.models';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private stompClient!: Client;
  private connected$ = new BehaviorSubject<boolean>(false);
  private messageSubject = new Subject<ChatEvent>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(private authService: AuthService) {
    this.initializeWebSocket();
  }

  get isConnected$(): Observable<boolean> {
    return this.connected$.asObservable();
  }

  get messages$(): Observable<ChatEvent> {
    return this.messageSubject.asObservable();
  }

  connect(): Observable<boolean> {
    if (this.stompClient && this.stompClient.connected) {
      return this.connected$.asObservable();
    }

    this.stompClient.activate();
    return this.connected$.asObservable();
  }

  disconnect(): void {
    if (this.stompClient) {
      this.stompClient.deactivate();
    }
  }

  subscribeToConversation(conversationId: string): void {
    if (this.stompClient.connected) {
      this.stompClient.subscribe(`/topic/conversation/${conversationId}`, (message: IMessage) => {
        const chatEvent: ChatEvent = JSON.parse(message.body);
        this.messageSubject.next(chatEvent);
      });
    }
  }

  subscribeToUserEvents(userId: string): void {
    if (this.stompClient.connected) {
      this.stompClient.subscribe(`/user/queue/notifications`, (message: IMessage) => {
        const chatEvent: ChatEvent = JSON.parse(message.body);
        this.messageSubject.next(chatEvent);
      });

      this.stompClient.subscribe(`/user/queue/presence`, (message: IMessage) => {
        const chatEvent: ChatEvent = JSON.parse(message.body);
        this.messageSubject.next(chatEvent);
      });
    }
  }

  sendMessage(message: SendMessageRequest): void {
    if (this.stompClient.connected) {
      this.stompClient.publish({
        destination: '/app/chat.sendMessage',
        body: JSON.stringify(message)
      });
    }
  }

  sendTypingIndicator(conversationId: string, isTyping: boolean): void {
    if (this.stompClient.connected) {
      this.stompClient.publish({
        destination: '/app/chat.typing',
        body: JSON.stringify({ conversationId, isTyping })
      });
    }
  }

  sendPresenceUpdate(status: 'ONLINE' | 'AWAY' | 'OFFLINE'): void {
    if (this.stompClient.connected) {
      this.stompClient.publish({
        destination: '/app/chat.presence',
        body: JSON.stringify({ status })
      });
    }
  }

  sendReadReceipt(conversationId: string, messageId: string): void {
    if (this.stompClient.connected) {
      this.stompClient.publish({
        destination: '/app/chat.messageRead',
        body: JSON.stringify({ conversationId, messageId })
      });
    }
  }

  private initializeWebSocket(): void {
    try {
      this.stompClient = new Client({
        webSocketFactory: () => {
          try {
            return new SockJS(EnvironmentConfig.getWebSocketUrl());
          } catch (error) {
            console.warn('SockJS initialization failed:', error);
            // Return a mock WebSocket for development
            return {
              readyState: WebSocket.CLOSED,
              close: () => { },
              send: () => { },
              addEventListener: () => { },
              removeEventListener: () => { }
            } as any;
          }
        },
        connectHeaders: {
          Authorization: `Bearer ${this.authService.getToken() || ''}`
        },
        debug: (str) => {
          console.log('STOMP Debug:', str);
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000
      });

      this.stompClient.onConnect = (frame) => {
        console.log('Connected to WebSocket:', frame);
        this.connected$.next(true);
        this.reconnectAttempts = 0;
        this.handleConnection();
      };

      this.stompClient.onStompError = (frame) => {
        console.error('STOMP Error:', frame);
        this.connected$.next(false);
      };

      this.stompClient.onWebSocketClose = (event) => {
        console.log('WebSocket Closed:', event);
        this.connected$.next(false);
        this.handleReconnect();
      };

      this.stompClient.onWebSocketError = (error) => {
        console.error('WebSocket Error:', error);
        this.connected$.next(false);
      };
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      this.connected$.next(false);
    }
  }

  private handleConnection(): void {
    // Subscribe to user-specific events
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser.id) {
      this.subscribeToUserEvents(currentUser.id);
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

      setTimeout(() => {
        if (this.authService.isAuthenticated()) {
          this.connect();
        }
      }, Math.pow(2, this.reconnectAttempts) * 1000);
    }
  }
}
