import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of, throwError, BehaviorSubject, combineLatest } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { EnvironmentConfig } from '../config/environment.config';
import { BackendStatusService } from './backend-status.service';

// Updated interfaces to match your fresh implementation
export interface Conversation {
    id: string;
    type: 'DIRECT' | 'GROUP';
    title?: string;
    members: ConversationMember[];
    ownerId?: string;
    adminIds: string[];
    createdAt: string;
    lastMessageAt: string;
    unreadCount: number;
    archived: boolean;
}

export interface ConversationMember {
    userId: string;
    userName: string;
    firstName?: string;
    lastName?: string;
    role: 'OWNER' | 'ADMIN' | 'MEMBER';
    lastReadAt: string;
    muted: boolean;
    joinedAt: string;
}

export interface Message {
    id: string;
    conversationId: string;
    content: string;
    senderId: string;
    senderName: string;
    timestamp: string;
    messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
    edited: boolean;
    editedAt?: string;
}

// Legacy interfaces for backward compatibility
export interface ChatConversationSummary extends Conversation { }
export interface ChatConversation extends Conversation { }
export interface ChatMessage extends Message {
    kind: string;
    createdAt: string;
    attachments?: Array<{
        id?: string;
        filename?: string;
        url?: string;
        contentType?: string;
        size?: number;
        caption?: string;
        mediaId?: string;  // client-side send payload property
    }>;
    readBy?: string[]; // Always empty currently
    readCount?: number; // Always 0 currently
}

export interface PagedResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}

export interface SendMessageRequest {
    conversationId: string;
    content: string;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
    // Base URL (may be overridden via localStorage 'travner_backend_override')
    private readonly API_BASE_URL = this.computeBaseUrl();
    // Root for chat endpoints (/api/chat/**). We attempt to normalize so there is exactly one '/api' segment.
    private readonly CHAT_ROOT = this.computeChatRoot(this.API_BASE_URL);

    // State management for reactive chat
    private conversationsSubject = new BehaviorSubject<Conversation[]>([]);
    private messagesSubject = new BehaviorSubject<Message[]>([]);
    private activeConversationSubject = new BehaviorSubject<Conversation | null>(null);

    public conversations$ = this.conversationsSubject.asObservable();
    public messages$ = this.messagesSubject.asObservable();
    public activeConversation$ = this.activeConversationSubject.asObservable();

    constructor(private http: HttpClient, private backendStatus: BackendStatusService) {
        if (localStorage.getItem('travner_debug') === 'true') {
            console.log('[ChatService] Initialized', {
                apiBase: this.API_BASE_URL,
                chatRoot: this.CHAT_ROOT,
                override: localStorage.getItem('travner_backend_override') || null
            });
        }
    }

    // ---- Base / Root Computation ----
    private computeBaseUrl(): string {
        try {
            const override = localStorage.getItem('travner_backend_override');
            if (override) {
                const cleaned = this.normalize(override);
                // If override already ends with /api keep it, else append /api because backend mappings include it
                return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
            }
        } catch { }
        return this.normalize(EnvironmentConfig.getApiBaseUrl());
    }

    private computeChatRoot(base: string): string {
        // Cases:
        // 1) base ends with /api  -> /api/chat
        // 2) base already contains /api/chat -> keep as is (avoid double)
        // 3) base missing /api -> append /api/chat
        const noTrail = this.normalize(base);
        if (/\/api\/chat$/.test(noTrail)) return noTrail; // already full path
        if (noTrail.endsWith('/api')) return `${noTrail}/chat`;
        if (noTrail.includes('/api/')) return `${noTrail}/chat`; // base has /api somewhere but not /chat yet
        if (noTrail.endsWith('/chat')) return noTrail; // unexpected but accept
        return `${noTrail}/api/chat`;
    }

    // ---- Helpers ----

    private normalize(url: string) { return url.replace(/\/$/, ''); }

    // Interceptor injects Authorization; no per-call headers needed

    private unwrap<T>(resp: any, fallbackEmpty: T): T {
        if (resp && resp.success && resp.data) return resp.data as T;
        return resp as T ?? fallbackEmpty;
    }

    private unwrapPaged<T>(resp: any): PagedResponse<T> {
        // Wrapper { success, data: { content: [...], pageable: { pageNumber, pageSize }, totalElements } }
        if (resp && resp.success && resp.data) {
            const data = resp.data;
            if (Array.isArray(data.content)) {
                const pageable = data.pageable || {};
                return {
                    content: data.content,
                    totalElements: data.totalElements || data.total_elements || data.content.length,
                    totalPages: data.totalPages || data.total_pages || (data.totalElements && pageable.pageSize ? Math.ceil(data.totalElements / pageable.pageSize) : 1),
                    size: data.size || data.pageSize || pageable.pageSize || data.content.length,
                    number: data.number || data.page || pageable.pageNumber || 0
                };
            }
            if (Array.isArray(data)) {
                return { content: data, totalElements: data.length, totalPages: 1, size: data.length, number: 0 };
            }
        }
        if (resp && Array.isArray(resp.content)) {
            return resp as PagedResponse<T>;
        }
        if (Array.isArray(resp)) {
            return { content: resp, totalElements: resp.length, totalPages: 1, size: resp.length, number: 0 };
        }
        return { content: [], totalElements: 0, totalPages: 0, size: 0, number: 0 };
    }

    // ---- Conversations ----
    getConversations(page = 0, size = 20): Observable<PagedResponse<ChatConversationSummary>> {
        const params = new HttpParams().set('page', page).set('size', size);
        const url = `${this.CHAT_ROOT}/conversations`;
        return this.http.get(url, { params, observe: 'response' }).pipe(
            map(resp => {
                const raw = resp.body;
                const status = resp.status;

                // If response is already an object (normal case), use it directly
                if (typeof raw === 'object' && raw !== null) {
                    this.backendStatus.reportSuccess('chat.conversations');
                    return this.unwrapPaged<ChatConversationSummary>(raw);
                }

                // If response is a string, try to parse it
                const rawString = String(raw || '');
                const lowered = rawString.trim().toLowerCase();

                if (lowered.startsWith('<!doctype html') || lowered.startsWith('<html')) {
                    this.backendStatus.reportHtmlFallback('chat.conversations');
                    return { content: [], totalElements: 0, totalPages: 0, size, number: page };
                }

                try {
                    const parsed = JSON.parse(rawString);
                    this.backendStatus.reportSuccess('chat.conversations');
                    return this.unwrapPaged<ChatConversationSummary>(parsed);
                } catch (e) {
                    console.warn('[ChatService] Failed to parse conversations JSON', e, { status, snippet: rawString.slice(0, 120) });
                    this.backendStatus.reportHtmlFallback('chat.conversations.parse');
                    return { content: [], totalElements: 0, totalPages: 0, size, number: page };
                }
            }),
            catchError(err => {
                console.error('[ChatService] Conversations request failed', err, { url });
                this.backendStatus.reportHtmlFallback('chat.conversations.transport');
                return of({ content: [], totalElements: 0, totalPages: 0, size, number: page });
            })
        );
    }

    getConversation(id: string): Observable<ChatConversation> {
        return this.http.get<any>(`${this.CHAT_ROOT}/conversations/${id}`)
            .pipe(map(r => this.unwrap<ChatConversation>(r, {} as any)));
    }

    getOrCreateDirect(otherUserId: string): Observable<ChatConversation> {
        return this.http.get<any>(`${this.CHAT_ROOT}/conversations/direct/${otherUserId}`)
            .pipe(map(r => this.unwrap<ChatConversation>(r, {} as any)));
    }

    createDirect(memberId: string): Observable<ChatConversation> {
        return this.http.post<any>(`${this.CHAT_ROOT}/conversations`, { type: 'DIRECT', memberIds: [memberId] })
            .pipe(map(r => this.unwrap<ChatConversation>(r, {} as any)));
    }

    // ---- Messages ----
    getMessages(conversationId: string, page = 0, size = 50): Observable<PagedResponse<ChatMessage>> {
        const params = new HttpParams().set('page', page).set('size', size);
        const url = `${this.CHAT_ROOT}/conversations/${conversationId}/messages`;
        return this.http.get(url, { params, responseType: 'text' }).pipe(
            map(raw => {
                const lowered = raw.trim().toLowerCase();
                if (lowered.startsWith('<!doctype html') || lowered.startsWith('<html')) {
                    console.warn('[ChatService] HTML received instead of JSON for messages. Backend likely down or proxy misroute.', { url });
                    this.backendStatus.reportHtmlFallback('chat.messages');
                    return { content: [], totalElements: 0, totalPages: 0, size, number: page };
                }
                try {
                    const parsed = JSON.parse(raw);
                    this.backendStatus.reportSuccess('chat.messages');
                    return this.unwrapPaged<ChatMessage>(parsed);
                } catch (e) {
                    console.warn('[ChatService] Failed to parse messages JSON', e);
                    this.backendStatus.reportHtmlFallback('chat.messages.parse');
                    return { content: [], totalElements: 0, totalPages: 0, size, number: page };
                }
            }),
            catchError(err => {
                console.error('[ChatService] Messages request failed', err);
                this.backendStatus.reportHtmlFallback('chat.messages.transport');
                return of({ content: [], totalElements: 0, totalPages: 0, size, number: page });
            })
        );
    }

    sendMessage(payload: { conversationId: string; content: string; kind?: string; attachments?: any[]; replyToMessageId?: string }): Observable<ChatMessage> {
        return this.http.post<any>(`${this.CHAT_ROOT}/messages`, payload)
            .pipe(map(r => this.unwrap<ChatMessage>(r, {} as any)));
    }

    editMessage(messageId: string, content: string): Observable<ChatMessage> {
        // Current backend expects query param ?content=... (JSON body planned for future)
        const url = `${this.CHAT_ROOT}/messages/${encodeURIComponent(messageId)}?content=${encodeURIComponent(content)}`;
        return this.http.put<any>(url, null)
            .pipe(map(r => this.unwrap<ChatMessage>(r, {} as any)));
    }

    deleteMessage(messageId: string): Observable<void> {
        return this.http.delete<any>(`${this.CHAT_ROOT}/messages/${messageId}`)
            .pipe(map(() => void 0));
    }

    markRead(conversationId: string, lastReadMessageId: string): Observable<any> {
        return this.http.post<any>(`${this.CHAT_ROOT}/messages/read`, { conversationId, lastReadMessageId })
            .pipe(map(r => this.unwrap<any>(r, {})));
    }

    getUnreadCount(conversationId: string): Observable<number> {
        return this.http.get<any>(`${this.CHAT_ROOT}/conversations/${encodeURIComponent(conversationId)}/unread-count`)
            .pipe(map(r => {
                const unwrapped = this.unwrap<any>(r, 0);
                if (typeof unwrapped === 'number') return unwrapped; // Current implementation returns primitive in data
                if (typeof unwrapped?.unreadCount === 'number') return unwrapped.unreadCount;
                if (typeof unwrapped?.data === 'number') return unwrapped.data; // Fallback if unwrap failed earlier
                if (typeof unwrapped?.data?.unreadCount === 'number') return unwrapped.data.unreadCount;
                return 0;
            }));
    }

    // New reactive methods for the updated chat component
    getConversations$(): Observable<Conversation[]> {
        return this.conversationsSubject.asObservable();
    }

    getMessages$(): Observable<Message[]> {
        return this.messagesSubject.asObservable();
    }

    getActiveConversation$(): Observable<Conversation | null> {
        return this.activeConversationSubject.asObservable();
    }

    loadConversationsReactive(): void {
        this.getConversations()
            .pipe(
                map(response => {
                    // Transform PagedResponse<ChatConversationSummary> to Conversation[]
                    if (response?.content) {
                        return response.content.map(summary => this.transformToConversation(summary));
                    }
                    return [];
                }),
                tap(conversations => this.conversationsSubject.next(conversations))
            )
            .subscribe({
                error: (error) => {
                    console.error('Error loading conversations:', error);
                    this.conversationsSubject.next([]);
                }
            });
    }

    loadMessagesReactive(conversationId: string): void {
        this.getMessages(conversationId)
            .pipe(
                map(response => {
                    // Transform PagedResponse<ChatMessage> to Message[]
                    if (response?.content) {
                        return response.content.map(chatMsg => this.transformToMessage(chatMsg));
                    }
                    return [];
                }),
                tap(messages => this.messagesSubject.next(messages))
            )
            .subscribe({
                error: (error) => {
                    console.error('Error loading messages:', error);
                    this.messagesSubject.next([]);
                }
            });
    }

    setActiveConversation(conversation: Conversation | null): void {
        this.activeConversationSubject.next(conversation);
        if (conversation) {
            this.loadMessagesReactive(conversation.id);
        } else {
            this.messagesSubject.next([]);
        }
    }

    createConversationReactive(participants: string[]): Observable<Conversation> {
        // Use the existing POST method to create conversation
        const body = { participants };
        return this.http.post<any>(`${this.CHAT_ROOT}/conversations`, body)
            .pipe(
                map(response => this.unwrap<any>(response, {})),
                map(newConversation => this.transformToConversation(newConversation)),
                tap(newConversation => {
                    const currentConversations = this.conversationsSubject.value;
                    this.conversationsSubject.next([newConversation, ...currentConversations]);
                    this.setActiveConversation(newConversation);
                })
            );
    }

    sendMessageReactive(request: SendMessageRequest): Observable<Message> {
        return this.sendMessage({
            conversationId: request.conversationId,
            content: request.content
        })
            .pipe(
                map(response => this.transformToMessage(response)),
                tap(newMessage => {
                    const currentMessages = this.messagesSubject.value;
                    this.messagesSubject.next([...currentMessages, newMessage]);

                    // Update last message in conversations
                    const currentConversations = this.conversationsSubject.value;
                    const updatedConversations = currentConversations.map(conv => {
                        if (conv.id === request.conversationId) {
                            return {
                                ...conv,
                                lastMessageAt: newMessage.timestamp
                            };
                        }
                        return conv;
                    });
                    this.conversationsSubject.next(updatedConversations);
                })
            );
    }

    addMessageToState(message: Message): void {
        const currentMessages = this.messagesSubject.value;
        this.messagesSubject.next([...currentMessages, message]);

        // Update conversation's last message
        const currentConversations = this.conversationsSubject.value;
        const updatedConversations = currentConversations.map(conv => {
            if (conv.id === message.conversationId) {
                return {
                    ...conv,
                    lastMessageAt: message.timestamp
                };
            }
            return conv;
        });
        this.conversationsSubject.next(updatedConversations);
    }

    clearState(): void {
        this.conversationsSubject.next([]);
        this.messagesSubject.next([]);
        this.activeConversationSubject.next(null);
    }

    // Transform methods to convert backend DTOs to frontend interfaces
    private transformToConversation(summary: any): Conversation {
        return {
            id: summary.id,
            type: summary.type || 'DIRECT',
            title: summary.title || summary.name,
            members: summary.participants || [],
            ownerId: summary.ownerId,
            adminIds: summary.adminIds || [],
            createdAt: summary.createdAt,
            lastMessageAt: summary.lastMessageTimestamp || summary.updatedAt,
            unreadCount: summary.unreadCount || 0,
            archived: summary.archived || false
        };
    }

    private transformToMessage(chatMsg: any): Message {
        return {
            id: chatMsg.id,
            conversationId: chatMsg.conversationId,
            content: chatMsg.content,
            senderId: chatMsg.senderId,
            senderName: chatMsg.senderUsername || chatMsg.senderName || 'Unknown',
            timestamp: chatMsg.timestamp,
            messageType: chatMsg.messageType || 'TEXT',
            edited: chatMsg.edited || false,
            editedAt: chatMsg.editedAt
        };
    }
}
