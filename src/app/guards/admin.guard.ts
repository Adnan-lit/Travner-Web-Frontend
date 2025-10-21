import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, of } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    console.log('🔐 AdminGuard: Checking admin access');
    console.log('🔐 AdminGuard: Is authenticated?', this.authService.isAuthenticated());
    console.log('🔐 AdminGuard: Is admin?', this.authService.isAdmin());
    
    // Use the observable to ensure we have the latest auth state
    return this.authService.currentUser$.pipe(
      take(1),
      map(user => {
        console.log('🔐 AdminGuard: Current user from observable:', user);
        
        const isAuthenticated = !!user;
        const isAdmin = user && user.roles ? user.roles.includes('ADMIN') : false;
        
        console.log('🔐 AdminGuard: Is authenticated (from observable)?', isAuthenticated);
        console.log('🔐 AdminGuard: Is admin (from observable)?', isAdmin);
        console.log('🔐 AdminGuard: User roles:', user?.roles);
        
        if (isAuthenticated && isAdmin) {
          console.log('✅ AdminGuard: Access granted - user is admin');
          return true;
        }

        // If not authenticated, redirect to sign-in
        if (!isAuthenticated) {
          console.log('❌ AdminGuard: User not authenticated, redirecting to signin');
          this.router.navigate(['/signin']);
        } else {
          // User is authenticated but not admin, redirect to dashboard
          console.log('❌ AdminGuard: User authenticated but not admin, redirecting to dashboard');
          this.router.navigate(['/dashboard']);
        }
        return false;
      })
    );
  }
}