import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { EnvironmentConfig } from '../config/environment.config';
import { SecureStorage } from '../utils/secure-storage';
import { User } from '../models/common.model';

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
  data?: {
    user: User;
  };
}

@Injectable({
  providedIn: 'root'
})
export class SecureAuthService {
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
          if (response && response.success && response.data?.user) {
            const user = response.data.user;
            this.setCurrentUser(user);
            this.storeAuthData(username, password, user);
          }
        }),
        catchError(error => {
          this.clearAuthData();
          throw error;
        })
      ).pipe(
        map(response => {
          if (response && response.success && response.data?.user) {
            return response.data.user;
          }
          throw new Error('Invalid response format');
        })
      ) as Observable<User>;
  }

  /**
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
    });
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
    // Generate encryption key
    const encryptionKey = SecureStorage.generateEncryptionKey();
    
    // Store encrypted credentials
    const authData = { username, password };
    SecureStorage.setEncryptedItem(this.STORAGE_KEY, JSON.stringify(authData), encryptionKey);
    
    // Store user data
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    
    // Store encryption key (in a real app, this should be more secure)
    sessionStorage.setItem('encryption_key', encryptionKey);
  }

  /**
   * Get stored authentication data
   */
  private getStoredAuthData(): { username: string; password: string; user: User } | null {
    try {
      // Retrieve encryption key
      const encryptionKey = sessionStorage.getItem('encryption_key');
      if (!encryptionKey) {
        return null;
      }

      // Retrieve and decrypt auth data
      const encryptedAuthData = localStorage.getItem(this.STORAGE_KEY);
      if (!encryptedAuthData) {
        return null;
      }

      const decryptedAuthData = SecureStorage.getEncryptedItem(this.STORAGE_KEY, encryptionKey);
      if (!decryptedAuthData) {
        return null;
      }

      const authData = JSON.parse(decryptedAuthData);
      
      // Retrieve user data
      const storedUser = localStorage.getItem(this.USER_KEY);
      if (!storedUser) {
        return null;
      }

      const userData = JSON.parse(storedUser);
      
      return {
        username: authData.username,
        password: authData.password,
        user: userData
      };
    } catch (error) {
      console.error('Error retrieving stored auth data:', error);
      return null;
    }
  }

  /**
   * Clear authentication data
   */
  private clearAuthData(): void {
    SecureStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.USER_KEY);
    sessionStorage.removeItem('encryption_key');
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
}