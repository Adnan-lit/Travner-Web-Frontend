// Chat models based on Travner API specification
// Direct conversations only (no group chats for MVP)

export interface ChatConversation {
    id: string;
    type: 'DIRECT';
    members: ChatUser[];
    createdAt: string;
    updatedAt: string;
    lastMessage?: ChatMessage;
    unreadCount?: number;
}

export interface ChatUser {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    displayName?: string;
    online?: boolean;
    lastSeen?: string;
}

export interface ChatMessage {
    id: string;
    conversationId: string;
    senderId: string;
    senderUsername: string;
    content: string;
    kind: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
    createdAt: string;
    updatedAt?: string;
    edited?: boolean;
    replyToMessageId?: string;
    replyToMessage?: ChatMessage;
    attachments?: ChatAttachment[];
    readBy?: ChatMessageRead[];
}

export interface ChatAttachment {
    mediaId: string;
    caption?: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
}

export interface ChatMessageRead {
    userId: string;
    username: string;
    readAt: string;
}

export interface ChatConversationCreate {
    type: 'DIRECT';
    memberIds: string[];
}

export interface ChatMessageCreate {
    conversationId: string;
    content: string;
    kind: 'TEXT' | 'IMAGE' | 'FILE';
    replyToMessageId?: string;
    attachments?: {
        mediaId: string;
        caption?: string;
    }[];
}

export interface ChatMessageUpdate {
    content: string;
}

export interface ChatTypingIndicator {
    conversationId: string;
    isTyping: boolean;
}

export interface ChatMarkAsRead {
    conversationId: string;
    lastReadMessageId: string;
}

// WebSocket message types
export interface WebSocketMessage {
    type: 'SEND_MESSAGE' | 'TYPING' | 'MESSAGE_RECEIVED' | 'TYPING_STATUS';
    conversationId?: string;
    content?: string;
    kind?: 'TEXT' | 'IMAGE' | 'FILE';
    isTyping?: boolean;
    message?: ChatMessage;
    userId?: string;
}

// Response wrappers
export interface ChatConversationsResponse {
    content: ChatConversation[];
    pagination: {
        page: number;
        size: number;
        totalElements: number;
        totalPages: number;
        first: boolean;
        last: boolean;
    };
}

export interface ChatMessagesResponse {
    content: ChatMessage[];
    pagination: {
        page: number;
        size: number;
        totalElements: number;
        totalPages: number;
        first: boolean;
        last: boolean;
    };
}