import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { EnvironmentConfig } from '../config/environment.config';
import { ApiResponse } from '../models/api-response.model';

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
    id?: {
        timestamp: number;
        date: string;
    };
    userName: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    roles?: string[];
    bio?: string | null;
    profileImageUrl?: string | null;
    location?: string | null;
    createdAt?: string;
    lastLoginAt?: string;
    active?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    // Storage keys for authentication data
    private static readonly TOKEN_KEY = 'travner_auth';
    private static readonly REFRESH_TOKEN_KEY = 'travner_refresh';

    // API URL configuration for different environments (proxied via Vercel in prod)
    private readonly API_BASE_URL = this.normalizeBaseUrl(
        EnvironmentConfig.getApiBaseUrl()
    );
    /**
     * Ensure base URL has no trailing slash (except a lone "/api") to prevent double slashes
     */
    private normalizeBaseUrl(url: string): string {
        if (!url) return '';
        // Keep exactly '/api' as-is (development proxy usage)
        if (url === '/api') return url;
        return url.replace(/\/+$/, '');
    }

    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();
    private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
    public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

    // Track user roles
    private userRoles: string[] = [];

    constructor(
        private http: HttpClient,
        private router: Router
    ) {
        // Check if user is already logged in on service initialization
        this.checkStoredAuth();
    }

    /**
     * Check if the current user has a specific role
     */
    hasRole(role: string): boolean {
        return this.userRoles.includes(role);
    }

    /**
     * Check if the current user is an admin
     */
    isAdmin(): boolean {
        return this.hasRole('ADMIN');
    }

    /**
     * Determine the appropriate API base URL based on environment
     */
    private getApiBaseUrl(): string {
        return EnvironmentConfig.getApiBaseUrl();
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

        console.log('AuthService signup called with:', requestBody);
        const signupUrl = `${this.API_BASE_URL}/public/create-user`.replace(/([^:])\/\//g, '$1/');
        console.log('API URL:', signupUrl);

        // Log detailed request information for debugging
        console.log('Request details:', {
            method: 'POST',
            url: signupUrl,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: requestBody,
            withCredentials: false
        });

        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        });

        return this.http.post<any>(signupUrl, requestBody, {
            headers,
            withCredentials: false, // Signup doesn't need credentials
            observe: 'response' // Get full response for debugging
        })
            .pipe(
                tap(response => {
                    console.log('Signup raw HTTP response:', response);
                    const body = response.body;
                    if (body && body.success && body.data) {
                        console.log('Signup parsed data wrapper:', body.data);
                    }
                }),
                catchError(error => {
                    console.error('Signup error:', error);
                    if (error.error) {
                        console.error('Error details:', error.error);
                        // Log the full error response for debugging
                        console.error('Full error response:', {
                            status: error.status,
                            statusText: error.statusText,
                            url: error.url,
                            headers: error.headers,
                            error: error.error
                        });
                    }
                    throw error;
                })
            );
    }

    /**
     * Sign in user with username and password
     * Updated to use standardized ApiResponse wrapper
     */
    signin(username: string, password: string): Observable<User> {
        const credentials = btoa(`${username}:${password}`); // Base64 encode for basic auth
        const headers = new HttpHeaders({
            'Authorization': `Basic ${credentials}`
        });

        // Build endpoint safely (avoid double slashes)
        const endpoint = `${this.API_BASE_URL}/user`.replace(/([^:])\/\//g, '$1/');

        return this.http.get(endpoint, {
            headers,
            responseType: 'text',
            observe: 'response'
        })
            .pipe(
                map(httpResponse => {
                    let response: any;

                    // Try to parse the response body
                    try {
                        if (httpResponse.body && typeof httpResponse.body === 'string') {
                            // Check if it's empty or just whitespace
                            const trimmed = (httpResponse.body as string).trim();
                            if (!trimmed) {
                                throw new Error('Empty response from server');
                            }

                            // Check if response looks like an error message (plain text)
                            if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
                                throw new Error(`Server returned non-JSON response: ${trimmed}`);
                            }

                            // Try to parse as JSON
                            response = JSON.parse(trimmed);
                            console.log('Parsed JSON response:', response);
                        } else {
                            response = httpResponse.body;
                        }
                    } catch (parseError: any) {
                        console.error('JSON Parse Error:', parseError);
                        console.error('Raw response that failed to parse:', httpResponse.body);

                        // If it's not a JSON parsing error, throw the original message
                        if (parseError.message && parseError.message.includes('Server returned non-JSON response')) {
                            throw parseError;
                        }

                        const errorMessage = parseError.message || 'Unknown parsing error';
                        throw new Error(`Server returned invalid JSON: ${errorMessage}`);
                    }

                    // Handle standardized API response format
                    if (response && response.success && response.data) {
                        // Use the data from the standardized response
                        return response.data;
                    } else if (response && response.success === false) {
                        // Handle API error response
                        throw new Error(response.message || 'Authentication failed');
                    } else {
                        // Fallback for non-standard response format
                        console.warn('Non-standard response format, attempting to parse as user data:', response);

                        if (response && (response['userName'] || response['username'])) {
                            // Response is already in the right format or similar
                            return {
                                id: response['id'],
                                userName: response['userName'] || response['username'],
                                firstName: response['firstName'] || response['firstname'],
                                lastName: response['lastName'] || response['lastname'],
                                email: response['email'],
                                roles: response['roles'] || []
                            } as User;
                        } else {
                            throw new Error('No valid user data in response');
                        }
                    }
                }),
                tap(user => {
                    // Store authentication data
                    this.setCurrentUser(user);
                    this.storeAuthData(username, password, user);
                }),
                catchError(error => {
                    // Clear any stored auth data on error
                    this.clearAuthData();

                    console.error('🔍 Debugging Information:');
                    console.error('  - Frontend Origin:', window.location.origin);
                    console.error('  - Backend URL:', this.API_BASE_URL);
                    console.error('  - Error Status:', error.status);
                    console.error('  - Error Details:', error);

                    // Handle specific error cases
                    if (error.status === 401) {
                        // Don't re-throw 401 errors to prevent browser auth popup
                        const authError = new Error('Invalid username or password');
                        (authError as any).status = 401;
                        throw authError;
                    } else if (error.status === 200 && error.message?.includes('parsing')) {
                        // HTTP 200 but parsing failed - likely a response format issue
                        console.error('🚨 Parsing Error: Server returned HTTP 200 but response could not be parsed');
                        console.error('Raw error:', error);
                        const parseError = new Error('Server response could not be parsed. Please check the backend response format.');
                        (parseError as any).status = 200;
                        throw parseError;
                    } else if (error.status === 0) {
                        // CORS or network error
                        let errorMessage = 'Network connection failed.';

                        if (window.location.hostname.includes('vercel.app')) {
                            errorMessage = 'Unable to connect to the backend server. Please check if the server is running and accessible.';
                            console.error('🚨 Network Issue: Cannot reach backend at:', this.API_BASE_URL);
                        } else {
                            errorMessage = 'Network connection failed. Please check your connection and try again.';
                            console.error('🚨 Network Issue: Cannot reach backend at:', this.API_BASE_URL);
                            console.error('💡 Make sure the backend server is running on http://localhost:8080');
                            console.error('💡 Or run the frontend with: npm start (which uses proxy configuration)');
                        }

                        const networkError = new Error(errorMessage);
                        (networkError as any).status = 0;
                        throw networkError;
                    } else if (error.status === 404) {
                        // API endpoint not found
                        const errorMessage = `API endpoint not found. The server returned 404 for: ${error.url}`;
                        console.error('🚨 404 Error:', errorMessage);
                        console.error('💡 Make sure the backend server is running and the endpoint exists');
                        console.error('💡 Current API base URL:', this.API_BASE_URL);

                        const notFoundError = new Error(errorMessage);
                        (notFoundError as any).status = 404;
                        throw notFoundError;
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
     * Get stored authentication token
     */
    getToken(): string | null {
        const storedAuth = localStorage.getItem(AuthService.TOKEN_KEY);
        if (storedAuth) {
            try {
                const authData = JSON.parse(storedAuth);
                return authData.token || authData.username || null; // Handle both token and username-based auth
            } catch (error) {
                console.error('Error parsing stored auth:', error);
                return null;
            }
        }
        return null;
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

        // Update roles when setting a new user
        if (user && user.roles) {
            this.userRoles = user.roles;
        } else {
            this.userRoles = [];
        }
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
        this.userRoles = []; // Clear roles
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