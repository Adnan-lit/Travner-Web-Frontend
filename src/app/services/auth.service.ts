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
        // Check if user is already logged in on service initialization
        this.checkStoredAuth();
    }

    /**
     * Determine the appropriate API base URL based on environment
     */
    private getApiBaseUrl(): string {
        // For local development, use localhost if backend is running locally
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            // First try localhost:8080 for local development
            return 'http://localhost:8080';
        } else {
            // Production environment - use Railway deployment
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
                catchError(error => {
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

        return this.http.get<any>(`${this.API_BASE_URL}/user`, {
            headers,
            withCredentials: false, // Changed to false to prevent browser auth popup
            observe: 'response' // Get full response to handle status codes properly
        })
            .pipe(
                map(response => {
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
                }),
                catchError(error => {
                    // Clear any stored auth data on error
                    this.clearAuthData();

                    // Handle specific error cases
                    if (error.status === 401) {
                        // Don't re-throw 401 errors to prevent browser auth popup
                        const authError = new Error('Invalid username or password');
                        (authError as any).status = 401;
                        throw authError;
                    } else if (error.status === 0) {
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
            withCredentials: false
        })
            .pipe(
                tap(() => {
                    this.logout();
                }),
                catchError(error => {
                    throw error;
                })
            );
    }

    /**
     * Check username availability
     */
    checkUsername(username: string): Observable<{ message: string; available: boolean }> {
        return this.http.get<{ message: string; available: boolean }>(`${this.API_BASE_URL}/public/check-username/${username}`, {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }),
            withCredentials: false
        })
            .pipe(
                catchError(error => {
                    throw error;
                })
            );
    }

    /**
     * Request password reset
     */
    requestPasswordReset(username: string): Observable<{ message: string; resetToken?: string }> {
        const requestBody = { username };

        return this.http.post<{ message: string; resetToken?: string }>(`${this.API_BASE_URL}/public/forgot-password`, requestBody, {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }),
            withCredentials: false
        })
            .pipe(
                catchError(error => {
                    throw error;
                })
            );
    }

    /**
     * Reset password with token
     */
    resetPasswordWithToken(token: string, newPassword: string): Observable<{ message: string }> {
        const requestBody = { token, newPassword };

        return this.http.post<{ message: string }>(`${this.API_BASE_URL}/public/reset-password`, requestBody, {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }),
            withCredentials: false
        })
            .pipe(
                catchError(error => {
                    throw error;
                })
            );
    }

    /**
     * Update user profile (full update)
     */
    updateProfile(profileData: { firstName: string; lastName: string; email: string }): Observable<{ message: string }> {
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

        return this.http.put<{ message: string }>(`${this.API_BASE_URL}/user/profile`, profileData, {
            headers,
            withCredentials: false
        })
            .pipe(
                tap(response => {
                    // Update local user data
                    const currentUser = this.getCurrentUser();
                    if (currentUser) {
                        const updatedUser = { ...currentUser, ...profileData };
                        this.setCurrentUser(updatedUser);
                        this.storeAuthData(authData.username, authData.password, updatedUser);
                    }
                }),
                catchError(error => {
                    throw error;
                })
            );
    }

    /**
     * Update user profile (partial update)
     */
    updateProfilePartial(profileData: Partial<{ firstName: string; lastName: string; email: string }>): Observable<{ message: string }> {
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
        })
            .pipe(
                tap(response => {
                    // Update local user data
                    const currentUser = this.getCurrentUser();
                    if (currentUser) {
                        const updatedUser = { ...currentUser, ...profileData };
                        this.setCurrentUser(updatedUser);
                        this.storeAuthData(authData.username, authData.password, updatedUser);
                    }
                }),
                catchError(error => {
                    throw error;
                })
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

        const requestBody = { currentPassword, newPassword };

        return this.http.put<{ message: string }>(`${this.API_BASE_URL}/user/password`, requestBody, {
            headers,
            withCredentials: false
        })
            .pipe(
                tap(response => {
                    // Update stored credentials with new password
                    const currentUser = this.getCurrentUser();
                    if (currentUser) {
                        this.storeAuthData(authData.username, newPassword, currentUser);
                    }
                }),
                catchError(error => {
                    throw error;
                })
            );
    }

    /**
     * Create first admin user (only works if no admin exists)
     */
    createFirstAdmin(userData: {
        userName: string;
        password: string;
        firstName: string;
        lastName: string;
        email: string;
    }): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(`${this.API_BASE_URL}/public/create-first-admin`, userData, {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }),
            withCredentials: false
        })
            .pipe(
                catchError(error => {
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
            password // Note: In production, consider using tokens instead of storing passwords
        };
        localStorage.setItem('travner_auth', JSON.stringify(authData));
        localStorage.setItem('travner_user', JSON.stringify(user));
    }

    /**
     * Get stored authentication data
     */
    private getStoredAuthData(): { username: string; password: string; user: User } | null {
        const storedAuth = localStorage.getItem('travner_auth');
        const storedUser = localStorage.getItem('travner_user');

        if (storedAuth && storedUser) {
            const authData = JSON.parse(storedAuth);
            const userData = JSON.parse(storedUser);
            return {
                username: authData.username,
                password: authData.password,
                user: userData
            };
        }
        return null;
    }

    /**
     * Clear authentication data
     */
    private clearAuthData(): void {
        localStorage.removeItem('travner_auth');
        localStorage.removeItem('travner_user');
        this.setCurrentUser(null);
    }

    /**
     * Check if there's stored authentication data on app initialization
     */
    private checkStoredAuth(): void {
        const storedUser = localStorage.getItem('travner_user');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            this.setCurrentUser(user);
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