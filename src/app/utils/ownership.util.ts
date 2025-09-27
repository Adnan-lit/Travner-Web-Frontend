/** Shared ownership utility for determining if a user owns a post. */
export function isPostOwner(post: { authorId?: any; authorName?: string } | null | undefined,
    user: { id?: any; userName?: string } | null | undefined,
    debugNamespace: string = 'Ownership'): boolean {
    if (!post || !user) return false;
    const currentId = user.id != null ? String(user.id) : null;
    const authorId = post.authorId != null ? String(post.authorId) : null;
    if (currentId && authorId && currentId === authorId) return true;
    const currentUsername = user.userName ? user.userName.toLowerCase() : null;
    const authorUsername = post.authorName ? post.authorName.toLowerCase() : null;
    const usernameMatch = !!currentUsername && !!authorUsername && currentUsername === authorUsername;
    try {
        if (localStorage.getItem('travner_debug') === 'true' && !usernameMatch && !(currentId && authorId && currentId === authorId)) {
            console.debug(`[${debugNamespace}] ownership check failed`, { postAuthorId: authorId, postAuthorName: authorUsername, currentUserId: currentId, currentUsername });
        }
    } catch { /* ignore */ }
    return usernameMatch;
}
