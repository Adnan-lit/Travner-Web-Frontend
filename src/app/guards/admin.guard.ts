import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    // Check if user is authenticated and has admin role
    if (this.authService.isAuthenticated() && this.authService.isAdmin()) {
      return of(true);
    }

    // If not authenticated, redirect to sign-in
    if (!this.authService.isAuthenticated()) {
      console.log('AdminGuard: User not authenticated, redirecting to signin');
      this.router.navigate(['/signin']);
    } else {
      // User is authenticated but not admin, redirect to dashboard
      console.log('AdminGuard: User authenticated but not admin, redirecting to dashboard');
      this.router.navigate(['/dashboard']);
    }
    return of(false);
  }
}