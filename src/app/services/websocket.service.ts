// Global polyfill removed - no longer needed

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Client, IMessage, StompConfig } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { EnvironmentConfig } from '../config/environment.config';
import { Message, Conversation } from '../models/common.model';

export interface WebSocketMessage {
  type: 'SEND_MESSAGE' | 'TYPING' | 'READ_RECEIPT' | 'USER_JOINED' | 'USER_LEFT';
  conversationId: string;
  content?: string;
  messageType?: 'TEXT' | 'IMAGE' | 'FILE';
  replyToMessageId?: string;
  isTyping?: boolean;
  messageId?: string;
  userId?: string;
  username?: string;
}

export interface TypingIndicator {
  conversationId: string;
  userId: string;
  username: string;
  isTyping: boolean;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private stompClient: Client | null = null;
  private isConnected = false;
  private connectionSubject = new BehaviorSubject<boolean>(false);
  private messageSubject = new Subject<Message>();
  private typingSubject = new Subject<TypingIndicator>();
  private connectionStatusSubject = new BehaviorSubject<string>('disconnected');

  // Observable streams
  public connection$ = this.connectionSubject.asObservable();
  public isConnected$ = this.connectionSubject.asObservable(); // Alias for compatibility
  public messages$ = this.messageSubject.asObservable();
  public typing$ = this.typingSubject.asObservable();
  public connectionStatus$ = this.connectionStatusSubject.asObservable();

  constructor() { }

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (this.isConnected) {
        resolve(true);
        return;
      }

      try {
        const wsUrl = EnvironmentConfig.getWebSocketUrl();
        console.log('🔌 Connecting to WebSocket:', wsUrl);

        const socket = new SockJS(wsUrl);
        this.stompClient = new Client({
          webSocketFactory: () => socket as any,
          debug: (str) => {
            if (EnvironmentConfig.isDevelopment()) {
              console.log('🔌 STOMP Debug:', str);
            }
          },
          reconnectDelay: 5000,
          heartbeatIncoming: 4000,
          heartbeatOutgoing: 4000,
          onConnect: (frame) => {
            console.log('✅ WebSocket connected:', frame);
            this.isConnected = true;
            this.connectionSubject.next(true);
            this.connectionStatusSubject.next('connected');
            this.setupSubscriptions();
            resolve(true);
          },
          onStompError: (frame) => {
            console.error('❌ STOMP error:', frame);
            this.connectionStatusSubject.next('error');
            reject(new Error('WebSocket connection failed'));
          },
          onWebSocketClose: (event) => {
            console.log('🔌 WebSocket closed:', event);
            this.isConnected = false;
            this.connectionSubject.next(false);
            this.connectionStatusSubject.next('disconnected');
          },
          onWebSocketError: (error) => {
            console.error('❌ WebSocket error:', error);
            this.connectionStatusSubject.next('error');
          }
        });

        this.stompClient.activate();
      } catch (error) {
        console.error('❌ Failed to create WebSocket connection:', error);
        this.connectionStatusSubject.next('error');
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.stompClient && this.isConnected) {
      console.log('🔌 Disconnecting from WebSocket');
      this.stompClient.deactivate();
      this.isConnected = false;
      this.connectionSubject.next(false);
      this.connectionStatusSubject.next('disconnected');
    }
  }

  /**
   * Send a message to a conversation
   */
  sendMessage(conversationId: string, content: string, messageType: 'TEXT' | 'IMAGE' | 'FILE' = 'TEXT', replyToMessageId?: string): void {
    if (!this.isConnected || !this.stompClient) {
      console.error('❌ WebSocket not connected');
      return;
    }

    const message: WebSocketMessage = {
      type: 'SEND_MESSAGE',
      conversationId,
      content,
      messageType
    };

    if (replyToMessageId) {
      message.replyToMessageId = replyToMessageId;
    }

    this.stompClient.publish({
      destination: '/app/chat.send',
      body: JSON.stringify(message)
    });

    console.log('📤 Message sent:', message);
  }

  /**
   * Send typing indicator
   */
  sendTypingIndicator(conversationId: string, isTyping: boolean): void {
    if (!this.isConnected || !this.stompClient) {
      return;
    }

    const message: WebSocketMessage = {
      type: 'TYPING',
      conversationId,
      isTyping
    };

    this.stompClient.publish({
      destination: '/app/chat.typing',
      body: JSON.stringify(message)
    });
  }

  /**
   * Send read receipt
   */
  sendReadReceipt(conversationId: string, messageId: string): void {
    if (!this.isConnected || !this.stompClient) {
      return;
    }

    const message: WebSocketMessage = {
      type: 'READ_RECEIPT',
      conversationId,
      messageId
    };

    this.stompClient.publish({
      destination: '/app/chat.read',
      body: JSON.stringify(message)
    });
  }

  /**
   * Subscribe to conversation messages
   */
  subscribeToConversation(conversationId: string): void {
    if (!this.isConnected || !this.stompClient) {
      console.error('❌ WebSocket not connected');
      return;
    }

    const subscription = this.stompClient.subscribe(
      `/topic/conversation/${conversationId}`,
      (message: IMessage) => {
        try {
          const data = JSON.parse(message.body);
          console.log('📨 Received message:', data);
          this.messageSubject.next(data);
        } catch (error) {
          console.error('❌ Error parsing message:', error);
        }
      }
    );

    console.log(`📡 Subscribed to conversation ${conversationId}`);
  }

  /**
   * Subscribe to typing indicators for a conversation
   */
  subscribeToTyping(conversationId: string): void {
    if (!this.isConnected || !this.stompClient) {
      console.error('❌ WebSocket not connected');
      return;
    }

    const subscription = this.stompClient.subscribe(
      `/topic/conversation/${conversationId}/typing`,
      (message: IMessage) => {
        try {
          const data = JSON.parse(message.body);
          console.log('⌨️ Received typing indicator:', data);
          this.typingSubject.next(data);
        } catch (error) {
          console.error('❌ Error parsing typing indicator:', error);
        }
      }
    );

    console.log(`⌨️ Subscribed to typing indicators for conversation ${conversationId}`);
  }

  /**
   * Subscribe to user-specific messages
   */
  subscribeToUserMessages(): void {
    if (!this.isConnected || !this.stompClient) {
      console.error('❌ WebSocket not connected');
      return;
    }

    const subscription = this.stompClient.subscribe(
      '/user/queue/messages',
      (message: IMessage) => {
        try {
          const data = JSON.parse(message.body);
          console.log('📨 Received user message:', data);
          this.messageSubject.next(data);
        } catch (error) {
          console.error('❌ Error parsing user message:', error);
        }
      }
    );

    console.log('📡 Subscribed to user messages');
  }

  /**
   * Subscribe to user-specific notifications
   */
  subscribeToNotifications(): void {
    if (!this.isConnected || !this.stompClient) {
      console.error('❌ WebSocket not connected');
      return;
    }

    const subscription = this.stompClient.subscribe(
      '/user/queue/notifications',
      (message: IMessage) => {
        try {
          const data = JSON.parse(message.body);
          console.log('🔔 Received notification:', data);
          // Handle notifications here
        } catch (error) {
          console.error('❌ Error parsing notification:', error);
        }
      }
    );

    console.log('📡 Subscribed to notifications');
  }

  /**
   * Setup default subscriptions
   */
  private setupSubscriptions(): void {
    this.subscribeToUserMessages();
    this.subscribeToNotifications();
  }

  /**
   * Check if WebSocket is connected
   */
  isWebSocketConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): string {
    return this.connectionStatusSubject.value;
  }

  /**
   * Reconnect to WebSocket
   */
  reconnect(): Promise<boolean> {
    console.log('🔄 Attempting to reconnect WebSocket...');
    this.disconnect();
    return this.connect();
  }

  /**
   * Send heartbeat to keep connection alive
   */
  sendHeartbeat(): void {
    if (this.isConnected && this.stompClient) {
      // STOMP automatically handles heartbeats
      console.log('💓 Heartbeat sent');
    }
  }

  /**
   * Get connection statistics
   */
  getConnectionStats(): {
    isConnected: boolean;
    status: string;
    uptime: number;
  } {
    return {
      isConnected: this.isConnected,
      status: this.connectionStatusSubject.value,
      uptime: this.isConnected ? Date.now() : 0
    };
  }
}

