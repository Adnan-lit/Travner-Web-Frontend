// Type-safe interfaces for better type checking based on Travner API documentation

export interface User {
    id: string;
    userName: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    roles?: string[];
    bio?: string | null;
    profileImageUrl?: string | null;
    location?: string | null;
    createdAt?: string;
    lastLoginAt?: string;
    active?: boolean;
}

export interface AdminUser extends User {
    isActive: boolean;
    lastLoginAt?: string;
    profilePictureUrl?: string;
}

export interface SignupRequest {
    userName: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    bio?: string;
    location?: string;
}

export interface UpdateProfileRequest {
    firstName?: string;
    lastName?: string;
    email?: string;
    bio?: string;
    location?: string;
    profileImageUrl?: string;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}

export interface Post {
    id: string;
    title: string;
    content: string;
    location?: string;
    tags?: string[];
    authorId: string;
    authorUsername: string;
    published: boolean;
    upvotes: number;
    downvotes: number;
    commentCount: number;
    createdAt: string;
    updatedAt: string;
    author?: User;
    mediaUrls?: string[];
    status?: string;
}

export interface CreatePostRequest {
    title: string;
    content: string;
    location?: string;
    tags?: string[];
    published: boolean;
}

export interface UpdatePostRequest {
    title?: string;
    content?: string;
    location?: string;
    tags?: string[];
    published?: boolean;
}

export interface VoteRequest {
    isUpvote: boolean;
}

export interface Comment {
    id: string;
    postId: string;
    content: string;
    authorId: string;
    authorUsername: string;
    parentCommentId?: string;
    upvotes: number;
    downvotes: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateCommentRequest {
    content: string;
    parentCommentId?: string;
}

export interface Conversation {
    id: string;
    type: 'DIRECT' | 'GROUP';
    name?: string;
    participants: Array<{
        userId: string;
        username: string;
    }>;
    lastMessage?: string;
    lastMessageAt?: string;
    unreadCount: number;
    createdAt: string;
}

export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    senderUsername: string;
    kind: string;
    body: string;
    attachments: any[];
    replyTo?: string;
    createdAt: string;
    readBy: Array<{
        userId: string;
        readAt: string;
    }>;
}

export interface DiagnosticStep {
    step: string;
    status: string;
    data: any;
}

export interface DiagnosticResults {
    timestamp: string;
    status: string;
    steps: DiagnosticStep[];
}

export interface UserListResponse {
    id: string;
    userName: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    roles?: string[];
    active?: boolean;
    createdAt?: string;
}

export interface UserFilter {
    search: string;
    role: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
}

export interface SystemStats {
    totalUsers: number;
    totalPosts: number;
    totalActiveUsers: number;
    totalAdmins: number;
}

export interface AdminUserResponse {
    id: string;
    userName: string;
    firstName: string;
    lastName: string;
    email: string;
    roles: string[];
    active: boolean;
    createdAt: string;
}

export interface ApiError {
    message: string;
    status?: number;
    error?: string;
}

export interface CreateUserRequest {
    userName: string;
    password: string;
    firstName: string;
    lastName: string;
    email: string;
}