import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { EnvironmentConfig } from '../config/environment.config';
import { BackendStatusService } from './backend-status.service';

// Conversation summary per revised API docs (DIRECT only for now)
export interface ChatConversationSummary {
    id: string;
    type: 'DIRECT';
    title?: string | null; // Often null for DIRECT
    memberCount?: number;  // Provided by backend
    lastMessage?: ChatMessage | {
        content?: string;
        senderName?: string;
        createdAt?: string;
    } | null;
    unreadCount?: number;  // Server-calculated per user
    createdAt?: string;
    lastMessageAt?: string; // Provided separately in some responses
    archived?: boolean;     // Always false currently
}

export interface ChatConversation extends ChatConversationSummary {
    members?: Array<{
        userId: string;
        userName: string;
        role: string; // MEMBER
        lastReadAt?: string;
        muted?: boolean;
        joinedAt?: string;
    }>;
}

export interface ChatMessage {
    id: string;
    conversationId: string;
    senderId: string;
    senderName: string;
    content: string;
    kind: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM' | string;
    createdAt: string;
    attachments?: Array<{
        id?: string;
        filename?: string; // server returns filename
        url?: string;      // server returns id currently
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

@Injectable({ providedIn: 'root' })
export class ChatService {
    // Base URL (may be overridden via localStorage 'travner_backend_override')
    private readonly API_BASE_URL = this.computeBaseUrl();
    // Root for chat endpoints (/api/chat/**). We attempt to normalize so there is exactly one '/api' segment.
    private readonly CHAT_ROOT = this.computeChatRoot(this.API_BASE_URL);

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

    private authHeaders(): HttpHeaders {
        const raw = localStorage.getItem('travner_auth');
        if (!raw) return new HttpHeaders();
        try {
            const parsed = JSON.parse(raw);
            if (parsed.authToken) {
                return new HttpHeaders({ 'Authorization': `Basic ${parsed.authToken}` });
            }
            if (parsed.username && parsed.password) {
                const token = btoa(`${parsed.username}:${parsed.password}`);
                return new HttpHeaders({ 'Authorization': `Basic ${token}` });
            }
        } catch { }
        return new HttpHeaders();
    }

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
        return this.http.get(url, { headers: this.authHeaders(), params, responseType: 'text', observe: 'response' }).pipe(
            map(resp => {
                const raw = resp.body ?? '';
                const status = resp.status;
                const lowered = raw.trim().toLowerCase();
                if (lowered.startsWith('<!doctype html') || lowered.startsWith('<html')) {
                    console.warn('[ChatService] HTML received instead of JSON for conversations.', { url, status, length: raw.length });
                    this.backendStatus.reportHtmlFallback('chat.conversations');
                    // Provide diagnostic hint if status is 200 (likely Angular index) or 404/301 (proxy path mismatch)
                    if (localStorage.getItem('travner_debug') === 'true') {
                        console.log('[ChatService][Diagnostics] Possible causes:', [
                            '1) Backend not running or wrong port (check proxy target).',
                            '2) Backend mapping not including /api (try setting travner_backend_override to direct host).',
                            '3) Auth required and server returning HTML login page.'
                        ]);
                    }
                    return { content: [], totalElements: 0, totalPages: 0, size, number: page };
                }
                try {
                    const parsed = JSON.parse(raw);
                    this.backendStatus.reportSuccess('chat.conversations');
                    return this.unwrapPaged<ChatConversationSummary>(parsed);
                } catch (e) {
                    console.warn('[ChatService] Failed to parse conversations JSON', e, { status, snippet: raw.slice(0, 120) });
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
        return this.http.get<any>(`${this.CHAT_ROOT}/conversations/${id}`, { headers: this.authHeaders() })
            .pipe(map(r => this.unwrap<ChatConversation>(r, {} as any)));
    }

    getOrCreateDirect(otherUserId: string): Observable<ChatConversation> {
        return this.http.get<any>(`${this.CHAT_ROOT}/conversations/direct/${otherUserId}`, { headers: this.authHeaders() })
            .pipe(map(r => this.unwrap<ChatConversation>(r, {} as any)));
    }

    createDirect(memberId: string): Observable<ChatConversation> {
        return this.http.post<any>(`${this.CHAT_ROOT}/conversations`, { type: 'DIRECT', memberIds: [memberId] }, { headers: this.authHeaders() })
            .pipe(map(r => this.unwrap<ChatConversation>(r, {} as any)));
    }

    // ---- Messages ----
    getMessages(conversationId: string, page = 0, size = 50): Observable<PagedResponse<ChatMessage>> {
        const params = new HttpParams().set('page', page).set('size', size);
        const url = `${this.CHAT_ROOT}/conversations/${conversationId}/messages`;
        return this.http.get(url, { headers: this.authHeaders(), params, responseType: 'text' }).pipe(
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
        return this.http.post<any>(`${this.CHAT_ROOT}/messages`, payload, { headers: this.authHeaders() })
            .pipe(map(r => this.unwrap<ChatMessage>(r, {} as any)));
    }

    editMessage(messageId: string, content: string): Observable<ChatMessage> {
        // Current backend expects query param ?content=... (JSON body planned for future)
        const url = `${this.CHAT_ROOT}/messages/${encodeURIComponent(messageId)}?content=${encodeURIComponent(content)}`;
        return this.http.put<any>(url, null, { headers: this.authHeaders() })
            .pipe(map(r => this.unwrap<ChatMessage>(r, {} as any)));
    }

    deleteMessage(messageId: string): Observable<void> {
        return this.http.delete<any>(`${this.CHAT_ROOT}/messages/${messageId}`, { headers: this.authHeaders() })
            .pipe(map(() => void 0));
    }

    markRead(conversationId: string, lastReadMessageId: string): Observable<any> {
        return this.http.post<any>(`${this.CHAT_ROOT}/messages/read`, { conversationId, lastReadMessageId }, { headers: this.authHeaders() })
            .pipe(map(r => this.unwrap<any>(r, {})));
    }

    getUnreadCount(conversationId: string): Observable<number> {
        return this.http.get<any>(`${this.CHAT_ROOT}/conversations/${encodeURIComponent(conversationId)}/unread-count`, { headers: this.authHeaders() })
            .pipe(map(r => {
                const unwrapped = this.unwrap<any>(r, 0);
                if (typeof unwrapped === 'number') return unwrapped; // Current implementation returns primitive in data
                if (typeof unwrapped?.unreadCount === 'number') return unwrapped.unreadCount;
                if (typeof unwrapped?.data === 'number') return unwrapped.data; // Fallback if unwrap failed earlier
                if (typeof unwrapped?.data?.unreadCount === 'number') return unwrapped.data.unreadCount;
                return 0;
            }));
    }
}
