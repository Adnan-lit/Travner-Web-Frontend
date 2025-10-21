import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NoAuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    console.log('🔐 NoAuthGuard: Checking if user should access auth pages:', state.url);
    
    // Use the observable to ensure we have the latest auth state
    return this.authService.currentUser$.pipe(
      take(1),
      map(user => {
        const isAuthenticated = !!user;
        
        if (isAuthenticated) {
          console.log('✅ NoAuthGuard: User is authenticated, redirecting to appropriate page');
          // Check if user is admin and redirect accordingly
          const isAdmin = user.roles ? user.roles.includes('ADMIN') : false;
          if (isAdmin) {
            this.router.navigate(['/admin']);
          } else {
            this.router.navigate(['/dashboard']);
          }
          return false;
        }

        // If not authenticated, allow access to auth pages
        console.log('✅ NoAuthGuard: User not authenticated, allowing access to auth pages');
        return true;
      })
    );
  }
}