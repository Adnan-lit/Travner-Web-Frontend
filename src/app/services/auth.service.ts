import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
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
    // Storage keys for authentication data - using the key specified in the frontend guide
    private static readonly AUTH_CREDENTIALS_KEY = 'authCredentials';
    private static readonly CURRENT_USER_KEY = 'currentUser';

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
        // Clean up old localStorage keys and migrate to new ones
        this.migrateOldAuthData();
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
        
        // Normalize username to lowercase to match signin behavior
        const normalizedSignupData = {
            ...signupData,
            userName: signupData.userName.toLowerCase()
        };
        
        console.log(`🔐 Signup: Normalizing username "${signupData.userName}" -> "${normalizedSignupData.userName}"`);
        
        return this.http.post<ApiResponse<User>>(endpoint, normalizedSignupData)
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
     * Health check endpoint
     */
    healthCheck(): Observable<ApiResponse<{ status: string; timestamp: string }>> {
        const endpoint = `${this.API_BASE_URL}/actuator/health`;
        return this.http.get<ApiResponse<{ status: string; timestamp: string }>>(endpoint)
            .pipe(
                catchError(error => {
                    console.error('Health check error:', error);
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

        // Normalize username to lowercase to match backend expectations
        const normalizedUsername = username.toLowerCase();
        console.log(`🔐 Normalizing username: "${username}" -> "${normalizedUsername}"`);

        // Create Basic Auth header for this specific request
        const credentials = btoa(`${normalizedUsername}:${password}`);
        const headers = {
            'Authorization': `Basic ${credentials}`
        };

        return this.http.get<ApiResponse<User>>(endpoint, { headers })
            .pipe(
                tap(response => {
                    if (response.success && response.data) {
                        // Store authentication data with normalized username
                        this.setCurrentUser(response.data);
                        this.storeAuthData(normalizedUsername, password, response.data);
                        console.log('✅ Authentication successful for user:', response.data.userName);
                    }
                }),
                catchError(error => {
                    console.error('❌ Authentication failed:', error);
                    // Clear any stored auth data on error
                    this.clearAuthData();
                    
                    // Provide more specific error messages
                    if (error.status === 401) {
                        throw new Error('Invalid username or password');
                    } else if (error.status === 403) {
                        throw new Error('Account is disabled or access denied');
                    } else if (error.status === 0) {
                        throw new Error('Network error: Unable to connect to server');
                    } else {
                        throw new Error(`Authentication failed: ${error.message || 'Unknown error'}`);
                    }
                })
            );
    }

    /**
     * Delete the current user account
     */
    deleteUser(): Observable<void> {
        const endpoint = `${this.API_BASE_URL}/api/user/account`;
        return this.http.delete<void>(endpoint)
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
     * Request password reset (Not implemented in backend yet)
     * TODO: Implement when backend adds password reset functionality
     */
    requestPasswordReset(username: string): Observable<ApiResponse<{ message: string; resetToken?: string }>> {
        // Backend doesn't implement password reset yet
        return throwError(() => new Error('Password reset not implemented in backend yet'));
    }

    /**
     * Reset password with token (Not implemented in backend yet)
     * TODO: Implement when backend adds password reset functionality
     */
    resetPasswordWithToken(token: string, newPassword: string): Observable<ApiResponse<{ message: string }>> {
        // Backend doesn't implement password reset yet
        return throwError(() => new Error('Password reset not implemented in backend yet'));
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
                            // Use normalized username when storing updated credentials
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
                            // Use normalized username when storing updated credentials
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
                            // Use normalized username when storing updated credentials
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
     * Clear all authentication data (for debugging)
     */
    clearAllAuthData(): void {
        console.log('🧹 Clearing ALL authentication data');
        this.clearAuthData();
        
        // Also clear any other potential auth-related keys
        const allPossibleKeys = [
            'authCredentials',
            'currentUser',
            'travner_credentials',
            'travner_auth',
            'travner_user',
            'travner_user_data',
            'travner_login_attempts'
        ];
        
        allPossibleKeys.forEach(key => {
            if (localStorage.getItem(key)) {
                localStorage.removeItem(key);
                console.log(`🧹 Cleared key: ${key}`);
            }
        });
        
        console.log('✅ All authentication data cleared');
    }

    /**
     * Test cart authentication specifically
     */
    testCartAuthentication(): Observable<any> {
        console.log('🛒 Testing cart authentication...');
        console.log('🛒 Current auth status:', this.isAuthenticated());
        console.log('🛒 Current user:', this.getCurrentUser());
        console.log('🛒 Stored credentials:', !!localStorage.getItem(AuthService.AUTH_CREDENTIALS_KEY));
        
        return this.http.get(`${this.API_BASE_URL}/api/cart/count`).pipe(
            tap(response => {
                console.log('✅ Cart authentication successful:', response);
            }),
            catchError(error => {
                console.error('❌ Cart authentication failed:', {
                    status: error.status,
                    statusText: error.statusText,
                    error: error.error,
                    url: error.url
                });
                if (error.status === 401) {
                    console.warn('🛒 Cart access denied - user not authenticated');
                    console.warn('🛒 This might indicate an authentication issue with the cart endpoint');
                }
                throw error;
            })
        );
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
        // Return the stored credentials directly
        return localStorage.getItem(AuthService.AUTH_CREDENTIALS_KEY);
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean {
        return this.isAuthenticatedSubject.value;
    }

    /**
     * Get the appropriate redirect URL based on user role
     */
    getRedirectUrl(): string {
        if (!this.isAuthenticated()) {
            return '/signin';
        }
        
        // Admin users should go directly to admin dashboard
        if (this.isAdmin()) {
            return '/admin';
        }
        
        // Regular users go to dashboard
        return '/dashboard';
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
            console.log('🔐 User roles set:', user.roles);
        } else {
            this.userRoles = [];
        }
    }

    /**
     * Store authentication data in localStorage
     */
    private storeAuthData(username: string, password: string, user: User): void {
        // Normalize username to lowercase to match backend expectations
        const normalizedUsername = username.toLowerCase();
        
        // Store base64-encoded credentials as per the frontend guide
        const credentials = btoa(`${normalizedUsername}:${password}`);
        localStorage.setItem(AuthService.AUTH_CREDENTIALS_KEY, credentials);
        localStorage.setItem(AuthService.CURRENT_USER_KEY, JSON.stringify(user));
        console.log('🔐 Authentication data stored:', { username: normalizedUsername, userId: user.id });
    }

    /**
     * Get stored authentication data
     */
    getStoredAuthData(): { username: string; password: string; user: User } | null {
        const storedCredentials = localStorage.getItem(AuthService.AUTH_CREDENTIALS_KEY);
        const storedUser = localStorage.getItem(AuthService.CURRENT_USER_KEY);

        if (storedCredentials && storedUser) {
            try {
                // Decode base64 credentials
                const decodedCredentials = atob(storedCredentials);
                const [username, password] = decodedCredentials.split(':');
                
                const userData = JSON.parse(storedUser);
                return {
                    username,
                    password,
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
        
        // Clear current keys
        localStorage.removeItem(AuthService.AUTH_CREDENTIALS_KEY);
        localStorage.removeItem(AuthService.CURRENT_USER_KEY);
        
        // Clear old keys to prevent conflicts
        const oldKeys = [
            'travner_credentials',
            'travner_auth', 
            'travner_user',
            'travner_user_data'
        ];
        
        oldKeys.forEach(key => {
            if (localStorage.getItem(key)) {
                localStorage.removeItem(key);
                console.log(`🧹 Cleared old key: ${key}`);
            }
        });
        
        this.userRoles = []; // Clear roles
        this.setCurrentUser(null);
    }

    /**
     * Migrate old localStorage keys to new ones
     */
    private migrateOldAuthData(): void {
        console.log('🔄 Checking for old authentication data to migrate...');
        
        // Check for old keys and migrate them
        const oldCredentialKeys = ['travner_credentials', 'travner_auth'];
        const oldUserKeys = ['travner_user', 'travner_user_data'];
        
        let migratedCredentials = false;
        let migratedUser = false;
        
        // Migrate credentials
        for (const oldKey of oldCredentialKeys) {
            const oldCredentials = localStorage.getItem(oldKey);
            if (oldCredentials && !localStorage.getItem(AuthService.AUTH_CREDENTIALS_KEY)) {
                localStorage.setItem(AuthService.AUTH_CREDENTIALS_KEY, oldCredentials);
                localStorage.removeItem(oldKey);
                migratedCredentials = true;
                console.log(`✅ Migrated credentials from ${oldKey} to ${AuthService.AUTH_CREDENTIALS_KEY}`);
                break;
            }
        }
        
        // Migrate user data
        for (const oldKey of oldUserKeys) {
            const oldUser = localStorage.getItem(oldKey);
            if (oldUser && !localStorage.getItem(AuthService.CURRENT_USER_KEY)) {
                localStorage.setItem(AuthService.CURRENT_USER_KEY, oldUser);
                localStorage.removeItem(oldKey);
                migratedUser = true;
                console.log(`✅ Migrated user data from ${oldKey} to ${AuthService.CURRENT_USER_KEY}`);
                break;
            }
        }
        
        if (migratedCredentials || migratedUser) {
            console.log('✅ Authentication data migration completed');
        } else {
            console.log('ℹ️ No old authentication data found to migrate');
        }
    }

    /**
     * Check if there's stored authentication data on app initialization
     */
    private checkStoredAuth(): void {
        console.log('🔍 Checking for stored authentication data on app initialization');
        const storedUser = localStorage.getItem(AuthService.CURRENT_USER_KEY);
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

    /**
     * Activate user (admin only)
     */
    activateUser(userId: string): Observable<ApiResponse<void>> {
        const endpoint = `${this.API_BASE_URL}/api/admin/users/${userId}/activate`;
        return this.http.post<ApiResponse<void>>(endpoint, {})
            .pipe(
                catchError(error => {
                    throw error;
                })
            );
    }

    /**
     * Deactivate user (admin only)
     */
    deactivateUser(userId: string): Observable<ApiResponse<void>> {
        const endpoint = `${this.API_BASE_URL}/api/admin/users/${userId}/deactivate`;
        return this.http.post<ApiResponse<void>>(endpoint, {})
            .pipe(
                catchError(error => {
                    throw error;
                })
            );
    }
}