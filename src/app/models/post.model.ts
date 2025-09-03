export interface Post {
    id: string;
    title: string;
    content: string;
    location: string;
    tags: string[];
    authorId: string;
    authorName: string;
    createdAt: string;
    updatedAt: string;
    upvotes: number;
    downvotes: number;
    mediaUrls?: string[];
    hasUserUpvoted?: boolean;
    hasUserDownvoted?: boolean;
    published?: boolean;
}

export interface PostCreate {
    title: string;
    content: string;
    location: string;
    tags: string[];
    published?: boolean;
}

export interface PostUpdate {
    title?: string;
    content?: string;
    location?: string;
    tags?: string[];
    published?: boolean;
}

export interface PostsResponse {
    content: Post[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}
