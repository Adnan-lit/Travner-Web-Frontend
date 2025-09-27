import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard to prevent authenticated users from accessing auth pages (signin/signup).
 */
export const noAuthGuard: CanActivateFn = (route, state): boolean | UrlTree => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (auth.isAuthenticated()) {
        // Redirect authenticated user trying to access signin/signup
        const returnUrl = route.queryParams['returnUrl'] || '/dashboard';
        return router.createUrlTree([returnUrl]);
    }
    return true;
};
