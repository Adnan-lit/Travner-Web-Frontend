export interface Conversation {
  id: string;
  type: 'DIRECT' | 'GROUP';
  title?: string;
  members: ConversationMember[];
  ownerId: string;
  adminIds: string[];
  createdAt: Date;
  lastMessageAt: Date;
  isArchived: boolean;
  unreadCount: number;
  lastMessage?: Message;
}

export interface ConversationMember {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen: Date;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  kind: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
  content: string;
  attachments: MessageAttachment[];
  replyToMessageId?: string;
  replyToMessage?: Message;
  sentAt: Date;
  editedAt?: Date;
  isEdited: boolean;
  readByUserIds: string[];
  readCount: number;
}

export interface MessageAttachment {
  mediaId: string;
  caption?: string;
  url: string;
  filename: string;
  size: number;
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
}

export interface SendMessageRequest {
  conversationId: string;
  kind: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
  content: string;
  attachments?: MessageAttachment[];
  replyToMessageId?: string;
}

export interface CreateConversationRequest {
  type: 'DIRECT' | 'GROUP';
  title?: string;
  memberIds: string[];
}

export interface ChatEvent {
  type: 'MESSAGE_SENT' | 'MESSAGE_EDITED' | 'MESSAGE_DELETED' |
  'USER_TYPING' | 'USER_STOPPED_TYPING' |
  'USER_JOINED_CONVERSATION' | 'USER_LEFT_CONVERSATION' |
  'USER_ONLINE' | 'USER_OFFLINE' | 'MESSAGE_READ';
  conversationId: string;
  userId: string;
  userName: string;
  data: any;
  timestamp: Date;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface TypingIndicator {
  conversationId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}

export interface PresenceStatus {
  userId: string;
  status: 'ONLINE' | 'AWAY' | 'OFFLINE';
  lastSeen: Date;
}

export interface ReadReceipt {
  messageId: string;
  conversationId: string;
  userId: string;
  readAt: Date;
}