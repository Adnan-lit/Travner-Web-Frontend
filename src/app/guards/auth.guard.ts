import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, of } from 'rxjs';
import { map, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    console.log('🔐 AuthGuard: Checking authentication for route:', state.url);
    console.log('🔐 AuthGuard: Is authenticated (sync)?', this.authService.isAuthenticated());
    
    // Use the observable to ensure we have the latest auth state
    return this.authService.currentUser$.pipe(
      take(1),
      map(user => {
        const isAuthenticated = !!user;
        console.log('🔐 AuthGuard: Current user:', user?.userName);
        console.log('🔐 AuthGuard: Is authenticated (observable)?', isAuthenticated);
        
        if (isAuthenticated) {
          console.log('✅ AuthGuard: User is authenticated');
          return true;
        }

        // If not authenticated, redirect to sign-in page with return URL
        console.log('❌ AuthGuard: User not authenticated, redirecting to signin');
        this.router.navigate(['/signin'], {
          queryParams: { returnUrl: state.url }
        });
        return false;
      })
    );
  }
}