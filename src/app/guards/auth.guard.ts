import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Auth guard to protect routes requiring authentication.
 * Redirects to /signin with returnUrl if not authenticated.
 */
export const authGuard: CanActivateFn = (route, state): boolean | UrlTree => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (auth.isAuthenticated()) {
        return true;
    }
    return router.createUrlTree(['/signin'], { queryParams: { returnUrl: state.url } });
};
