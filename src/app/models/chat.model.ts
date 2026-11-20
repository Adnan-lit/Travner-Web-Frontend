// Chat Models

/** Display-safe participant summary returned by the backend (P2-02). */
export interface ChatParticipant {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  /** Resolved display name — never a raw ObjectId or "Unknown User". */
  senderUsername: string;
  sender?: ChatParticipant;
  content: string;
  messageType: 'TEXT' | 'IMAGE' | 'FILE';
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
  replyToMessageId?: string;
  readBy: string[];
  status: 'SENT' | 'DELIVERED' | 'READ';
}

export interface ChatConversation {
  id: string;
  participantIds: string[];
  /** Resolved participant summaries (P2-02). */
  participants?: ChatUser[];
  title: string;
  type: 'DIRECT' | 'GROUP';
  lastMessage?: string;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
  /** Per-participant unread counts keyed by user ID (P2-02). */
  unreadCounts?: Record<string, number>;
  unreadCount: number;
  isActive: boolean;
}

export interface TypingIndicator {
  conversationId: string;
  userId: string;
  username: string;
  isTyping: boolean;
  timestamp: number;
}

export interface SendMessageRequest {
  conversationId: string;
  content: string;
  messageType: 'TEXT' | 'IMAGE' | 'FILE';
  replyToMessageId?: string;
}

export interface ChatUser {
  id: string;
  username: string;
  /** Alternate casing used by the legacy User model. */
  userName?: string;
  /** Preferred display label from the backend participant summary. */
  displayName?: string;
  avatarUrl?: string | null;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  isOnline: boolean;
  lastSeen?: string;
}

export interface ConversationWithParticipants extends ChatConversation {
  participants: ChatUser[];
  otherParticipant?: ChatUser;
}
