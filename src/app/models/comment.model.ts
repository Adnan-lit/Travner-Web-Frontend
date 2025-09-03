export interface Comment {
    id: string;
    content: string;
    authorId: string;
    authorName: string;
    postId: string;
    parentId?: string;
    createdAt: string;
    updatedAt: string;
    upvotes: number;
    downvotes: number;
    replies?: Comment[];
    hasUserUpvoted?: boolean;
    hasUserDownvoted?: boolean;
}

export interface CommentCreate {
    content: string;
    parentId?: string;
}

export interface CommentUpdate {
    content: string;
}

export interface CommentsResponse {
    content: Comment[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}
