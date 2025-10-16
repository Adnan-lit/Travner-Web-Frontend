import { Injectable } from '@angular/core';
import { Stomp } from '@stomp/stompjs';
import { Observable, BehaviorSubject, filter } from 'rxjs';
import { retryWhen, tap, delayWhen, switchMap } from 'rxjs/operators';
import { EnvironmentConfig } from '../../../config/environment.config';
import { Message, Conversation } from '../../../models/common.model';

// Dynamically import SockJS to avoid TypeScript issues
let SockJS: any;
import('sockjs-client').then(module => {
    SockJS = module.default;
});

export interface WebSocketMessage {
    type: string;
    payload: any;
    timestamp: string;
}

export interface ChatEvent {
    event: 'message' | 'conversation' | 'typing' | 'read';
    data: any;
}

@Injectable({
    providedIn: 'root'
})
export class WebSocketService {
    private stompClient: any;
    private socket: any;
    private connectionStatus$ = new BehaviorSubject<boolean>(false);
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectInterval = 5000; // 5 seconds
    private messageSubject = new BehaviorSubject<WebSocketMessage | null>(null);

    constructor() {
        this.initWebSocket();
    }

    /**
     * Initialize WebSocket connection
     */
    private initWebSocket(): void {
        const wsUrl = EnvironmentConfig.getWebSocketUrl();
        
        try {
            // Create SockJS connection
            if (typeof SockJS !== 'undefined') {
                this.socket = new SockJS(wsUrl);
            } else {
                console.error('SockJS not loaded yet');
                this.handleReconnection();
                return;
            }
            
            // Create STOMP client over SockJS
            this.stompClient = Stomp.over(this.socket);
            
            // Configure debug logging
            this.stompClient.debug = (str: string) => {
                if (str.includes('Closing connection') || str.includes('Websocket connection closed')) {
                    console.log('🔄 WebSocket reconnecting...');
                } else if (str.includes('Connected to server')) {
                    console.log('✅ WebSocket connection established');
                } else if (str.includes('ERROR')) {
                    console.error('❌ WebSocket error:', str);
                }
            };
            
            // Connect with heartbeat
            this.stompClient.connect(
                {},
                (frame: any) => {
                    console.log('✅ WebSocket connected:', frame);
                    this.connectionStatus$.next(true);
                    this.reconnectAttempts = 0;
                    this.subscribeToMessages();
                },
                (error: any) => {
                    console.error('❌ WebSocket connection error:', error);
                    this.connectionStatus$.next(false);
                    this.handleReconnection();
                }
            );
        } catch (error) {
            console.error('❌ Failed to initialize WebSocket:', error);
            this.handleReconnection();
        }
    }

    /**
     * Subscribe to messages
     */
    private subscribeToMessages(): void {
        if (this.stompClient && this.stompClient.connected) {
            console.log('📡 Subscribing to WebSocket topics...');
            
            // Subscribe to user-specific messages
            this.stompClient.subscribe('/user/queue/messages', (message: any) => {
                try {
                    const parsedMessage = JSON.parse(message.body);
                    console.log('📨 Received message:', parsedMessage);
                    this.messageSubject.next(parsedMessage);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            });

            // Subscribe to conversation updates
            this.stompClient.subscribe('/topic/conversations', (message: any) => {
                try {
                    const parsedMessage = JSON.parse(message.body);
                    console.log('🔄 Conversation update:', parsedMessage);
                    this.messageSubject.next(parsedMessage);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            });
        }
    }

    /**
     * Subscribe to a specific conversation
     */
    subscribeToConversation(conversationId: string): void {
        if (this.stompClient && this.stompClient.connected) {
            const topic = `/topic/conversation/${conversationId}`;
            console.log(`📡 Subscribing to conversation: ${topic}`);
            
            this.stompClient.subscribe(topic, (message: any) => {
                try {
                    const parsedMessage = JSON.parse(message.body);
                    console.log('📨 Received conversation message:', parsedMessage);
                    this.messageSubject.next(parsedMessage);
                } catch (error) {
                    console.error('Error parsing conversation message:', error);
                }
            });
        }
    }

    /**
     * Handle reconnection logic
     */
    private handleReconnection(): void {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔄 Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            setTimeout(() => {
                this.initWebSocket();
            }, this.reconnectInterval);
        } else {
            console.error('❌ Max reconnection attempts reached');
        }
    }

    /**
     * Get connection status
     */
    getConnectionStatus(): Observable<boolean> {
        return this.connectionStatus$.asObservable();
    }

    /**
     * Get incoming messages
     */
    getMessages(): Observable<WebSocketMessage> {
        return this.messageSubject.asObservable().pipe(
            filter((message: WebSocketMessage | null) => message !== null)
        );
    }

    /**
     * Send a message through WebSocket
     */
    sendMessage(type: string, payload: any): void {
        if (this.connectionStatus$.value && this.stompClient && this.stompClient.connected) {
            const message: WebSocketMessage = {
                type,
                payload,
                timestamp: new Date().toISOString()
            };
            
            console.log('📤 Sending message:', message);
            this.stompClient.send('/app/chat.sendMessage', {}, JSON.stringify(message));
        } else {
            console.warn('⚠️ Cannot send message: WebSocket not connected');
            console.log('Connection status:', this.connectionStatus$.value);
            console.log('STOMP client:', this.stompClient);
            console.log('STOMP connected:', this.stompClient?.connected);
        }
    }

    /**
     * Join a conversation
     */
    joinConversation(conversationId: string): void {
        this.sendMessage('join-conversation', { conversationId });
    }

    /**
     * Leave a conversation
     */
    leaveConversation(conversationId: string): void {
        this.sendMessage('leave-conversation', { conversationId });
    }

    /**
     * Send a chat message
     */
    sendChatMessage(conversationId: string, content: string, kind: string = 'TEXT', replyTo?: string): void {
        if (this.connectionStatus$.value && this.stompClient && this.stompClient.connected) {
            const message = {
                type: 'SEND_MESSAGE',
                conversationId,
                content,
                messageType: kind,
                replyToMessageId: replyTo
            };
            
            console.log('📤 Sending chat message:', message);
            this.stompClient.send('/app/chat.sendMessage', {}, JSON.stringify(message));
        } else {
            console.warn('⚠️ Cannot send chat message: WebSocket not connected');
        }
    }

    /**
     * Mark messages as read
     */
    markMessagesAsRead(conversationId: string, lastReadMessageId?: string): void {
        this.sendMessage('mark-read', {
            conversationId,
            lastReadMessageId
        });
    }

    /**
     * Send typing indicator
     */
    sendTypingIndicator(conversationId: string, isTyping: boolean): void {
        if (this.connectionStatus$.value && this.stompClient && this.stompClient.connected) {
            const message = {
                type: 'TYPING',
                conversationId,
                isTyping
            };
            
            console.log('📤 Sending typing indicator:', message);
            this.stompClient.send('/app/chat.typing', {}, JSON.stringify(message));
        } else {
            console.warn('⚠️ Cannot send typing indicator: WebSocket not connected');
        }
    }

    /**
     * Create a new conversation
     */
    createConversation(type: 'DIRECT' | 'GROUP', memberIds: string[], name?: string): void {
        this.sendMessage('create-conversation', {
            type,
            memberIds,
            name
        });
    }

    /**
     * Add members to conversation
     */
    addMembersToConversation(conversationId: string, memberIds: string[]): void {
        this.sendMessage('add-members', {
            conversationId,
            memberIds
        });
    }

    /**
     * Remove members from conversation
     */
    removeMembersFromConversation(conversationId: string, memberIds: string[]): void {
        this.sendMessage('remove-members', {
            conversationId,
            memberIds
        });
    }

    /**
     * Close WebSocket connection
     */
    closeConnection(): void {
        if (this.stompClient) {
            console.log('🔌 Closing WebSocket connection');
            this.stompClient.disconnect(() => {
                console.log('✅ WebSocket connection closed');
            });
            this.connectionStatus$.next(false);
        }
    }

    /**
     * Reconnect WebSocket
     */
    reconnect(): void {
        if (!this.connectionStatus$.value) {
            this.closeConnection();
            this.initWebSocket();
        }
    }
}