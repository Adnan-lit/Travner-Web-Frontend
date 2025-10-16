import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

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
    
    // Check if user is authenticated
    if (this.authService.isAuthenticated()) {
      console.log('✅ AuthGuard: User is authenticated');
      return of(true);
    }

    // If not authenticated, redirect to sign-in page with return URL
    console.log('❌ AuthGuard: User not authenticated, redirecting to signin');
    this.router.navigate(['/signin'], {
      queryParams: { returnUrl: state.url }
    });
    return of(false);
  }
}