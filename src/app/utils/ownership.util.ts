import { User } from '../models/common.model';

/**
 * Check if the current user is the owner of a post
 * @param post The post to check ownership for
 * @param currentUser The current authenticated user
 * @returns boolean indicating if the user owns the post
 */
export function isPostOwner(post: any, currentUser: User | null): boolean {
    if (!post || !currentUser) {
        return false;
    }

    // Check if post has an author field with an id
    if (post.author && post.author.id) {
        return post.author.id === currentUser.id;
    }

    // Check if post has an authorId field
    if (post.authorId) {
        return post.authorId === currentUser.id;
    }

    // Fallback: check if post has an id field that matches currentUser.id
    if (post.id) {
        return post.id === currentUser.id;
    }

    return false;
}

/**
 * Check if the current user is the owner of a comment
 * @param comment The comment to check ownership for
 * @param currentUser The current authenticated user
 * @returns boolean indicating if the user owns the comment
 */
export function isCommentOwner(comment: any, currentUser: User | null): boolean {
    if (!comment || !currentUser) {
        return false;
    }

    // Check if comment has a userId field
    if (comment.userId) {
        return comment.userId === currentUser.id;
    }

    // Check if comment has an author field with an id
    if (comment.author && comment.author.id) {
        return comment.author.id === currentUser.id;
    }

    return false;
}