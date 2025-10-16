import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

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
    
    // Check if user is authenticated
    if (this.authService.isAuthenticated()) {
      console.log('✅ NoAuthGuard: User is authenticated, redirecting to dashboard');
      // If authenticated, redirect to dashboard
      this.router.navigate(['/dashboard']);
      return of(false);
    }

    // If not authenticated, allow access to auth pages
    console.log('✅ NoAuthGuard: User not authenticated, allowing access to auth pages');
    return of(true);
  }
}