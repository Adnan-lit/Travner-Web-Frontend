import { User } from './common.model';
import { ApiResponse, ApiPaginationInfo } from './api-response.model';

// Media model
export interface Media {
    id: string;
    url: string;
    type: 'image' | 'video';
    caption?: string;
    fileType?: string;
    fileUrl?: string;
    fileName?: string;
    createdAt: string;
}

// Post models
export interface Post {
    id: string;
    title: string;
    content: string;
    author?: User;
    authorId?: string;
    authorName?: string;
    location?: string;
    tags?: string[];
    mediaUrls?: string[];
    likes?: number;
    comments?: Comment[];
    views?: number;
    isLiked?: boolean;
    createdAt: string;
    updatedAt: string;
    status?: string;
}

export interface PostCreate {
    title: string;
    content: string;
    location?: string;
    tags?: string[];
}

export interface PostUpdate {
    title?: string;
    content?: string;
    location?: string;
    tags?: string[];
    published?: boolean;
}

// Comment models
export interface Comment {
    id: string;
    content: string;
    author?: User;
    authorId?: string;
    authorName?: string;
    postId: string;
    likes?: number;
    isLiked?: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CommentCreate {
    content: string;
    postId: string;
}

// Search and pagination
export interface PostSearchParams {
    page?: number;
    size?: number;
    sortBy?: string;
    direction?: 'asc' | 'desc';
    query?: string;
    location?: string;
    tags?: string[];
    authorId?: string;
    status?: string;
}

// API Response types
export type PostListResponse = ApiResponse<Post[]> & {
    pagination: ApiPaginationInfo;
};

export type PostResponse = ApiResponse<Post>;
export type CommentResponse = ApiResponse<Comment>;
export type CommentListResponse = ApiResponse<Comment[]> & {
    pagination: ApiPaginationInfo;
};

// Admin post interfaces
export interface AdminPost extends Post {
    status: string;
    reportedCount?: number;
    violationType?: string;
}

export interface PostFilter {
    status?: string;
    reported?: boolean;
    startDate?: string;
    endDate?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}