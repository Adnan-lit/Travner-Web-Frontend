/** Shared ownership utility for determining if a user owns a post. */

export interface PostOwner {
    authorId?: string | number | { timestamp: number; date: string };
    authorName?: string;
}

export interface UserIdentity {
    id?: string | number | { timestamp: number; date: string };
    userName?: string;
}

export function isPostOwner(
    post: PostOwner | null | undefined,
    user: UserIdentity | null | undefined,
    debugNamespace: string = 'Ownership'
): boolean {
    if (!post || !user) return false;

    // Handle complex ID structure from API
    let currentId: string | null = null;
    if (user.id != null) {
        if (typeof user.id === 'object' && 'timestamp' in user.id) {
            // Complex ID object with timestamp
            currentId = String(user.id.timestamp);
        } else {
            // Simple string or number ID
            currentId = String(user.id);
        }
    }

    let authorId: string | null = null;
    if (post.authorId != null) {
        if (typeof post.authorId === 'object' && 'timestamp' in post.authorId) {
            // Complex ID object with timestamp
            authorId = String(post.authorId.timestamp);
        } else {
            // Simple string or number ID
            authorId = String(post.authorId);
        }
    }

    if (currentId && authorId && currentId === authorId) return true;

    const currentUsername = user.userName ? user.userName.toLowerCase() : null;
    const authorUsername = post.authorName ? post.authorName.toLowerCase() : null;
    const usernameMatch = !!currentUsername && !!authorUsername && currentUsername === authorUsername;

    try {
        if (localStorage.getItem('travner_debug') === 'true' && !usernameMatch && !(currentId && authorId && currentId === authorId)) {
            console.debug(`[${debugNamespace}] ownership check failed`, {
                postAuthorId: authorId,
                postAuthorName: authorUsername,
                currentUserId: currentId,
                currentUsername
            });
        }
    } catch { /* ignore */ }

    return usernameMatch;
}
