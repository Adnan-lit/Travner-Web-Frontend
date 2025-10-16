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
    likes?: number;
    shares?: number;
    comments?: Comment[];
    views?: number;
    createdAt: string;
    updatedAt: string;
    author?: User;
    media?: MediaFile[];
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

// Public API interfaces
export interface PublicUser {
    id: string;
    userName: string;
    firstName?: string;
    lastName?: string;
    bio?: string | null;
    profileImageUrl?: string | null;
    location?: string | null;
    createdAt?: string;
}

export interface HealthCheckResponse {
    status: string;
    timestamp: string;
}

// Chat interfaces
export interface ChatMessage {
    id: string;
    conversationId: string;
    senderId: string;
    senderUsername: string;
    content: string;
    kind: 'TEXT' | 'IMAGE' | 'FILE';
    attachments?: any[];
    replyTo?: string;
    createdAt: string;
    readBy: Array<{
        userId: string;
        readAt: string;
    }>;
}

export interface CreateConversationRequest {
    type: 'DIRECT' | 'GROUP';
    memberIds: string[];
    name?: string;
}

export interface AddMembersRequest {
    memberIds: string[];
}

export interface MarkReadRequest {
    lastReadMessageId?: string;
}

// Media interfaces
export interface MediaFile {
    id: string;
    url: string;
    type: 'image' | 'video';
    caption?: string;
    fileType?: string;
    fileUrl?: string;
    fileName?: string;
    createdAt: string;
}

export interface UploadMediaRequest {
    files: File[];
    type: 'image' | 'video';
}

// Admin interfaces
export interface ActivateUserRequest {
    active: boolean;
}

export interface AdminPost {
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
    status: string;
}

export interface AdminProduct {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    stockQuantity: number;
    location: string;
    tags: string[];
    images: string[];
    sellerId: string;
    sellerUsername: string;
    isAvailable: boolean;
    status: string;
    createdAt: string;
    updatedAt: string;
}