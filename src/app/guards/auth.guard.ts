import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    // Check if user is authenticated
    if (this.authService.isAuthenticated()) {
      return of(true);
    }

    // If not authenticated, redirect to sign-in page
    this.router.navigate(['/signin']);
    return of(false);
  }
}