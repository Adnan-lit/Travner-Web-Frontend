import { logger } from '../core/logging/logger';
import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    logger.debug('auth-guard.check', this.authService.isAuthenticated());

    // Use the observable to ensure we have the latest auth state
    return this.authService.currentUser$.pipe(
      take(1),
      map((user) => {
        const isAuthenticated = !!user;
        logger.debug('auth-guard.result', isAuthenticated);

        if (isAuthenticated) {
          logger.debug('✅ AuthGuard: User is authenticated');
          return true;
        }

        // If not authenticated, redirect to sign-in page with return URL
        logger.debug('❌ AuthGuard: User not authenticated, redirecting to signin');
        this.router.navigate(['/signin'], {
          queryParams: { returnUrl: state.url },
        });
        return false;
      }),
    );
  }
}
