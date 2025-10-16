import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EnvironmentConfig } from '../config/environment.config';
import { Conversation, Message } from '../models/common.model';
import { ApiResponse, ApiListResponse } from '../models/api-response.model';

@Injectable({
    providedIn: 'root'
})
export class ChatService {
    private readonly API_BASE_URL = EnvironmentConfig.getApiBaseUrl();

    constructor(private http: HttpClient) { }

    /**
     * Get user's conversations with pagination
     */
    getConversations(page: number = 0, size: number = 20): Observable<ApiListResponse<Conversation>> {
        const endpoint = `${this.API_BASE_URL}/api/chat/conversations`;
        const params = {
            page: page.toString(),
            size: size.toString()
        };
        return this.http.get<ApiListResponse<Conversation>>(endpoint, { params });
    }

    /**
     * Start a new conversation
     */
    startNewConversation(type: 'DIRECT' | 'GROUP', memberIds: string[], name?: string): Observable<ApiResponse<Conversation>> {
        const endpoint = `${this.API_BASE_URL}/api/chat/conversations`;
        const requestBody: any = {
            type,
            memberIds
        };

        if (name) {
            requestBody.name = name;
        }

        return this.http.post<ApiResponse<Conversation>>(endpoint, requestBody);
    }

    /**
     * Get conversation messages with pagination
     */
    getConversationMessages(conversationId: string, page: number = 0, size: number = 20): Observable<ApiListResponse<Message>> {
        const endpoint = `${this.API_BASE_URL}/api/chat/conversations/${conversationId}/messages`;
        const params = {
            page: page.toString(),
            size: size.toString()
        };
        return this.http.get<ApiListResponse<Message>>(endpoint, { params });
    }

    /**
     * Get messages for a conversation (alias for getConversationMessages)
     */
    getMessages(conversationId: string, page: number = 0, size: number = 20): Observable<ApiListResponse<Message>> {
        return this.getConversationMessages(conversationId, page, size);
    }

    /**
     * Send a message to a conversation
     */
    sendMessage(
        conversationId: string,
        content: string,
        kind: string = 'TEXT',
        replyToMessageId?: string,
        attachments?: any[]
    ): Observable<ApiResponse<Message>> {
        const endpoint = `${this.API_BASE_URL}/api/chat/conversations/${conversationId}/messages`;
        const requestBody: any = {
            content,
            kind
        };

        if (replyToMessageId) {
            requestBody.replyToMessageId = replyToMessageId;
        }

        if (attachments && attachments.length > 0) {
            requestBody.attachments = attachments;
        }

        return this.http.post<ApiResponse<Message>>(endpoint, requestBody);
    }

    /**
     * Mark messages as read
     */
    markMessagesAsRead(conversationId: string, lastReadMessageId?: string): Observable<ApiResponse<void>> {
        const endpoint = `${this.API_BASE_URL}/api/chat/conversations/${conversationId}/read`;
        const params: any = {};

        if (lastReadMessageId) {
            params.lastReadMessageId = lastReadMessageId;
        }

        return this.http.put<ApiResponse<void>>(endpoint, null, { params });
    }
}