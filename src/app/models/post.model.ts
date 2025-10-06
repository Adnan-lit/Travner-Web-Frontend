export interface Post {
    id: string;
    title: string;
    content: string;
    location: string;
    tags: string[];
    author: {
        id: {
            timestamp: number;
            date: string;
        };
        userName: string;
        firstName: string;
        lastName: string;
    };
    createdAt: string;
    updatedAt: string;
    upvotes: number;
    downvotes: number;
    commentCount: number;
    mediaUrls?: string[];
    published?: boolean;
}

export interface PostCreate {
    title: string;
    content: string;
    location: string;
    tags: string[];
    mediaIds?: string[];
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
