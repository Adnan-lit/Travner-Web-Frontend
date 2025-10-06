import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PostService } from '../services/post.service';
import { AuthService } from '../services/auth.service';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { isPostOwner } from '../utils/ownership.util';

/**
 * Guard ensuring only the post author can access edit route.
 * If not owner -> redirect to post detail. If not authenticated -> signin.
 */
export const postOwnerGuard: CanActivateFn = (route, state) => {
    const auth = inject(AuthService);
    const posts = inject(PostService);
    const router = inject(Router);
    const id = route.paramMap.get('id');
    if (!id) return router.createUrlTree(['/community']);
    const current = auth.getCurrentUser();
    if (!current) {
        return router.createUrlTree(['/signin'], { queryParams: { returnUrl: state.url } });
    }

    return posts.getPostById(id).pipe(
        map(post => {
            // Handle potential JSON string for current user
            let user: any = current;
            if (typeof user === 'string') {
                try {
                    const parsed = JSON.parse(user);
                    user = parsed.data || parsed;
                } catch (e) {
                    console.error('Failed to parse current user in guard:', e);
                    user = null;
                }
            }

            // Create a PostOwner-compatible object from the Post
            const postOwner = {
                authorId: post.author?.id,
                authorName: post.author?.userName // Use username instead of concatenated names
            };

            const allow = isPostOwner(postOwner, user, 'postOwnerGuard');
            return allow ? true : router.createUrlTree(['/community', id], { queryParams: { denied: 'not-owner' } });
        }),
        catchError(err => {
            try {
                if (localStorage.getItem('travner_debug') === 'true') {
                    console.warn('[postOwnerGuard] error fetching post, redirecting', { id, err });
                }
            } catch { }
            return of(router.createUrlTree(['/community', id]));
        })
    );
};
