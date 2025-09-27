export interface ChatMessage {
    id: string;
    content: string;
    senderId: string;
    senderName: string;
    roomId: string;
    timestamp: string;
    type?: 'text' | 'image' | 'file';
    readBy?: string[];
}

export interface ChatUser {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
    online: boolean;
    lastSeen?: string;
}

export interface ChatRoom {
    id: string;
    name: string;
    description?: string;
    type: 'private' | 'public' | 'group';
    participants: string[];
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    lastMessage?: ChatMessage;
    unreadCount?: number;
}

export interface ChatRoomCreate {
    name: string;
    description?: string;
    type: 'private' | 'public' | 'group';
    participantIds?: string[];
}

export interface ChatRoomUpdate {
    name?: string;
    description?: string;
    type?: 'private' | 'public' | 'group';
}

export interface ChatRoomsResponse {
    content: ChatRoom[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}

export interface ChatMessagesResponse {
    content: ChatMessage[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}