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
    comments?: number;
    isLiked?: boolean;
    createdAt: string;
    updatedAt: string;
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

// API Response types
export type PostListResponse = ApiResponse<Post[]> & {
    pagination: ApiPaginationInfo;
};

export type PostResponse = ApiResponse<Post>;
export type CommentResponse = ApiResponse<Comment>;
export type CommentListResponse = ApiResponse<Comment[]> & {
    pagination: ApiPaginationInfo;
};