import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EnvironmentConfig } from '../../../config/environment.config';
import {
  Conversation,
  Message,
  SendMessageRequest,
  CreateConversationRequest,
  PagedResponse
} from '../../../core/models/chat.models';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly API_URL = `${EnvironmentConfig.getApiBaseUrl()}/chat`;

  constructor(private http: HttpClient) { }

  // Conversation methods
  getConversations(page: number = 0, size: number = 20): Observable<PagedResponse<Conversation>> {
    return this.http.get<PagedResponse<Conversation>>(`${this.API_URL}/conversations`, {
      params: { page: page.toString(), size: size.toString() }
    });
  }

  createConversation(request: CreateConversationRequest): Observable<Conversation> {
    return this.http.post<Conversation>(`${this.API_URL}/conversations`, request);
  }

  getConversation(id: string): Observable<Conversation> {
    return this.http.get<Conversation>(`${this.API_URL}/conversations/${id}`);
  }

  addMembers(conversationId: string, userIds: string[]): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/conversations/${conversationId}/members`, { userIds });
  }

  removeMember(conversationId: string, userId: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/conversations/${conversationId}/members/${userId}`);
  }

  // Message methods
  getMessages(conversationId: string, page: number = 0, size: number = 50): Observable<PagedResponse<Message>> {
    return this.http.get<PagedResponse<Message>>(`${this.API_URL}/conversations/${conversationId}/messages`, {
      params: { page: page.toString(), size: size.toString() }
    });
  }

  sendMessage(request: SendMessageRequest): Observable<Message> {
    return this.http.post<Message>(`${this.API_URL}/messages`, request);
  }

  editMessage(messageId: string, content: string): Observable<Message> {
    return this.http.put<Message>(`${this.API_URL}/messages/${messageId}`, { content });
  }

  deleteMessage(messageId: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/messages/${messageId}`);
  }

  markAsRead(conversationId: string, messageId: string): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/messages/read`, { conversationId, messageId });
  }

  getUnreadCount(conversationId: string): Observable<number> {
    return this.http.get<number>(`${this.API_URL}/conversations/${conversationId}/unread-count`);
  }
}
