import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap, catchError, of } from 'rxjs';
import { ChatMessage, ChatConversation, SendMessageRequest, ConversationWithParticipants } from '../models/chat.model';
import { User } from '../models/common.model';
import { ApiResponse } from '../models/common.model';
import { EnvironmentConfig } from '../config/environment.config';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly API_BASE_URL = EnvironmentConfig.getApiBaseUrl();
  
  // BehaviorSubjects for real-time data
  private conversationsSubject = new BehaviorSubject<ConversationWithParticipants[]>([]);
  private messagesSubject = new BehaviorSubject<Map<string, ChatMessage[]>>(new Map());
  private typingIndicatorsSubject = new BehaviorSubject<Map<string, any>>(new Map());
  
  // Public observables
  public conversations$ = this.conversationsSubject.asObservable();
  public messages$ = this.messagesSubject.asObservable();
  public typingIndicators$ = this.typingIndicatorsSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Get user's conversations
   */
  getConversations(page: number = 0, size: number = 20): Observable<ConversationWithParticipants[]> {
    const endpoint = `${this.API_BASE_URL}/api/chat/conversations`;
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiResponse<any>>(endpoint, { params }).pipe(
      map(response => {
        if (!response.data || !response.data.content) {
          return [];
        }
        return response.data.content.map((conv: any) => {
          // Create proper participant objects with user details
          const participants = conv.participantIds.map((id: string) => ({
            id,
            userName: id, // Will be updated with proper user details
            firstName: 'User',
            lastName: 'Name',
            isOnline: false
          }));
          
          return {
            ...conv,
            participants,
            // For direct conversations, set the title to the other user's name
            title: conv.type === 'DIRECT' ? this.generateDirectConversationTitle(conv.participantIds, conv.title) : conv.title
          };
        });
      }),
      tap(conversations => {
        this.conversationsSubject.next(conversations);
      }),
      catchError(error => {
        console.error('Error fetching conversations:', error);
        return of([]);
      })
    );
  }

  private generateDirectConversationTitle(participantIds: string[], fallbackTitle: string): string {
    // For direct conversations, try to extract username from the title or participant IDs
    if (fallbackTitle && fallbackTitle !== 'Direct Message') {
      // If the title contains a username pattern, extract it
      if (fallbackTitle.includes('@')) {
        return fallbackTitle.split('@')[1] || fallbackTitle;
      }
      return fallbackTitle;
    }
    // If no proper title, return a generic one
    return 'Direct Message';
  }

  /**
   * Get or create direct conversation
   */
  getDirectConversation(otherUserId: string): Observable<ConversationWithParticipants> {
    const endpoint = `${this.API_BASE_URL}/api/chat/conversations/direct/${otherUserId}`;
    
    return this.http.get<ApiResponse<any>>(endpoint).pipe(
      map(response => {
        if (!response.data) {
          throw new Error('No conversation data received');
        }
        return {
          ...response.data,
          participants: response.data.participantIds.map((id: string) => ({ id, username: id })) // Placeholder
        };
      }),
      tap(conversation => {
        const currentConversations = this.conversationsSubject.value;
        const exists = currentConversations.some(conv => conv.id === conversation.id);
        if (!exists) {
          this.conversationsSubject.next([conversation, ...currentConversations]);
        }
      }),
      catchError(error => {
        console.error('Error getting direct conversation:', error);
        throw error;
      })
    );
  }

  /**
   * Get conversation messages
   */
  getMessages(conversationId: string, page: number = 0, size: number = 50): Observable<ChatMessage[]> {
    const endpoint = `${this.API_BASE_URL}/api/chat/conversations/${conversationId}/messages`;
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiResponse<any>>(endpoint, { params }).pipe(
      map(response => {
        if (!response.data || !response.data.content) {
          return [];
        }
        return response.data.content;
      }),
      tap(messages => {
        const currentMessages = this.messagesSubject.value;
        currentMessages.set(conversationId, messages);
        this.messagesSubject.next(new Map(currentMessages));
      }),
      catchError(error => {
        console.error('Error fetching messages:', error);
        return of([]);
      })
    );
  }

  /**
   * Send a message
   */
  sendMessage(request: SendMessageRequest): Observable<ChatMessage> {
    const endpoint = `${this.API_BASE_URL}/api/chat/messages`;
    
    return this.http.post<ApiResponse<ChatMessage>>(endpoint, request).pipe(
      map(response => {
        if (!response.data) {
          throw new Error('No message data received');
        }
        return response.data;
      }),
      tap(message => {
        // Don't add to cache here - let WebSocket handle it to avoid duplicates
        // Just update conversation last message
        const currentConversations = this.conversationsSubject.value;
        const conversation = currentConversations.find(c => c.id === request.conversationId);
        if (conversation) {
          conversation.lastMessage = message.content;
          conversation.lastMessageAt = message.createdAt;
          this.conversationsSubject.next([...currentConversations]);
        }
      }),
      catchError(error => {
        console.error('Error sending message:', error);
        throw error;
      })
    );
  }

  /**
   * Mark messages as read
   */
  markMessagesAsRead(conversationId: string): Observable<void> {
    const endpoint = `${this.API_BASE_URL}/api/chat/conversations/${conversationId}/mark-read`;
    
    return this.http.post<ApiResponse<void>>(endpoint, {}).pipe(
      map(response => void 0),
      catchError(error => {
        console.error('Error marking messages as read:', error);
        return of(void 0);
      })
    );
  }

  /**
   * Get messages from cache
   */
  getMessagesFromCache(conversationId: string): ChatMessage[] {
    return this.messagesSubject.value.get(conversationId) || [];
  }

  /**
   * Add message to cache (for WebSocket updates)
   */
  addMessageToCache(message: ChatMessage): void {
    const currentMessages = this.messagesSubject.value;
    const conversationMessages = currentMessages.get(message.conversationId) || [];
    
    // Check if message already exists to prevent duplicates
    const messageExists = conversationMessages.some(existingMessage => 
      existingMessage.id === message.id || 
      (existingMessage.content === message.content && 
       existingMessage.senderId === message.senderId && 
       Math.abs(new Date(existingMessage.createdAt).getTime() - new Date(message.createdAt).getTime()) < 1000)
    );
    
    if (!messageExists) {
      conversationMessages.push(message);
      // Sort messages by creation time
      conversationMessages.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      currentMessages.set(message.conversationId, conversationMessages);
      this.messagesSubject.next(new Map(currentMessages));
      console.log('Added message to cache:', message.content);
    } else {
      console.log('Message already exists, skipping duplicate:', message.content);
    }
  }

  /**
   * Update typing indicator
   */
  updateTypingIndicator(conversationId: string, userId: string, isTyping: boolean): void {
    const currentIndicators = this.typingIndicatorsSubject.value;
    const conversationIndicators = currentIndicators.get(conversationId) || {};
    conversationIndicators[userId] = { isTyping, timestamp: Date.now() };
    currentIndicators.set(conversationId, conversationIndicators);
    this.typingIndicatorsSubject.next(new Map(currentIndicators));
  }

  /**
   * Upload file for chat
   */
  uploadFile(formData: FormData): Observable<{ fileUrl: string; fileName: string }> {
    const endpoint = `${this.API_BASE_URL}/api/chat/upload`;
    
    return this.http.post<ApiResponse<{ fileUrl: string; fileName: string }>>(endpoint, formData).pipe(
      map(response => {
        if (!response.data) {
          throw new Error('No file data received');
        }
        return response.data;
      }),
      catchError(error => {
        console.error('Error uploading file:', error);
        throw error;
      })
    );
  }
}