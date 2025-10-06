import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { EnvironmentConfig } from '../config/environment.config';
import { CentralizedAuthService } from './centralized-auth.service';
import { TravnerApiService } from './travner-api-v2.service';
import {
    ChatConversation, ChatMessage, ChatMessageCreate,
    ChatTypingIndicator, WebSocketMessage, ChatUser
} from '../models/chat.models';
import { ApiResponse } from '../models/api-response.model';

/**
 * Real-time Chat Service for Travner
 * Implements WebSocket communication according to API specification
 */
@Injectable({
    providedIn: 'root'
})
export class ChatRealtimeService {
    private socket$: WebSocketSubject<any> | null = null;
    private messagesSubject$ = new Subject<ChatMessage>();
    private typingSubject$ = new Subject<{ conversationId: string, userId: string, isTyping: boolean }>();
    private connectionStatus$ = new BehaviorSubject<boolean>(false);

    // Public observables
    public messages$ = this.messagesSubject$.asObservable();
    public typing$ = this.typingSubject$.asObservable();
    public connected$ = this.connectionStatus$.asObservable();

    private currentConversations: ChatConversation[] = [];
    private typingTimeouts: Map<string, any> = new Map();

    constructor(
        private authService: CentralizedAuthService,
        private apiService: TravnerApiService
    ) {
        // Auto-connect when user is authenticated
        this.authService.currentUser$.subscribe(user => {
            if (user) {
                this.connect();
            } else {
                this.disconnect();
            }
        });
    }

    /**
     * Connect to WebSocket server
     */
    connect(): void {
        if (this.socket$ || !this.authService.isAuthenticated()) {
            return;
        }

        // Get current user to extract credentials
        const currentUser = this.authService.getCurrentUser();
        if (!currentUser) {
            console.error('No authenticated user available for WebSocket connection');
            return;
        }

        // For WebSocket auth, we need to use stored credentials
        // This is a simplified approach - in production, consider using JWT tokens
        const storedCredentials = this.getStoredCredentials();
        if (!storedCredentials) {
            console.error('No stored credentials available for WebSocket connection');
            return;
        }

        // Create WebSocket URL with authentication
        const wsUrl = EnvironmentConfig.getWebSocketUrl();
        const authHeader = btoa(`${storedCredentials.username}:${storedCredentials.password}`);

        try {
            this.socket$ = webSocket({
                url: wsUrl,
                protocol: ['Authorization', `Basic ${authHeader}`],
                openObserver: {
                    next: () => {
                        console.log('WebSocket connected');
                        this.connectionStatus$.next(true);
                        this.subscribeToTopics();
                    }
                },
                closeObserver: {
                    next: () => {
                        console.log('WebSocket disconnected');
                        this.connectionStatus$.next(false);
                    }
                }
            });

            // Subscribe to WebSocket messages
            this.socket$.subscribe({
                next: (message) => this.handleWebSocketMessage(message),
                error: (error) => {
                    console.error('WebSocket error:', error);
                    this.connectionStatus$.next(false);
                    this.reconnect();
                },
                complete: () => {
                    console.log('WebSocket connection completed');
                    this.connectionStatus$.next(false);
                }
            });

        } catch (error) {
            console.error('Failed to connect to WebSocket:', error);
        }
    }

    /**
     * Get stored credentials (private helper method)
     * This is a workaround - in production, consider using JWT tokens for WebSocket auth
     */
    private getStoredCredentials(): { username: string; password: string } | null {
        // Try to get from session storage (temporary approach)
        const username = sessionStorage.getItem('current_username');
        const password = sessionStorage.getItem('current_password');

        if (username && password) {
            return { username, password };
        }

        // If not found, we need to inform the user to re-login for real-time features
        console.warn('Credentials not available for WebSocket. User may need to re-login for real-time features.');
        return null;
    }

    /**
     * Disconnect from WebSocket
     */
    disconnect(): void {
        if (this.socket$) {
            this.socket$.complete();
            this.socket$ = null;
            this.connectionStatus$.next(false);
        }
    }

    /**
     * Reconnect to WebSocket after delay
     */
    private reconnect(): void {
        setTimeout(() => {
            if (this.authService.isAuthenticated()) {
                this.connect();
            }
        }, 3000);
    }

    /**
     * Subscribe to conversation topics and user notifications
     */
    private subscribeToTopics(): void {
        if (!this.socket$) return;

        // Subscribe to user's personal notification queue
        this.socket$.next({
            type: 'SUBSCRIBE',
            destination: '/user/queue/notifications'
        });

        // Subscribe to conversation topics for active conversations
        this.currentConversations.forEach(conversation => {
            this.subscribeToConversation(conversation.id);
        });
    }

    /**
     * Subscribe to a specific conversation topic
     */
    subscribeToConversation(conversationId: string): void {
        if (!this.socket$) return;

        this.socket$.next({
            type: 'SUBSCRIBE',
            destination: `/topic/conversation/${conversationId}`
        });
    }

    /**
     * Unsubscribe from a conversation topic
     */
    unsubscribeFromConversation(conversationId: string): void {
        if (!this.socket$) return;

        this.socket$.next({
            type: 'UNSUBSCRIBE',
            destination: `/topic/conversation/${conversationId}`
        });
    }

    /**
     * Handle incoming WebSocket messages
     */
    private handleWebSocketMessage(message: any): void {
        switch (message.type) {
            case 'MESSAGE_RECEIVED':
                if (message.message) {
                    this.messagesSubject$.next(message.message as ChatMessage);
                }
                break;

            case 'TYPING_STATUS':
                if (message.conversationId && message.userId !== undefined) {
                    this.typingSubject$.next({
                        conversationId: message.conversationId,
                        userId: message.userId,
                        isTyping: message.isTyping || false
                    });
                }
                break;

            case 'NOTIFICATION':
                // Handle other notifications (like new conversation invites)
                console.log('Received notification:', message);
                break;

            default:
                console.log('Unknown WebSocket message type:', message);
        }
    }

    /**
     * Send a message via WebSocket
     */
    sendMessage(messageData: {
        conversationId: string;
        content: string;
        kind?: 'TEXT' | 'IMAGE' | 'FILE';
        replyToMessageId?: string;
    }): void {
        if (!this.socket$ || !this.connectionStatus$.value) {
            console.error('WebSocket not connected');
            return;
        }

        const wsMessage: WebSocketMessage = {
            type: 'SEND_MESSAGE',
            conversationId: messageData.conversationId,
            content: messageData.content,
            kind: messageData.kind || 'TEXT'
        };

        this.socket$.next(wsMessage);
    }

    /**
     * Send typing indicator
     */
    sendTypingIndicator(conversationId: string, isTyping: boolean): void {
        if (!this.socket$ || !this.connectionStatus$.value) {
            return;
        }

        // Clear existing timeout for this conversation
        const existingTimeout = this.typingTimeouts.get(conversationId);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
            this.typingTimeouts.delete(conversationId);
        }

        // Send typing indicator
        const wsMessage: WebSocketMessage = {
            type: 'TYPING',
            conversationId,
            isTyping
        };

        this.socket$.next(wsMessage);

        // Auto-stop typing after 2 seconds if still typing
        if (isTyping) {
            const timeout = setTimeout(() => {
                this.sendTypingIndicator(conversationId, false);
            }, 2000);
            this.typingTimeouts.set(conversationId, timeout);
        }
    }

    /**
     * Load conversations and subscribe to them
     */
    loadConversations(): Observable<ApiResponse<ChatConversation[]>> {
        return new Observable(observer => {
            this.apiService.getConversations({ page: 0, size: 20 }).subscribe({
                next: (response) => {
                    if (response.success && response.data) {
                        this.currentConversations = response.data;

                        // Subscribe to each conversation for real-time updates
                        this.currentConversations.forEach(conversation => {
                            this.subscribeToConversation(conversation.id);
                        });
                    }
                    observer.next(response);
                },
                error: (error) => observer.error(error),
                complete: () => observer.complete()
            });
        });
    }

    /**
     * Create or get direct conversation with a user
     */
    createDirectConversation(otherUsername: string): Observable<ApiResponse<ChatConversation>> {
        return new Observable(observer => {
            this.apiService.createConversation([otherUsername]).subscribe({
                next: (response) => {
                    if (response.success && response.data) {
                        // Subscribe to the new conversation
                        this.subscribeToConversation(response.data.id);

                        // Add to current conversations if not already there
                        const exists = this.currentConversations.find(c => c.id === response.data!.id);
                        if (!exists) {
                            this.currentConversations.push(response.data);
                        }
                    }
                    observer.next(response);
                },
                error: (error) => observer.error(error),
                complete: () => observer.complete()
            });
        });
    }

    /**
     * Get messages for a conversation
     */
    getMessages(conversationId: string, page: number = 0, size: number = 50): Observable<ApiResponse<ChatMessage[]>> {
        return this.apiService.getMessages(conversationId, { page, size });
    }

    /**
     * Mark messages as read
     */
    markAsRead(conversationId: string, lastReadMessageId: string): Observable<ApiResponse<any>> {
        return this.apiService.markAsRead({ conversationId, lastReadMessageId });
    }

    /**
     * Get unread count for a conversation
     */
    getUnreadCount(conversationId: string): Observable<ApiResponse<{ count: number }>> {
        return this.apiService.getUnreadCount(conversationId);
    }

    /**
     * Edit a message
     */
    editMessage(messageId: string, content: string): Observable<ApiResponse<ChatMessage>> {
        return this.apiService.editMessage(messageId, content);
    }

    /**
     * Delete a message
     */
    deleteMessage(messageId: string): Observable<ApiResponse<any>> {
        return this.apiService.deleteMessage(messageId);
    }

    /**
     * Check if WebSocket is connected
     */
    isConnected(): boolean {
        return this.connectionStatus$.value;
    }

    /**
     * Get current conversations
     */
    getCurrentConversations(): ChatConversation[] {
        return [...this.currentConversations];
    }

    /**
     * Clean up on service destruction
     */
    ngOnDestroy(): void {
        this.disconnect();
        this.typingTimeouts.forEach(timeout => clearTimeout(timeout));
        this.typingTimeouts.clear();
    }
}