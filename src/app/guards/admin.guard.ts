import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Admin guard to protect admin-only routes.
 */
export const adminGuard: CanActivateFn = (route, state): boolean | UrlTree => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (auth.isAuthenticated() && auth.isAdmin()) {
        return true;
    }
    return router.createUrlTree(['/signin'], { queryParams: { returnUrl: state.url } });
};
