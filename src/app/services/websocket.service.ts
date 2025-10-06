// filepath: src/app/services/websocket.service.ts
import { Injectable, OnDestroy } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { EnvironmentConfig } from '../config/environment.config';
import { CentralizedAuthService } from './centralized-auth.service';

// Updated interfaces to match your backend DTOs
export interface ChatMessage {
    id: string;
    conversationId: string;
    content: string;
    senderId: string;
    senderName: string;
    timestamp: string;
    messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
}

export interface ChatEvent {
    type: 'MESSAGE_SENT' | 'MESSAGE_EDITED' | 'MESSAGE_DELETED' | 'USER_TYPING' |
    'USER_STOPPED_TYPING' | 'USER_JOINED_CONVERSATION' | 'USER_LEFT_CONVERSATION' |
    'CONVERSATION_CREATED' | 'CONVERSATION_UPDATED' | 'USER_ONLINE' | 'USER_OFFLINE' | 'MESSAGE_READ';
    conversationId: string;
    userId: string;
    userName: string;
    data?: any;
    timestamp: string;
}

export interface SendMessageRequest {
    conversationId: string;
    kind: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
    content: string;
    attachments?: any[];
    replyToMessageId?: string;
}

export interface TypingIndicatorRequest {
    conversationId: string;
    isTyping: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class WebSocketService implements OnDestroy {
    private client!: Client;
    private connectedSubject = new BehaviorSubject<boolean>(false);
    private chatEventsSubject = new Subject<ChatEvent>();
    private messagesSubject = new Subject<ChatMessage>();
    private typingSubject = new Subject<ChatEvent>();

    public connected$ = this.connectedSubject.asObservable();
    public chatEvents$ = this.chatEventsSubject.asObservable();
    public messages$ = this.messagesSubject.asObservable();
    public typing$ = this.typingSubject.asObservable();

    private subscribedConversations = new Set<string>();

    constructor(private authService: CentralizedAuthService) {
        this.initializeWebSocket();
    }

    private initializeWebSocket(): void {
        this.client = new Client({
            // Use SockJS-style URL but let STOMP client handle it
            brokerURL: this.getWebSocketUrl(),

            connectHeaders: {
                Authorization: `Bearer ${this.getToken()}`
            },

            debug: (str) => {
                if (localStorage.getItem('travner_debug') === 'true') {
                    console.log('STOMP Debug:', str);
                }
            },

            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        this.client.onConnect = (frame) => {
            console.log('✅ WebSocket Connected to:', this.getWebSocketUrl());
            console.log('Connected frame:', frame);
            this.connectedSubject.next(true);
            this.subscribeToUserChannels();
        };

        this.client.onDisconnect = () => {
            console.log('❌ WebSocket Disconnected');
            this.connectedSubject.next(false);
            this.subscribedConversations.clear();
        };

        this.client.onStompError = (frame) => {
            console.error('❌ WebSocket STOMP Error:', frame);
            console.log('🔧 WebSocket Error Details:', {
                error: frame.headers?.['message'],
                receipt: frame.headers?.['receipt-id'],
                body: frame.body
            });
            this.connectedSubject.next(false);
        };

        this.client.onWebSocketError = (error) => {
            console.error('❌ WebSocket Connection Error:', error);
            console.log('🔧 This is normal if backend WebSocket is not configured yet');
            this.connectedSubject.next(false);
        };
    }

    private getWebSocketUrl(): string {
        const baseUrl = EnvironmentConfig.getApiBaseUrl();

        if (baseUrl === '' || baseUrl === '/api') {
            // In development with proxy - connect directly to backend
            return 'ws://localhost:8080/ws';
        }

        // In production - convert HTTP/HTTPS to WS/WSS
        const wsUrl = baseUrl.replace('https://', 'wss://').replace('http://', 'ws://') + '/ws';
        return wsUrl;
    } private getToken(): string | null {
        try {
            const authData = localStorage.getItem('travner_auth');
            if (authData) {
                const parsed = JSON.parse(authData);
                if (parsed.username && parsed.password) {
                    return btoa(`${parsed.username}:${parsed.password}`);
                }
                return parsed.authToken || null;
            }
        } catch (e) {
            console.error('Error getting auth token:', e);
        }
        return null;
    }

    connect(): void {
        if (!this.client.connected) {
            this.client.activate();
        }
    }

    disconnect(): void {
        if (this.client.connected) {
            this.client.deactivate();
        }
    }

    private subscribeToUserChannels(): void {
        const currentUser = this.authService.getCurrentUser();
        if (!currentUser) return;

        const userName = currentUser.userName;

        // Subscribe to user-specific notifications
        this.client.subscribe(`/user/${userName}/queue/notifications`,
            (message: IMessage) => {
                const event: ChatEvent = JSON.parse(message.body);
                this.chatEventsSubject.next(event);
            }
        );

        // Subscribe to user-specific presence updates
        this.client.subscribe(`/user/${userName}/queue/presence`,
            (message: IMessage) => {
                const event: ChatEvent = JSON.parse(message.body);
                this.chatEventsSubject.next(event);
            }
        );
    }

    subscribeToConversation(conversationId: string): void {
        if (!this.client.connected || this.subscribedConversations.has(conversationId)) {
            return;
        }

        console.log(`🔔 Subscribing to conversation: ${conversationId}`);

        this.client.subscribe(`/topic/conversation/${conversationId}`,
            (message: IMessage) => {
                const event: ChatEvent = JSON.parse(message.body);
                console.log('📨 Received chat event:', event);

                // Handle different event types
                if (event.type === 'MESSAGE_SENT') {
                    // Extract message from event data if needed
                    this.chatEventsSubject.next(event);
                } else if (event.type === 'USER_TYPING' || event.type === 'USER_STOPPED_TYPING') {
                    this.typingSubject.next(event);
                } else {
                    this.chatEventsSubject.next(event);
                }
            }
        );

        this.subscribedConversations.add(conversationId);
    }

    unsubscribeFromConversation(conversationId: string): void {
        if (this.subscribedConversations.has(conversationId)) {
            // Note: @stomp/stompjs doesn't have a direct unsubscribe by destination
            // In practice, this is handled when the connection is closed
            this.subscribedConversations.delete(conversationId);
        }
    }

    sendMessage(messageRequest: SendMessageRequest): void {
        if (!this.client.connected) {
            console.error('WebSocket not connected');
            return;
        }

        console.log('📤 Sending message via WebSocket:', messageRequest);

        this.client.publish({
            destination: '/app/chat.sendMessage',
            body: JSON.stringify(messageRequest)
        });
    }

    sendTypingIndicator(typingRequest: TypingIndicatorRequest): void {
        if (!this.client.connected) return;

        console.log('⌨️ Sending typing indicator:', typingRequest);

        this.client.publish({
            destination: '/app/chat.typing',
            body: JSON.stringify(typingRequest)
        });
    }

    sendPresenceUpdate(status: 'USER_ONLINE' | 'USER_OFFLINE'): void {
        if (!this.client.connected) return;

        const event: Partial<ChatEvent> = {
            type: status,
            timestamp: new Date().toISOString()
        };

        this.client.publish({
            destination: '/app/chat.presence',
            body: JSON.stringify(event)
        });
    }

    markMessageAsRead(conversationId: string, messageId: string): void {
        if (!this.client.connected) return;

        const event: Partial<ChatEvent> = {
            type: 'MESSAGE_READ',
            conversationId,
            data: { messageId },
            timestamp: new Date().toISOString()
        };

        this.client.publish({
            destination: '/app/chat.messageRead',
            body: JSON.stringify(event)
        });
    }

    ngOnDestroy(): void {
        this.disconnect();
    }
}