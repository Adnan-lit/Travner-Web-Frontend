import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatService, ChatConversationSummary, ChatMessage, ChatConversation } from '../../services/chat.service';
import { ChatRealtimeService, ChatRealtimeEvent } from '../../services/chat-realtime.service';
import { BackendStatusService } from '../../services/backend-status.service';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Params, Router, RouterModule } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { Subscription, combineLatest, of } from 'rxjs';

@Component({
    selector: 'app-chat',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy {
    private chatService = inject(ChatService);
    private backendStatus = inject(BackendStatusService);
    private realtime = inject(ChatRealtimeService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    loadingConversations = false;
    conversations: ChatConversationSummary[] = [];
    selectedConversation: ChatConversation | null = null;
    messages: ChatMessage[] = [];
    messagesLoading = false;
    sending = false;
    page = 0;
    size = 30;
    messagePage = 0;
    messageSize = 50;
    hasMoreMessages = true;
    newMessage = '';
    error: string | null = null;

    private subs: Subscription[] = [];
    private messageIdSet = new Set<string>();
    backendReachable$ = this.backendStatus.reachable$;

    ngOnInit(): void {
        // Connect realtime
        this.realtime.ensureConnected();
        this.subs.push(
            this.realtime.events$.subscribe(ev => this.handleRealtimeEvent(ev))
        );
        // Load conversations then select based on route param if present
        this.loadConversations();
        this.subs.push(
            this.route.params.subscribe(p => {
                const id = p['id'];
                if (id) {
                    this.openConversation(id, false);
                }
            })
        );
    }

    private loadConversations(): void {
        this.loadingConversations = true;
        this.chatService.getConversations(this.page, this.size).subscribe({
            next: resp => {
                this.conversations = resp.content;
                this.loadingConversations = false;
            },
            error: err => {
                console.error('Failed to load conversations', err);
                this.error = 'Failed to load conversations';
                this.loadingConversations = false;
            }
        });
    }

    refresh(): void { this.page = 0; this.loadConversations(); }

    openConversation(id: string, navigate = true): void {
        if (navigate) this.router.navigate(['/chat', id]);
        this.selectedConversation = null;
        this.messages = [];
        this.messagePage = 0;
        this.hasMoreMessages = true;
        this.fetchConversation(id);
        this.loadMessages(id, true);
        this.realtime.subscribeConversation(id);
    }

    private fetchConversation(id: string): void {
        this.chatService.getConversation(id).subscribe({
            next: conv => { this.selectedConversation = conv; },
            error: err => { console.warn('Conversation load failed', err); }
        });
    }

    loadMoreMessages(): void {
        if (!this.selectedConversation || !this.hasMoreMessages || this.messagesLoading) return;
        this.messagePage++;
        this.loadMessages(this.selectedConversation.id, false);
    }

    private loadMessages(id: string, initial: boolean): void {
        this.messagesLoading = true;
        this.chatService.getMessages(id, this.messagePage, this.messageSize).subscribe({
            next: resp => {
                // Append older messages to top (assuming page asc)
                const incoming = resp.content.slice().reverse();
                if (initial) {
                    this.messages = incoming;
                } else {
                    this.messages = [...incoming, ...this.messages];
                }
                // Dedupe and sort ascending by createdAt
                const mapById: { [id: string]: ChatMessage } = {};
                this.messages.forEach(m => { mapById[m.id] = m; });
                this.messages = Object.values(mapById).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                this.messages.forEach(m => this.messageIdSet.add(m.id));
                // Enforce client retention (last 10)
                if (this.messages.length > 10) {
                    this.messages = this.messages.slice(-10);
                }
                this.hasMoreMessages = this.messages.length < resp.totalElements && resp.totalElements > this.messages.length;
                this.messagesLoading = false;
            },
            error: err => {
                console.error('Failed to load messages', err);
                this.messagesLoading = false;
            }
        });
    }

    send(): void {
        if (!this.selectedConversation || !this.newMessage.trim() || this.sending) return;
        const content = this.newMessage.trim();
        // Optimistic append
        const temp: ChatMessage = {
            id: 'temp-' + Date.now(),
            conversationId: this.selectedConversation.id,
            senderId: 'me',
            senderName: 'Me',
            content,
            kind: 'TEXT',
            createdAt: new Date().toISOString(),
            attachments: []
        };
        this.messages.push(temp);
        this.messageIdSet.add(temp.id);
        this.newMessage = '';
        this.sending = true;
        this.chatService.sendMessage({ conversationId: this.selectedConversation.id, content }).subscribe({
            next: real => {
                // Replace temp with real
                const idx = this.messages.findIndex(m => m.id === temp.id);
                if (idx >= 0) this.messages[idx] = real;
                this.messageIdSet.delete(temp.id);
                this.messageIdSet.add(real.id);
                this.trimRetention();
                this.sending = false;
            },
            error: err => {
                console.error('Send failed', err);
                // Remove temp and restore input
                this.messages = this.messages.filter(m => m.id !== temp.id);
                this.messageIdSet.delete(temp.id);
                this.newMessage = content; // let user retry
                this.sending = false;
            }
        });
    }

    trackConv(i: number, c: ChatConversationSummary) { return c.id; }
    trackMsg(i: number, m: ChatMessage) { return m.id; }

    ngOnDestroy(): void {
        this.subs.forEach(s => s.unsubscribe());
    }

    private handleRealtimeEvent(ev: ChatRealtimeEvent) {
        if (!ev || !ev.type) return;
        if (ev.conversationId && this.selectedConversation && ev.conversationId !== this.selectedConversation.id) return;
        switch (ev.type) {
            case 'MESSAGE_SENT':
                if (ev.data && ev.data.id && !this.messageIdSet.has(ev.data.id)) {
                    this.messages.push(ev.data);
                    this.messageIdSet.add(ev.data.id);
                    this.messages = this.messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                    this.trimRetention();
                }
                break;
            case 'USER_TYPING':
            case 'USER_STOPPED_TYPING':
                // Future enhancement: show typing indicator
                break;
            case 'MESSAGE_READ':
                // Future: update read state
                break;
        }
    }

    private trimRetention() {
        if (this.messages.length > 10) {
            this.messages = this.messages.slice(-10);
            // Rebuild ID set
            this.messageIdSet = new Set(this.messages.map(m => m.id));
        }
    }
}
