import { User } from './common.model';
import { ApiResponse, ApiPaginationInfo } from './api-response.model';

export interface ChatMessage {
    id: string;
    content: string;
    sender: User;
    receiver: User;
    timestamp: string;
    isRead: boolean;
}

export interface ChatRoom {
    id: string;
    participants: User[];
    lastMessage?: ChatMessage;
    unreadCount: number;
    createdAt: string;
    updatedAt: string;
}

export type ChatMessageResponse = ApiResponse<ChatMessage>;
export type ChatMessageListResponse = ApiResponse<ChatMessage[]> & {
    pagination: ApiPaginationInfo;
};

export type ChatRoomResponse = ApiResponse<ChatRoom>;
export type ChatRoomListResponse = ApiResponse<ChatRoom[]> & {
    pagination: ApiPaginationInfo;
};