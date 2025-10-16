import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * Authentication Status Service
 * Centralizes authentication state management across the application
 */
@Injectable({
  providedIn: 'root'
})
export class AuthStatusService {
  private authStatusSubject = new BehaviorSubject<boolean>(false);
  private currentUserSubject = new BehaviorSubject<any>(null);
  private userRolesSubject = new BehaviorSubject<string[]>([]);

  public authStatus$ = this.authStatusSubject.asObservable();
  public currentUser$ = this.currentUserSubject.asObservable();
  public userRoles$ = this.userRolesSubject.asObservable();

  constructor(private authService: AuthService) {
    this.initializeAuthStatus();
  }

  /**
   * Initialize authentication status from AuthService
   */
  private initializeAuthStatus(): void {
    // Subscribe to AuthService changes
    this.authService.currentUser$.subscribe(user => {
      this.currentUserSubject.next(user);
      this.authStatusSubject.next(!!user);
      
      if (user && user.roles) {
        this.userRolesSubject.next(user.roles);
      } else {
        this.userRolesSubject.next([]);
      }
    });

    // Subscribe to authentication status changes
    this.authService.isAuthenticated$.subscribe(isAuthenticated => {
      this.authStatusSubject.next(isAuthenticated);
    });
  }

  /**
   * Get current authentication status
   */
  isAuthenticated(): boolean {
    return this.authStatusSubject.value;
  }

  /**
   * Get current user
   */
  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }

  /**
   * Get current user roles
   */
  getUserRoles(): string[] {
    return this.userRolesSubject.value;
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    const roles = this.getUserRoles();
    return roles.includes(role);
  }

  /**
   * Check if user is admin
   */
  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  /**
   * Check if user is regular user
   */
  isUser(): boolean {
    return this.hasRole('USER');
  }

  /**
   * Get authentication status as observable
   */
  getAuthStatus(): Observable<boolean> {
    return this.authStatus$;
  }

  /**
   * Get current user as observable
   */
  getCurrentUserObservable(): Observable<any> {
    return this.currentUser$;
  }

  /**
   * Get user roles as observable
   */
  getUserRolesObservable(): Observable<string[]> {
    return this.userRoles$;
  }

  /**
   * Log authentication status for debugging
   */
  logAuthStatus(): void {
    console.log('🔐 AuthStatus:', {
      isAuthenticated: this.isAuthenticated(),
      currentUser: this.getCurrentUser(),
      userRoles: this.getUserRoles(),
      isAdmin: this.isAdmin(),
      isUser: this.isUser()
    });
  }
}

