import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { EnvironmentConfig } from '../config/environment.config';
import { User } from '../models/common.model';
import { ErrorHandler, ApiError } from '../utils/error-handler';

export interface SignupRequest {
  userName: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface SignupResponse {
  success?: boolean;
  message?: string;
  user?: any;
  [key: string]: any;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: User;  // User data is directly in data, not data.user
  pagination?: any;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

export interface PasswordResetRequest {
  username: string;
}

export interface PasswordResetConfirmRequest {
  token: string;
  newPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class CentralizedAuthService {
  private readonly API_BASE_URL = EnvironmentConfig.getApiBaseUrl();
  private readonly STORAGE_KEY = 'travner_auth';
  private readonly USER_KEY = 'travner_user';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.checkStoredAuth();
  }

  /**
   * Sign in user with username and password
   */
  signin(username: string, password: string): Observable<User> {
    const credentials = btoa(`${username}:${password}`);
    const headers = new HttpHeaders({
      'Authorization': `Basic ${credentials}`
    });

    const endpoint = `${this.API_BASE_URL}/user`.replace(/([^:])\/\//g, '$1/');

    return this.http.get<AuthResponse>(endpoint, { headers })
      .pipe(
        tap(response => {
          if (response && response.success && response.data) {
            const user = response.data;
            this.setCurrentUser(user);
            this.storeAuthData(username, password, user);
          }
        }),
        catchError(error => {
          this.clearAuthData();
          return this.handleHttpError(error);
        }),
        map(response => {
          if (response && response.success && response.data) {
            return response.data;
          }
          throw new Error('Invalid response format');
        })
      );
  }  /**
   * Create a new user account
   */
  signup(signupData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    userName?: string;
  }): Observable<SignupResponse> {
    const requestBody: SignupRequest = {
      userName: signupData.userName || signupData.email,
      firstName: signupData.firstName,
      lastName: signupData.lastName,
      email: signupData.email,
      password: signupData.password
    };

    const signupUrl = `${this.API_BASE_URL}/public/create-user`.replace(/([^:])\/\//g, '$1/');

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    return this.http.post<SignupResponse>(signupUrl, requestBody, {
      headers,
      withCredentials: false
    }).pipe(
      catchError(error => this.handleHttpError(error))
    );
  }

  /**
   * Sign out the current user
   */
  signout(): void {
    this.clearAuthData();
    this.router.navigate(['/signin']);
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  /**
   * Check if current user has a specific role
   */
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.roles?.includes(role) || false;
  }

  /**
   * Check if current user is an admin
   */
  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  /**
   * Update user profile
   */
  updateProfile(profileData: {
    firstName: string;
    lastName: string;
    email: string;
  }): Observable<{ message: string }> {
    const authData = this.getStoredAuthData();
    if (!authData) {
      throw new Error('No authentication data found');
    }

    const credentials = btoa(`${authData.username}:${authData.password}`);
    const headers = new HttpHeaders({
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    return this.http.patch<{ message: string }>(`${this.API_BASE_URL}/user/profile`, profileData, {
      headers,
      withCredentials: false
    }).pipe(
      tap(response => {
        // Update local user data
        const currentUser = this.getCurrentUser();
        if (currentUser) {
          const updatedUser = { ...currentUser, ...profileData };
          this.setCurrentUser(updatedUser);
          this.storeAuthData(authData.username, authData.password, updatedUser);
        }
      }),
      catchError(error => this.handleHttpError(error))
    );
  }

  /**
   * Change user password
   */
  changePassword(currentPassword: string, newPassword: string): Observable<{ message: string }> {
    const authData = this.getStoredAuthData();
    if (!authData) {
      throw new Error('No authentication data found');
    }

    const credentials = btoa(`${authData.username}:${authData.password}`);
    const headers = new HttpHeaders({
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    const requestBody: PasswordChangeRequest = { currentPassword, newPassword };

    return this.http.put<{ message: string }>(`${this.API_BASE_URL}/user/password`, requestBody, {
      headers,
      withCredentials: false
    }).pipe(
      tap(response => {
        // Update stored credentials with new password
        const currentUser = this.getCurrentUser();
        if (currentUser) {
          this.storeAuthData(authData.username, newPassword, currentUser);
        }
      }),
      catchError(error => this.handleHttpError(error))
    );
  }

  /**
   * Request password reset
   */
  requestPasswordReset(username: string): Observable<{ message: string }> {
    const requestBody: PasswordResetRequest = { username };

    return this.http.post<{ message: string }>(`${this.API_BASE_URL}/public/forgot-password`, requestBody, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }),
      withCredentials: false
    }).pipe(
      catchError(error => this.handleHttpError(error))
    );
  }

  /**
   * Reset password with token
   */
  resetPasswordWithToken(token: string, newPassword: string): Observable<{ message: string }> {
    const requestBody: PasswordResetConfirmRequest = { token, newPassword };

    return this.http.post<{ message: string }>(`${this.API_BASE_URL}/public/reset-password`, requestBody, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }),
      withCredentials: false
    }).pipe(
      catchError(error => this.handleHttpError(error))
    );
  }

  /**
   * Delete user account
   */
  deleteUser(): Observable<any> {
    const authData = this.getStoredAuthData();
    if (!authData) {
      throw new Error('No authentication data found');
    }

    const credentials = btoa(`${authData.username}:${authData.password}`);
    const headers = new HttpHeaders({
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    return this.http.delete(`${this.API_BASE_URL}/user`, {
      headers,
      withCredentials: false
    }).pipe(
      tap(() => {
        this.signout();
      }),
      catchError(error => this.handleHttpError(error))
    );
  }

  /**
   * Set current user and update authentication status
   */
  private setCurrentUser(user: User | null): void {
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(!!user);
  }

  /**
   * Store authentication data securely
   */
  private storeAuthData(username: string, password: string, user: User): void {
    // Simplified: store plain JSON to align with interceptor
    const authData = { username, password };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(authData));
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));

    // Keep WS credentials
    sessionStorage.setItem('current_username', username);
    sessionStorage.setItem('current_password', password);
  }

  /**
   * Get stored authentication data
   */
  private getStoredAuthData(): { username: string; password: string; user: User } | null {
    try {
      const storedAuth = localStorage.getItem(this.STORAGE_KEY);
      const storedUser = localStorage.getItem(this.USER_KEY);
      if (!storedAuth || !storedUser) return null;
      const auth = JSON.parse(storedAuth);
      const user = JSON.parse(storedUser);
      if (!auth?.username || !auth?.password) return null;
      return { username: auth.username, password: auth.password, user };
    } catch (error) {
      console.error('Error retrieving stored auth data:', error);
      return null;
    }
  }

  /**
   * Clear authentication data
   */
  private clearAuthData(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.USER_KEY);
    // Clear WebSocket credentials
    sessionStorage.removeItem('current_username');
    sessionStorage.removeItem('current_password');
    this.setCurrentUser(null);
  }

  /**
   * Check if there's stored authentication data on app initialization
   */
  private checkStoredAuth(): void {
    const storedUser = localStorage.getItem(this.USER_KEY);
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        this.setCurrentUser(user);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        this.clearAuthData();
      }
    }
  }

  /**
   * Refresh user data (re-authenticate with stored credentials)
   */
  refreshUserData(): Observable<User> | null {
    const authData = this.getStoredAuthData();
    if (!authData) {
      return null;
    }

    return this.signin(authData.username, authData.password);
  }

  /**
   * Handle HTTP errors using standardized error handler
   */
  private handleHttpError(error: HttpErrorResponse): Observable<never> {
    const parsedError: ApiError = ErrorHandler.parseHttpError(error);
    console.error('API Error:', parsedError);
    return throwError(parsedError);
  }
}