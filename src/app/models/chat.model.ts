// Chat Models
export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderUsername: string;
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
  title: string;
  type: 'DIRECT' | 'GROUP';
  lastMessage?: string;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
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







