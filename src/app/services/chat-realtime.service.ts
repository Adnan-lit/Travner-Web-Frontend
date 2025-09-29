import { Injectable, NgZone } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { Subject } from 'rxjs';
import { EnvironmentConfig } from '../config/environment.config';

export interface ChatRealtimeEvent {
    type: string;
    conversationId: string;
    userId?: string;
    userName?: string;
    data?: any;
    timestamp?: string;
}

@Injectable({ providedIn: 'root' })
export class ChatRealtimeService {
    private client: Client | null = null;
    private connected = false;
    private conversationSubscriptions: { [id: string]: StompSubscription } = {};
    private pendingConversationIds: Set<string> = new Set();

    private eventsSubject = new Subject<ChatRealtimeEvent>();
    events$ = this.eventsSubject.asObservable();

    private connectionStateSubject = new Subject<boolean>();
    connectionState$ = this.connectionStateSubject.asObservable();

    constructor(private zone: NgZone) { }

    ensureConnected() {
        if (this.connected) return;
        const wsUrl = this.buildWsUrl();
        const client = new Client({
            brokerURL: wsUrl,
            reconnectDelay: 4000,
            heartbeatIncoming: 15000,
            heartbeatOutgoing: 15000,
            debug: (msg) => { if (localStorage.getItem('travner_debug') === 'true') console.log('[STOMP]', msg); }
        });

        // Attach basic auth header if possible
        try {
            const raw = localStorage.getItem('travner_auth');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed.username && parsed.password) {
                    const token = btoa(`${parsed.username}:${parsed.password}`);
                    (client as any).connectHeaders = { Authorization: 'Basic ' + token };
                } else if (parsed.authToken) {
                    (client as any).connectHeaders = { Authorization: 'Basic ' + parsed.authToken };
                }
            }
        } catch { }

        client.onConnect = () => {
            this.zone.run(() => {
                this.connected = true;
                this.connectionStateSubject.next(true);
                // Subscribe any pending conversation topics
                this.pendingConversationIds.forEach(id => this.subscribeConversation(id));
                this.pendingConversationIds.clear();
            });
        };
        client.onStompError = frame => {
            console.error('[ChatRealtime] STOMP error', frame.headers['message'], frame.body);
        };
        client.onWebSocketClose = () => {
            this.zone.run(() => {
                this.connected = false;
                this.connectionStateSubject.next(false);
            });
        };
        client.activate();
        this.client = client;
    }

    private buildWsUrl(): string {
        // Allow local override: localStorage.travner_backend_override (e.g. http://localhost:8081)
        try {
            const override = localStorage.getItem('travner_backend_override');
            if (override) {
                const cleaned = override.replace(/\/$/, '');
                return cleaned.startsWith('http')
                    ? cleaned.replace('https://', 'wss://').replace('http://', 'ws://') + '/ws'
                    : `ws://${cleaned}/ws`;
            }
        } catch { }

        const base = EnvironmentConfig.getWebSocketUrl();
        if (base.startsWith('ws://') || base.startsWith('wss://')) return base;
        if (base.startsWith('https://')) return base.replace('https://', 'wss://');
        if (base.startsWith('http://')) return base.replace('http://', 'ws://');
        // If EnvironmentConfig returned relative like '/ws', build absolute using current origin
        if (base.startsWith('/')) {
            const loc = window.location;
            const proto = loc.protocol === 'https:' ? 'wss://' : 'ws://';
            return proto + loc.host + base;
        }
        return base;
    }

    subscribeConversation(conversationId: string) {
        this.ensureConnected();
        if (!this.connected) {
            this.pendingConversationIds.add(conversationId);
            return;
        }
        if (this.conversationSubscriptions[conversationId]) return; // already
        const destination = `/topic/conversation/${conversationId}`;
        const sub = this.client!.subscribe(destination, (msg: IMessage) => this.handleRawMessage(msg));
        this.conversationSubscriptions[conversationId] = sub;
    }

    unsubscribeConversation(conversationId: string) {
        const sub = this.conversationSubscriptions[conversationId];
        if (sub) {
            try { sub.unsubscribe(); } catch { }
            delete this.conversationSubscriptions[conversationId];
        }
    }

    sendMessage(conversationId: string, payload: { content: string; kind?: string; attachments?: any[]; replyToMessageId?: string; }) {
        this.ensureConnected();
        if (!this.connected) return;
        const body = JSON.stringify({ conversationId, kind: payload.kind || 'TEXT', content: payload.content, attachments: payload.attachments || [], replyToMessageId: payload.replyToMessageId });
        this.client!.publish({ destination: '/app/chat.sendMessage', body });
    }

    sendTyping(conversationId: string, typing: boolean) {
        this.ensureConnected();
        if (!this.connected) return;
        this.client!.publish({ destination: '/app/chat.typing', body: JSON.stringify({ conversationId, typing }) });
    }

    private handleRawMessage(msg: IMessage) {
        try {
            const event = JSON.parse(msg.body);
            this.zone.run(() => this.eventsSubject.next(event));
        } catch (e) {
            console.warn('[ChatRealtime] Failed to parse message body', e, msg.body);
        }
    }

    disconnect() {
        Object.keys(this.conversationSubscriptions).forEach(id => this.unsubscribeConversation(id));
        if (this.client) {
            this.client.deactivate();
        }
        this.connected = false;
    }
}
