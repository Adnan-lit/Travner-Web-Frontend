import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PostOwnerGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/signin']);
      return of(false);
    }

    // Get the post ID from the route
    const postId = route.params['id'];
    
    // In a real implementation, you would make an API call to verify
    // that the current user is the owner of the post
    // For now, we'll just check if the user is authenticated
    // and allow access (this would be enhanced in a real app)
    
    return of(true);
  }
}