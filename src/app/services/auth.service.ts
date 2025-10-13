import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { EnvironmentConfig } from '../config/environment.config';
import { ApiResponse } from '../models/api-response.model';
import { User, SignupRequest, UpdateProfileRequest } from '../models/common.model';

export interface AuthSignupRequest {
    userName: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    bio?: string;
    location?: string;
}

export interface SignupResponse {
    success?: boolean;
    message?: string;
    user?: any;
    [key: string]: any; // Allow any additional properties
}

export interface AuthUser {
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
    private readonly API_BASE_URL = EnvironmentConfig.getApiBaseUrl();
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
    signup(signupData: SignupRequest): Observable<ApiResponse<User>> {
        const endpoint = `${this.API_BASE_URL}/api/public/register`;
        return this.http.post<ApiResponse<User>>(endpoint, signupData)
            .pipe(
                tap(response => {
                    if (response.success && response.data) {
                        console.log('Signup successful:', response.data);
                    }
                }),
                catchError(error => {
                    console.error('Signup error:', error);
                    throw error;
                })
            );
    }

    /**
     * Test authentication by making a request to a protected endpoint
     * Since there's no separate sign-in endpoint, we test auth by accessing a protected resource
     */
    testAuthentication(username: string, password: string): Observable<ApiResponse<User>> {
        // Use the user profile endpoint to test authentication
        const endpoint = `${this.API_BASE_URL}/api/user/profile`;

        // Create Basic Auth header for this specific request
        const credentials = btoa(`${username}:${password}`);
        const headers = {
            'Authorization': `Basic ${credentials}`
        };

        return this.http.get<ApiResponse<User>>(endpoint, { headers })
            .pipe(
                tap(response => {
                    if (response.success && response.data) {
                        // Store authentication data
                        this.setCurrentUser(response.data);
                        this.storeAuthData(username, password, response.data);
                    }
                }),
                catchError(error => {
                    // Clear any stored auth data on error
                    this.clearAuthData();
                    throw error;
                })
            );
    }

    /**
     * Delete the current user account
     */
    deleteUser(): Observable<ApiResponse<void>> {
        const endpoint = `${this.API_BASE_URL}/api/user/account`;
        return this.http.delete<ApiResponse<void>>(endpoint)
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
    checkUsername(username: string): Observable<ApiResponse<{ available: boolean }>> {
        const endpoint = `${this.API_BASE_URL}/api/public/check-username/${username}`;
        return this.http.get<ApiResponse<{ available: boolean }>>(endpoint)
            .pipe(
                catchError(error => {
                    throw error;
                })
            );
    }

    /**
     * Request password reset
     */
    requestPasswordReset(username: string): Observable<ApiResponse<{ message: string; resetToken?: string }>> {
        const requestBody = { username };
        const endpoint = `${this.API_BASE_URL}/api/public/forgot-password`;
        return this.http.post<ApiResponse<{ message: string; resetToken?: string }>>(endpoint, requestBody)
            .pipe(
                catchError(error => {
                    throw error;
                })
            );
    }

    /**
     * Reset password with token
     */
    resetPasswordWithToken(token: string, newPassword: string): Observable<ApiResponse<{ message: string }>> {
        const requestBody = { token, newPassword };
        const endpoint = `${this.API_BASE_URL}/api/public/reset-password`;
        return this.http.post<ApiResponse<{ message: string }>>(endpoint, requestBody)
            .pipe(
                catchError(error => {
                    throw error;
                })
            );
    }

    /**
     * Update user profile (full update)
     */
    updateProfile(profileData: UpdateProfileRequest): Observable<ApiResponse<User>> {
        const endpoint = `${this.API_BASE_URL}/api/user/profile`;
        return this.http.put<ApiResponse<User>>(endpoint, profileData)
            .pipe(
                tap(response => {
                    // Update local user data
                    if (response.success && response.data) {
                        this.setCurrentUser(response.data);
                        const authData = this.getStoredAuthData();
                        if (authData) {
                            this.storeAuthData(authData.username, authData.password, response.data);
                        }
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
    updateProfilePartial(profileData: Partial<UpdateProfileRequest>): Observable<ApiResponse<User>> {
        const endpoint = `${this.API_BASE_URL}/api/user/profile`;
        return this.http.patch<ApiResponse<User>>(endpoint, profileData)
            .pipe(
                tap(response => {
                    // Update local user data
                    if (response.success && response.data) {
                        this.setCurrentUser(response.data);
                        const authData = this.getStoredAuthData();
                        if (authData) {
                            this.storeAuthData(authData.username, authData.password, response.data);
                        }
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
    changePassword(currentPassword: string, newPassword: string): Observable<ApiResponse<{ message: string }>> {
        const requestBody = { currentPassword, newPassword };
        const endpoint = `${this.API_BASE_URL}/api/user/password`;
        return this.http.put<ApiResponse<{ message: string }>>(endpoint, requestBody)
            .pipe(
                tap(response => {
                    // Update stored credentials with new password
                    if (response.success) {
                        const authData = this.getStoredAuthData();
                        const currentUser = this.getCurrentUser();
                        if (authData && currentUser) {
                            this.storeAuthData(authData.username, newPassword, currentUser);
                        }
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
    }): Observable<ApiResponse<{ message: string }>> {
        const endpoint = `${this.API_BASE_URL}/api/public/create-first-admin`;
        return this.http.post<ApiResponse<{ message: string }>>(endpoint, userData)
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
     * Verify if user is authenticated by checking stored data
     */
    verifyAuthentication(): boolean {
        const authData = this.getStoredAuthData();
        const isAuthenticated = !!authData && !!authData.username && !!authData.password;
        console.log('🔐 Authentication verification:', {
            hasStoredAuth: !!authData,
            hasUsername: !!authData?.username,
            hasPassword: !!authData?.password,
            isAuthenticated: isAuthenticated
        });
        return isAuthenticated;
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
        console.log('🔐 Authentication data stored:', { username, userId: user.id });
    }

    /**
     * Get stored authentication data
     */
    getStoredAuthData(): { username: string; password: string; user: User } | null {
        const storedAuth = localStorage.getItem('travner_auth');
        const storedUser = localStorage.getItem('travner_user');

        if (storedAuth && storedUser) {
            try {
                const authData = JSON.parse(storedAuth);
                const userData = JSON.parse(storedUser);
                return {
                    username: authData.username,
                    password: authData.password,
                    user: userData
                };
            } catch (error) {
                console.error('Error parsing stored auth data:', error);
                this.clearAuthData(); // Clear corrupted data
                return null;
            }
        }
        return null;
    }

    /**
     * Clear authentication data
     */
    private clearAuthData(): void {
        console.log('🧹 Clearing authentication data');
        localStorage.removeItem('travner_auth');
        localStorage.removeItem('travner_user');
        this.userRoles = []; // Clear roles
        this.setCurrentUser(null);
    }

    /**
     * Check if there's stored authentication data on app initialization
     */
    private checkStoredAuth(): void {
        console.log('🔍 Checking for stored authentication data on app initialization');
        const storedUser = localStorage.getItem('travner_user');
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                this.setCurrentUser(user);
                console.log('✅ Restored user from localStorage:', user.userName);
            } catch (error) {
                console.error('Error parsing stored user data:', error);
                this.clearAuthData(); // Clear corrupted data
            }
        } else {
            console.log('ℹ️ No stored user data found');
        }
    }

    /**
     * Refresh user data (re-authenticate with stored credentials)
     */
    refreshUserData(): Observable<ApiResponse<User>> | null {
        const authData = this.getStoredAuthData();
        if (!authData) {
            return null;
        }

        return this.testAuthentication(authData.username, authData.password);
    }

    /**
     * Get client IP address (simplified implementation)
     */
    private getClientIp(): string {
        // In a real implementation, you would get the actual IP from the server
        // For now, we'll use a hash of the user agent as a placeholder
        return this.hashCode(navigator.userAgent).toString();
    }

    /**
     * Simple hash function for generating consistent identifiers
     */
    private hashCode(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }

    /**
     * Get all users (admin only)
     */
    getUsers(): Observable<ApiResponse<User[]>> {
        const endpoint = `${this.API_BASE_URL}/api/admin/users`;
        return this.http.get<ApiResponse<User[]>>(endpoint)
            .pipe(
                catchError(error => {
                    throw error;
                })
            );
    }

    /**
     * Get user by ID (admin only)
     */
    getUserById(userId: string): Observable<ApiResponse<User>> {
        const endpoint = `${this.API_BASE_URL}/api/admin/users/${userId}`;
        return this.http.get<ApiResponse<User>>(endpoint)
            .pipe(
                catchError(error => {
                    throw error;
                })
            );
    }

    /**
     * Update user (admin only)
     */
    updateUser(userId: string, userData: Partial<User>): Observable<ApiResponse<User>> {
        const endpoint = `${this.API_BASE_URL}/api/admin/users/${userId}`;
        return this.http.put<ApiResponse<User>>(endpoint, userData)
            .pipe(
                catchError(error => {
                    throw error;
                })
            );
    }

    /**
     * Delete user (admin only)
     */
    deleteUserById(userId: string): Observable<ApiResponse<void>> {
        const endpoint = `${this.API_BASE_URL}/api/admin/users/${userId}`;
        return this.http.delete<ApiResponse<void>>(endpoint)
            .pipe(
                catchError(error => {
                    throw error;
                })
            );
    }
}