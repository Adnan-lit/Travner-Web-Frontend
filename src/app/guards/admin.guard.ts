import { logger } from '../core/logging/logger';
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  canActivate(): Observable<boolean> {
    logger.debug('admin-guard.check');

    // Use the observable to ensure we have the latest auth state
    return this.authService.currentUser$.pipe(
      take(1),
      map((user) => {
        const isAuthenticated = !!user;
        const isAdmin = user && user.roles ? user.roles.includes('ADMIN') : false;

        logger.debug('admin-guard.result', isAuthenticated, isAdmin);

        if (isAuthenticated && isAdmin) {
          logger.debug('✅ AdminGuard: Access granted - user is admin');
          return true;
        }

        // If not authenticated, redirect to sign-in
        if (!isAuthenticated) {
          logger.debug('❌ AdminGuard: User not authenticated, redirecting to signin');
          this.router.navigate(['/signin']);
        } else {
          // User is authenticated but not admin, redirect to dashboard
          logger.debug('❌ AdminGuard: User authenticated but not admin, redirecting to dashboard');
          this.router.navigate(['/dashboard']);
        }
        return false;
      }),
    );
  }
}
