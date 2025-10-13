import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
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

  canActivate(): Observable<boolean> {
    // Check if user is authenticated
    if (this.authService.isAuthenticated()) {
      // If authenticated, redirect to dashboard
      this.router.navigate(['/dashboard']);
      return of(false);
    }

    // If not authenticated, allow access
    return of(true);
  }
}