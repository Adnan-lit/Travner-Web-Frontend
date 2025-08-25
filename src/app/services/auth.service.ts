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
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    // Direct API URL - backend CORS is now working
    private readonly API_BASE_URL = 'https://travner-backend.up.railway.app';

    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();
    private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
    public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

    constructor(
        private http: HttpClient,
        private router: Router
    ) {
        console.log('AuthService initialized with API URL:', this.API_BASE_URL);
        // Check if user is already logged in on service initialization
        this.checkStoredAuth();
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
            'Accept': 'application/json'
        });

        console.log('Attempting signin with username:', username);
        console.log('API URL:', `${this.API_BASE_URL}/user`);
        console.log('Auth header:', `Basic ${credentials}`);
        console.log('Request headers:', headers);

        return this.http.get<any>(`${this.API_BASE_URL}/user`, {
            headers,
            withCredentials: true // Basic Auth requires credentials
        })
            .pipe(
                map(response => {
                    console.log('Raw signin response:', response);

                    // Handle different response formats
                    let user: User;
                    if (response.userName || response.username) {
                        // Response is already in the right format or similar
                        user = {
                            id: response.id,
                            userName: response.userName || response.username,
                            firstName: response.firstName || response.firstname,
                            lastName: response.lastName || response.lastname,
                            email: response.email
                        };
                    } else {
                        // Fallback - use the response as is and hope it has the right structure
                        user = response as User;
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

                    // Enhanced CORS detection
                    if (error.status === 0) {
                        console.error('🚨 CORS/Network Error Detected:');
                        console.error('- Backend @CrossOrigin may not be working');
                        console.error('- Check browser Network tab for preflight requests');
                        console.error('- Verify backend allows:', window.location.origin);
                    }

                    this.clearAuthData();
                    throw error;
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
     * Test CORS configuration with enhanced debugging
     */
    testCorsConfiguration(): Observable<any> {
        console.log('🧪 Testing CORS configuration...');
        console.log('Frontend Origin:', window.location.origin);
        console.log('API Base URL:', this.API_BASE_URL);

        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        });

        console.log('🔍 Testing preflight request (OPTIONS)...');

        // Test with a simple OPTIONS request first
        return this.http.options(`${this.API_BASE_URL}/user`, {
            headers,
            observe: 'response'
        }).pipe(
            tap(response => {
                console.log('✅ CORS preflight successful:', response);
                console.log('📋 Response headers:');
                response.headers.keys().forEach(key => {
                    console.log(`  ${key}: ${response.headers.get(key)}`);
                });

                // Check for required CORS headers
                const corsHeaders = {
                    'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                    'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
                    'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
                    'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials')
                };

                console.log('🔎 CORS Headers Analysis:', corsHeaders);

                if (!corsHeaders['Access-Control-Allow-Origin']) {
                    console.warn('⚠️ Missing Access-Control-Allow-Origin header');
                }
                if (!corsHeaders['Access-Control-Allow-Methods']) {
                    console.warn('⚠️ Missing Access-Control-Allow-Methods header');
                }
                if (corsHeaders['Access-Control-Allow-Credentials'] !== 'true') {
                    console.warn('⚠️ Access-Control-Allow-Credentials not set to true');
                }
            }),
            catchError(error => {
                console.error('❌ CORS preflight failed:', error);
                console.error('📊 Error details:', {
                    status: error.status,
                    statusText: error.statusText,
                    message: error.message,
                    url: error.url
                });

                if (error.status === 0) {
                    console.error('🚨 CORS is NOT properly configured on the backend');
                    console.error('🔧 Backend needs to allow origin:', window.location.origin);
                    console.error('📝 Required backend configuration:');
                    console.error('   - Access-Control-Allow-Origin: http://localhost:4200');
                    console.error('   - Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
                    console.error('   - Access-Control-Allow-Headers: *');
                    console.error('   - Access-Control-Allow-Credentials: true');
                } else if (error.status === 403) {
                    console.error('🚫 Backend is rejecting preflight requests');
                    console.error('💡 This suggests CORS configuration is not active');
                } else if (error.status === 404) {
                    console.error('🔍 OPTIONS method not allowed on this endpoint');
                    console.error('💡 Backend may need to explicitly handle OPTIONS requests');
                }

                throw error;
            })
        );
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