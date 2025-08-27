import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { Router } from '@angular/router';

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
    [key: string]: any; // Allow any additional properties
}

export interface User {
    id?: string;
    userName: string;
    firstName: string;
    lastName: string;
    email: string;
    roles?: string[];
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    // API URL configuration for different environments
    private readonly API_BASE_URL = this.getApiBaseUrl();

    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();
    private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
    public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

    constructor(
        private http: HttpClient,
        private router: Router
    ) {
        console.log('🚀 AuthService initialized');
        console.log('🌐 Environment:', this.isProduction() ? 'Production' : 'Development');
        console.log('🔗 API Base URL:', this.API_BASE_URL);
        console.log('🌍 Frontend Origin:', window.location.origin);
        // Check if user is already logged in on service initialization
        this.checkStoredAuth();
    }

    /**
     * Determine the appropriate API base URL based on environment
     */
    private getApiBaseUrl(): string {
        // Check if we're in production (Vercel deployment)
        if (this.isProduction()) {
            return 'https://travner-backend.up.railway.app';
        } else {
            // Development environment
            return 'https://travner-backend.up.railway.app';
        }
    }

    /**
     * Check if we're running in production environment
     */
    private isProduction(): boolean {
        return window.location.hostname !== 'localhost' &&
            window.location.hostname !== '127.0.0.1' &&
            !window.location.hostname.includes('localhost');
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
            userName: signupData.userName || signupData.email, // Use email as username if not provided
            firstName: signupData.firstName,
            lastName: signupData.lastName,
            email: signupData.email,
            password: signupData.password
        };

        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        });

        return this.http.post<any>(`${this.API_BASE_URL}/public/create-user`, requestBody, {
            headers,
            withCredentials: false // Signup doesn't need credentials
        })
            .pipe(
                tap(response => {
                    console.log('Signup response:', response);
                }),
                catchError(error => {
                    console.error('Signup error:', error);
                    throw error;
                })
            );
    }

    /**
     * Sign in user with username and password
     */
    signin(username: string, password: string): Observable<User> {
        const credentials = btoa(`${username}:${password}`); // Base64 encode for basic auth
        const headers = new HttpHeaders({
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest' // Prevents browser auth popup
        });

        console.log('Attempting signin with username:', username);
        console.log('API URL:', `${this.API_BASE_URL}/user`);
        console.log('Request headers:', headers);

        return this.http.get<any>(`${this.API_BASE_URL}/user`, {
            headers,
            withCredentials: false, // Changed to false to prevent browser auth popup
            observe: 'response' // Get full response to handle status codes properly
        })
            .pipe(
                map(response => {
                    console.log('Raw signin response:', response);

                    const body = response.body;
                    // Handle different response formats
                    let user: User;
                    if (body.userName || body.username) {
                        // Response is already in the right format or similar
                        user = {
                            id: body.id,
                            userName: body.userName || body.username,
                            firstName: body.firstName || body.firstname,
                            lastName: body.lastName || body.lastname,
                            email: body.email,
                            roles: body.roles || []
                        };
                    } else {
                        // Fallback - use the response as is and hope it has the right structure
                        user = body as User;
                    }

                    return user;
                }),
                tap(user => {
                    // Store authentication data
                    this.setCurrentUser(user);
                    this.storeAuthData(username, password, user);
                    console.log('Sign in successful, processed user:', user);
                }),
                catchError(error => {
                    console.error('🔴 Sign in error details:', {
                        status: error.status,
                        statusText: error.statusText,
                        error: error.error,
                        message: error.message,
                        url: error.url,
                        headers: error.headers
                    });

                    // Clear any stored auth data on error
                    this.clearAuthData();

                    // Handle specific error cases
                    if (error.status === 401) {
                        console.error('🚫 Authentication failed: Invalid credentials');
                        // Don't re-throw 401 errors to prevent browser auth popup
                        const authError = new Error('Invalid username or password');
                        (authError as any).status = 401;
                        throw authError;
                    } else if (error.status === 0) {
                        console.error('🚨 CORS/Network Error Detected:');
                        console.error('- Backend @CrossOrigin may not be working');
                        console.error('- Check browser Network tab for preflight requests');
                        console.error('- Verify backend allows:', window.location.origin);
                        const networkError = new Error('Network connection failed. Please check your connection and try again.');
                        (networkError as any).status = 0;
                        throw networkError;
                    } else {
                        // For other errors, throw as-is
                        throw error;
                    }
                })
            );
    }

    /**
     * Delete the current user account
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
            withCredentials: true
        })
            .pipe(
                tap(() => {
                    console.log('User deleted successfully');
                    this.logout();
                }),
                catchError(error => {
                    console.error('Delete user error:', error);
                    throw error;
                })
            );
    }

    /**
     * Sign out the current user
     */
    logout(): void {
        this.clearAuthData();
        this.router.navigate(['/']);
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
     * Set current user and update authentication status
     */
    private setCurrentUser(user: User | null): void {
        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(!!user);
    }

    /**
     * Store authentication data in localStorage
     */
    private storeAuthData(username: string, password: string, user: User): void {
        const authData = {
            username,
            password, // Note: In production, consider using tokens instead of storing passwords
            user
        };
        localStorage.setItem('travner_auth', JSON.stringify(authData));
    }

    /**
     * Get stored authentication data
     */
    private getStoredAuthData(): { username: string; password: string; user: User } | null {
        const stored = localStorage.getItem('travner_auth');
        return stored ? JSON.parse(stored) : null;
    }

    /**
     * Clear authentication data
     */
    private clearAuthData(): void {
        localStorage.removeItem('travner_auth');
        this.setCurrentUser(null);
    }

    /**
     * Check if there's stored authentication data on app initialization
     */
    private checkStoredAuth(): void {
        const authData = this.getStoredAuthData();
        if (authData && authData.user) {
            this.setCurrentUser(authData.user);
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