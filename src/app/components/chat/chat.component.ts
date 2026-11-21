import { logger } from '../../core/logging/logger';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  forwardRef,
  inject,
  Input,
  numberAttribute,
  OnChanges,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListRange } from '@angular/cdk/collections';
import {
  CdkVirtualScrollViewport,
  ScrollingModule,
  VIRTUAL_SCROLL_STRATEGY,
  VirtualScrollStrategy,
} from '@angular/cdk/scrolling';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';
import { WebSocketService } from '../../services/websocket.service';
import { UserService } from '../../services/user.service';
import {
  ChatMessage,
  ChatParticipant,
  ChatUser,
  ConversationWithParticipants,
  SendMessageRequest,
} from '../../models/chat.model';
import { User } from '../../models/common.model';
import { UserSearchComponent } from './user-search/user-search.component';

/**
 * CDK 19's stable scrolling package only ships a fixed-size strategy; autosize lives in
 * @angular/cdk-experimental, which is deliberately not a dependency of this app. This small
 * strategy measures the items CDK has rendered and uses their average size for unseen rows.
 */
export class ChatAutosizeVirtualScrollStrategy implements VirtualScrollStrategy {
  readonly scrolledIndexChange = new Subject<number>();

  private viewport: CdkVirtualScrollViewport | null = null;
  private readonly measuredSizes = new Map<number, number>();
  private readonly defaultItemSize = 120;
  private pendingScrollIndex: number | null = null;
  private lastAppliedScrollOffset: number | null = null;

  constructor(
    private minBufferPx: number,
    private maxBufferPx: number,
  ) {}

  attach(viewport: CdkVirtualScrollViewport): void {
    this.viewport = viewport;
    this.measuredSizes.clear();
    this.updateRange(0);
  }

  detach(): void {
    this.viewport = null;
    this.pendingScrollIndex = null;
    this.lastAppliedScrollOffset = null;
  }

  onContentScrolled(): void {
    if (this.viewport) {
      this.updateRange(this.viewport.measureScrollOffset());
    }
  }

  onDataLengthChanged(): void {
    if (!this.viewport) {
      return;
    }
    const length = this.viewport.getDataLength();
    for (const index of this.measuredSizes.keys()) {
      if (index >= length) {
        this.measuredSizes.delete(index);
      }
    }
    this.updateRange(this.viewport.measureScrollOffset());
    this.applyPendingScroll('auto');
  }

  onContentRendered(): void {
    if (!this.viewport) {
      return;
    }
    const range = this.viewport.getRenderedRange();
    for (let index = range.start; index < range.end; index++) {
      const size = this.viewport.measureRangeSize({ start: index, end: index + 1 });
      if (size > 0) {
        this.measuredSizes.set(index, size);
      }
    }
    this.updateTotalSize();
    if (this.applyPendingScroll('auto')) {
      // The target and the rows before it have now been measured; further
      // renders should no longer override the user's scroll position.
      this.pendingScrollIndex = null;
      this.lastAppliedScrollOffset = null;
    }
  }

  onRenderedOffsetChanged(): void {
    // This strategy owns the rendered offset, so there is nothing to recalculate here.
  }

  scrollToIndex(index: number, behavior: ScrollBehavior): void {
    if (!this.viewport) {
      return;
    }
    const maxIndex = Math.max(0, this.viewport.getDataLength() - 1);
    this.pendingScrollIndex = Math.min(Math.max(0, index), maxIndex);
    this.lastAppliedScrollOffset = null;
    this.applyPendingScroll(behavior);
  }

  /** Re-applies an in-flight scroll after variable-height rows have been measured. */
  private applyPendingScroll(behavior: ScrollBehavior): boolean {
    if (!this.viewport || this.pendingScrollIndex === null) {
      return true;
    }
    const offset = this.offsetForIndex(this.pendingScrollIndex);
    const stable =
      this.lastAppliedScrollOffset !== null &&
      Math.abs(offset - this.lastAppliedScrollOffset) < 1 &&
      this.measuredSizes.has(this.pendingScrollIndex);
    this.lastAppliedScrollOffset = offset;
    this.viewport.scrollToOffset(offset, behavior);
    return stable;
  }

  updateBufferSize(minBufferPx: number, maxBufferPx: number): void {
    this.minBufferPx = minBufferPx;
    this.maxBufferPx = maxBufferPx;
    if (this.viewport) {
      this.updateRange(this.viewport.measureScrollOffset());
    }
  }

  private sizeFor(index: number): number {
    return this.measuredSizes.get(index) ?? this.defaultItemSize;
  }

  private averageSize(): number {
    if (this.measuredSizes.size === 0) {
      return this.defaultItemSize;
    }
    let total = 0;
    this.measuredSizes.forEach((size) => (total += size));
    return total / this.measuredSizes.size;
  }

  private offsetForIndex(index: number): number {
    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += this.sizeFor(i);
    }
    return offset;
  }

  private indexForOffset(offset: number): number {
    const length = this.viewport?.getDataLength() ?? 0;
    let consumed = 0;
    for (let index = 0; index < length; index++) {
      consumed += this.sizeFor(index);
      if (consumed > offset) {
        return index;
      }
    }
    return Math.max(0, length - 1);
  }

  private updateTotalSize(): void {
    if (!this.viewport) {
      return;
    }
    let total = 0;
    for (let index = 0; index < this.viewport.getDataLength(); index++) {
      total += this.sizeFor(index);
    }
    this.viewport.setTotalContentSize(total);
  }

  private updateRange(offset: number): void {
    if (!this.viewport) {
      return;
    }
    const viewport = this.viewport;
    const length = viewport.getDataLength();
    this.updateTotalSize();
    if (length === 0) {
      viewport.setRenderedRange({ start: 0, end: 0 });
      return;
    }

    const itemSize = this.averageSize();
    const firstVisible = this.indexForOffset(offset);
    const visibleCount = Math.ceil((viewport.getViewportSize() || itemSize) / itemSize) + 1;
    const bufferPx = Math.max(this.minBufferPx, this.maxBufferPx);
    const bufferCount = Math.ceil(bufferPx / itemSize);
    const range: ListRange = {
      start: Math.max(0, firstVisible - bufferCount),
      end: Math.min(length, firstVisible + visibleCount + bufferCount),
    };
    viewport.setRenderedRange(range);
    viewport.setRenderedContentOffset(this.offsetForIndex(range.start));
    this.scrolledIndexChange.next(firstVisible);
  }
}

/** Activates the local autosize strategy via the familiar `autosize` viewport attribute. */
@Directive({
  selector: 'cdk-virtual-scroll-viewport[autosize]',
  standalone: true,
  providers: [
    {
      provide: VIRTUAL_SCROLL_STRATEGY,
      useFactory: (directive: ChatAutosizeViewportDirective) => directive.strategy,
      deps: [forwardRef(() => ChatAutosizeViewportDirective)],
    },
  ],
})
export class ChatAutosizeViewportDirective implements OnChanges {
  @Input({ transform: numberAttribute }) minBufferPx = 300;
  @Input({ transform: numberAttribute }) maxBufferPx = 900;

  readonly strategy = new ChatAutosizeVirtualScrollStrategy(this.minBufferPx, this.maxBufferPx);

  ngOnChanges(): void {
    this.strategy.updateBufferSize(this.minBufferPx, this.maxBufferPx);
  }
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, ScrollingModule, ChatAutosizeViewportDirective, UserSearchComponent],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
  // Chat state is mutated by service/WebSocket/blob callbacks rather than templates,
  // so every async path below explicitly calls markForCheck().
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef;
  // The conversation viewport is also a CdkVirtualScrollViewport, so resolve the
  // message viewport through its template reference rather than by directive type.
  @ViewChild('messagesContainer', { read: CdkVirtualScrollViewport }) messagesViewport?: CdkVirtualScrollViewport;

  // Data
  conversations: ConversationWithParticipants[] = [];
  selectedConversation: ConversationWithParticipants | null = null;
  messages: ChatMessage[] = [];
  filteredConversations: ConversationWithParticipants[] = [];

  // UI State
  newMessage = '';
  sendingMessage = false;
  loadingConversations = false;
  loadingMessages = false;
  showUserSearch = false;
  conversationSearchQuery = '';
  isConnected = false;

  // Authentication
  currentUser: User | null = null;

  // WebSocket
  private readonly destroyRef = inject(DestroyRef);
  private typingTimeout: any;
  private destroyed = false;

  // Attachments: blob URLs are created from authenticated downloads (P2-03).
  private attachmentUrls = new Map<string, string>();
  private loadingAttachments = new Set<string>();

  constructor(
    private authService: AuthService,
    private chatService: ChatService,
    private webSocketService: WebSocketService,
    private userService: UserService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    if (!this.checkAuthentication()) {
      return;
    }

    this.loadConversations();
    this.connectWebSocket();
    this.setupSubscriptions();
  }

  ngAfterViewInit(): void {
    this.scrollToBottom();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.webSocketService.disconnect();

    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    this.attachmentUrls.forEach((url) => URL.revokeObjectURL(url));
    this.attachmentUrls.clear();
  }

  private checkAuthentication(): boolean {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/signin']);
      return false;
    }

    this.currentUser = this.authService.getCurrentUser();
    return true;
  }

  private loadConversations(): void {
    this.loadingConversations = true;
    this.chatService.getConversations().subscribe({
      next: (conversations) => {
        this.conversations = conversations;
        this.filteredConversations = conversations;
        this.loadingConversations = false;
        this.cdr.markForCheck();
      },
      error: () => {
        logger.error('Unable to load conversations.');
        this.loadingConversations = false;
        this.cdr.markForCheck();
      },
    });
  }

  private connectWebSocket(): void {
    this.webSocketService.connect();
    this.webSocketService
      .getConnectionStatus()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((connected) => {
        this.isConnected = connected;
        this.cdr.markForCheck();
        if (connected) {
          logger.debug('WebSocket connected successfully');
        } else {
          logger.warn('WebSocket disconnected');
        }
      });
  }

  private setupSubscriptions(): void {
    // Subscribe to conversations updates
    this.chatService.conversations$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((conversations) => {
      this.conversations = conversations;
      this.filteredConversations = conversations;
      this.cdr.markForCheck();
    });

    // Subscribe to messages updates
    this.chatService.messages$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((messagesMap) => {
      if (this.selectedConversation) {
        this.messages = messagesMap.get(this.selectedConversation.id) || [];
        this.cdr.markForCheck();
        setTimeout(() => this.scrollToBottom(), 100);
      }
    });
  }

  selectConversation(conversation: ConversationWithParticipants): void {
    // Unsubscribe from previous conversation
    if (this.selectedConversation && this.selectedConversation.id !== conversation.id) {
      this.webSocketService.unsubscribeFromConversation(this.selectedConversation.id);
    }

    this.selectedConversation = conversation;
    this.loadMessages(conversation.id);
    this.markMessagesAsRead(conversation.id);

    // Subscribe to conversation WebSocket channel
    this.webSocketService.subscribeToConversation(conversation.id);
    this.cdr.markForCheck();
  }

  private loadMessages(conversationId: string): void {
    this.loadingMessages = true;
    this.chatService.getMessages(conversationId).subscribe({
      next: (messages) => {
        this.messages = messages;
        this.loadingMessages = false;
        this.cdr.markForCheck();
        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: () => {
        logger.error('Unable to load messages.');
        this.messages = [];
        this.loadingMessages = false;
        this.cdr.markForCheck();
      },
    });
  }

  private markMessagesAsRead(conversationId: string): void {
    this.chatService.markMessagesAsRead(conversationId).subscribe({
      error: () => {
        logger.error('Unable to mark messages as read.');
      },
    });
  }

  sendMessage(): void {
    if (!this.selectedConversation || !this.newMessage.trim() || this.sendingMessage) {
      return;
    }

    if (!this.isConnected) {
      alert('Not connected to chat server. Please refresh the page and try again.');
      return;
    }

    const messageContent = this.newMessage.trim();
    this.newMessage = '';
    this.sendingMessage = true;

    const request: SendMessageRequest = {
      conversationId: this.selectedConversation.id,
      content: messageContent,
      messageType: 'TEXT',
    };

    this.chatService.sendMessage(request).subscribe({
      next: () => {
        this.sendingMessage = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        logger.error('Unable to send message.');
        this.sendingMessage = false;
        this.newMessage = messageContent; // Restore message on error
        this.cdr.markForCheck();

        if (error.status === 401) {
          alert('Authentication failed. Please sign in again.');
          this.router.navigate(['/signin']);
        } else if (error.status === 403) {
          alert('You do not have permission to send messages in this conversation.');
        } else if (error.status === 404) {
          alert('Conversation not found. Please refresh and try again.');
        } else {
          alert('Failed to send message. Please try again.');
        }
      },
    });
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  onMessageInput(): void {
    if (this.selectedConversation) {
      this.sendTypingIndicator(true);

      // Clear existing timeout
      if (this.typingTimeout) {
        clearTimeout(this.typingTimeout);
      }

      // Set timeout to stop typing indicator
      this.typingTimeout = setTimeout(() => {
        this.sendTypingIndicator(false);
      }, 1000);
    }
  }

  private sendTypingIndicator(isTyping: boolean): void {
    if (this.selectedConversation) {
      this.webSocketService.sendTypingIndicator(this.selectedConversation.id, isTyping);
    }
  }

  onConversationSearch(event: any): void {
    const query = event.target.value.toLowerCase();
    this.conversationSearchQuery = query;

    if (!query.trim()) {
      this.filteredConversations = this.conversations;
    } else {
      this.filteredConversations = this.conversations.filter((conversation) =>
        conversation.title.toLowerCase().includes(query),
      );
    }
  }

  getConversationTitle(conversation: ConversationWithParticipants): string {
    if (conversation.type === 'DIRECT') {
      // For direct conversations, show the other participant's name
      const otherParticipant = this.getOtherParticipantFromConversation(conversation);
      if (otherParticipant) {
        return this.getParticipantDisplayName(otherParticipant);
      }
      // Fallback if we can't find the other participant
      return 'Direct Message';
    }

    // For group conversations, use the conversation title
    return conversation.title || 'Group Chat';
  }

  private getOtherParticipantFromConversation(conversation: ConversationWithParticipants): ChatUser | null {
    if (!this.currentUser || !conversation.participants) {
      return null;
    }
    // Return the resolved participant summary as-is: its displayName/avatar
    // would be lost by converting to the legacy User shape (P2-02).
    return conversation.participants.find((participant) => participant.id !== this.currentUser!.id) ?? null;
  }

  getSenderDisplayName(message: ChatMessage): string {
    // If it's our own message, don't show sender name (handled by isOwnMessage)
    if (this.isOwnMessage(message)) {
      return '';
    }

    // For direct conversations, show the other participant's name
    if (this.selectedConversation && this.selectedConversation.type === 'DIRECT') {
      const otherParticipant = this.getOtherParticipant();
      if (otherParticipant) {
        return this.getParticipantDisplayName(otherParticipant);
      }
    }

    // For group conversations, find the participant who sent the message
    if (this.selectedConversation && this.selectedConversation.type === 'GROUP') {
      const senderParticipant = this.selectedConversation.participants?.find(
        (participant) => participant.id === message.senderId,
      );
      if (senderParticipant) {
        return this.getParticipantDisplayName(senderParticipant);
      }
    }

    // Prefer the resolved sender summary; the backend also fills senderUsername.
    return message.sender?.displayName || message.senderUsername || 'Former user';
  }

  getConversationLastMessage(conversation: ConversationWithParticipants): string {
    return conversation.lastMessage || 'No messages yet';
  }

  getMessageTime(message: ChatMessage): string {
    const date = new Date(message.createdAt);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  getConversationTime(conversation: ConversationWithParticipants): string {
    if (!conversation.lastMessageAt) {
      return '';
    }
    const date = new Date(conversation.lastMessageAt);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  isOwnMessage(message: ChatMessage): boolean {
    if (!this.currentUser || !message.senderId) {
      return false;
    }
    return this.currentUser.id === message.senderId;
  }

  getOtherParticipant(): ChatUser | null {
    if (!this.selectedConversation || !this.currentUser) {
      return null;
    }

    return this.getOtherParticipantFromConversation(this.selectedConversation);
  }

  getParticipantDisplayName(participant: ChatUser | ChatParticipant | null | undefined): string {
    if (!participant) {
      return 'Former user';
    }

    // displayName is the resolved human-readable label from the backend.
    const displayName = (participant as ChatUser).displayName || (participant as ChatParticipant).displayName;
    if (displayName) {
      return displayName;
    }

    const looksLikeObjectId = (value: string) => /^[0-9a-fA-F]{24}$/.test(value);

    const userName = (participant as ChatUser).userName || participant.username;
    if (userName && !looksLikeObjectId(userName)) {
      return userName;
    }

    const firstName = (participant as ChatUser).firstName;
    const lastName = (participant as ChatUser).lastName;
    if (firstName && lastName && !looksLikeObjectId(firstName)) {
      return `${firstName} ${lastName}`.trim();
    }
    if (firstName && firstName !== 'User' && !looksLikeObjectId(firstName)) {
      return firstName;
    }

    // Never expose a raw ObjectId as a display name.
    return 'Former user';
  }

  getChatHeaderTitle(): string {
    if (!this.selectedConversation) {
      return 'Chat';
    }

    if (this.selectedConversation.type === 'DIRECT') {
      const otherParticipant = this.getOtherParticipant();
      if (otherParticipant) {
        return this.getParticipantDisplayName(otherParticipant);
      }
      return 'Direct Message';
    }

    // For group conversations, use the conversation title
    return this.selectedConversation.title || 'Group Chat';
  }

  getConnectionStatusText(): string {
    return this.isConnected ? 'Connected' : 'Disconnected';
  }

  getConnectionStatusClass(): string {
    return this.isConnected ? 'status-connected' : 'status-disconnected';
  }

  private scrollToBottom(): void {
    if (this.messagesViewport && this.messages.length > 0) {
      // Autosize measures asynchronously; refresh dimensions before jumping to the last item.
      this.messagesViewport.checkViewportSize();
      this.messagesViewport.scrollToIndex(this.messages.length - 1, 'auto');
      return;
    }

    // Fallback for the brief window before the virtual viewport is instantiated.
    if (this.messagesContainer) {
      const element = this.messagesContainer.nativeElement as HTMLElement;
      element.scrollTop = element.scrollHeight;
    }
  }

  /** Stable identity for the virtualized conversation list. */
  trackByConversationId(_index: number, conversation: ConversationWithParticipants): string {
    return conversation.id;
  }

  /** Stable identity for the virtualized message list. */
  trackByMessageId(index: number, message: ChatMessage): string {
    return message.id || `${message.conversationId}:${message.createdAt}:${index}`;
  }

  // User search functionality
  onUserSelected(user: User): void {
    // Create or get direct conversation with selected user
    this.chatService.getDirectConversation(user.id).subscribe({
      next: (conversation) => {
        this.selectConversation(conversation);
        this.showUserSearch = false;
        this.cdr.markForCheck();
      },
      error: () => {
        logger.error('Unable to start conversation.');
        alert('Failed to start conversation. Please try again.');
      },
    });
  }

  toggleUserSearch(): void {
    this.showUserSearch = !this.showUserSearch;
  }

  onCloseUserSearch(): void {
    this.showUserSearch = false;
  }

  attachFile(): void {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/jpeg,image/png,image/gif,image/webp,image/bmp,.pdf,.doc,.docx,.txt,.text,.md,.csv';
    fileInput.multiple = false;

    fileInput.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        this.uploadFile(file);
      }
    };

    fileInput.click();
  }

  private uploadFile(file: File): void {
    if (!this.selectedConversation) {
      return;
    }

    // Mirror the server-side limits as UX validation; the backend is authoritative.
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    const allowedExtension = /\.(jpe?g|png|gif|webp|bmp|pdf|docx?|txt|text|md|csv)$/i;
    if (!allowedTypes.includes(file.type) && !allowedExtension.test(file.name)) {
      alert('File type not supported. Please select an image, PDF, or document file.');
      return;
    }

    const conversationId = this.selectedConversation.id;
    this.sendingMessage = true;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('conversationId', conversationId);

    this.chatService.uploadFile(formData).subscribe({
      next: (attachment) => {
        const request: SendMessageRequest = {
          conversationId,
          content: `📎 ${attachment.fileName}`,
          messageType: attachment.contentType.startsWith('image/') ? 'IMAGE' : 'FILE',
          attachmentId: attachment.id,
        };
        this.chatService.sendMessage(request).subscribe({
          next: () => {
            this.sendingMessage = false;
            this.cdr.markForCheck();
          },
          error: () => {
            logger.error('Unable to send attachment message.');
            this.sendingMessage = false;
            this.cdr.markForCheck();
            alert('Failed to send file. Please try again.');
            // Best-effort cleanup so a failed send does not leave an orphan.
            this.chatService.deleteAttachment(attachment.id).subscribe({
              error: () => logger.error('Unable to clean up attachment.'),
            });
          },
        });
      },
      error: () => {
        logger.error('Unable to upload file.');
        this.sendingMessage = false;
        this.cdr.markForCheck();
        alert('Failed to upload file. Please try again.');
      },
    });
  }

  /** Whether a message carries an image attachment. */
  isImageAttachment(message: ChatMessage): boolean {
    return !!message.attachment?.contentType.startsWith('image/');
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  /**
   * Lazily fetches the attachment with the auth interceptor's Bearer token and
   * returns an object URL suitable for <img>/<a>. Repeated calls are cached.
   */
  getAttachmentUrl(message: ChatMessage): string | null {
    const attachment = message.attachment;
    if (!attachment) {
      return null;
    }
    const cached = this.attachmentUrls.get(attachment.id);
    if (cached) {
      return cached;
    }
    if (this.destroyed || this.loadingAttachments.has(attachment.id)) {
      return null;
    }
    this.loadingAttachments.add(attachment.id);
    this.chatService
      .downloadAttachment(attachment.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob: Blob) => {
          this.loadingAttachments.delete(attachment.id);
          if (this.destroyed) {
            return;
          }
          this.attachmentUrls.set(attachment.id, URL.createObjectURL(blob));
          this.cdr.markForCheck();
        },
        error: () => {
          this.loadingAttachments.delete(attachment.id);
          if (!this.destroyed) {
            logger.error('Unable to download attachment.');
            this.cdr.markForCheck();
          }
        },
        complete: () => this.loadingAttachments.delete(attachment.id),
      });
    return null;
  }

  /** Downloads the file to the user's device using the authenticated blob. */
  downloadAttachment(message: ChatMessage): void {
    const attachment = message.attachment;
    if (!attachment || this.destroyed) {
      return;
    }
    this.chatService
      .downloadAttachment(attachment.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob: Blob) => {
          if (this.destroyed) {
            return;
          }
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement('a');
          anchor.href = url;
          anchor.download = attachment.fileName;
          document.body.appendChild(anchor);
          anchor.click();
          anchor.remove();
          URL.revokeObjectURL(url);
        },
        error: () => {
          if (!this.destroyed) {
            logger.error('Unable to download attachment.');
          }
        },
      });
  }

  showConversationInfo(): void {
    logger.debug('Show conversation info');
    // TODO: Implement conversation info
  }
}
