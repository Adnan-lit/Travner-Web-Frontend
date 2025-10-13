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

    // If not authenticated or not admin, redirect to dashboard or sign-in
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/signin']);
    } else {
      this.router.navigate(['/dashboard']);
    }
    return of(false);
  }
}