import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface AdminUser {
    id?: string;
    userName: string;
    firstName: string;
    lastName: string;
    email: string;
    roles: string[];
}

export interface SystemStats {
    totalUsers: number;
    adminUsers: number;
    regularUsers: number;
    timestamp: number;
}

export interface AdminResponse {
    message: string;
}

export interface CreateUserRequest {
    userName: string;
    password: string;
    firstName: string;
    lastName: string;
    email: string;
}

export interface UpdateRolesRequest {
    roles: string[];
}

export interface ResetPasswordRequest {
    password: string;
}

@Injectable({
    providedIn: 'root'
})
export class AdminService {
    private readonly ADMIN_BASE_URL = this.getAdminBaseUrl();

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) { }

    /**
     * Determine the appropriate admin API base URL based on environment
     */
    private getAdminBaseUrl(): string {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:8080/admin';
        } else {
            return 'https://travner-backend.up.railway.app/admin';
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
     * Create HTTP headers for admin requests
     */
    private getAdminHeaders(): HttpHeaders {
        const authData = this.authService.getCurrentUser();
        if (!authData) {
            throw new Error('No authentication data found');
        }

        const stored = localStorage.getItem('travner_auth');
        if (!stored) {
            throw new Error('No stored credentials found');
        }

        const { username, password } = JSON.parse(stored);
        const credentials = btoa(`${username}:${password}`);

        return new HttpHeaders({
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        });
    }

    /**
     * Get all users in the system
     */
    getAllUsers(): Observable<AdminUser[]> {
        console.log('🔄 AdminService: Fetching all users from', `${this.ADMIN_BASE_URL}/users`);

        // Enhanced debugging: Check authentication state
        const currentUser = this.authService.getCurrentUser();
        console.log('👤 Current user:', currentUser);
        console.log('🔐 User has ADMIN role:', currentUser?.roles?.includes('ADMIN'));

        // Enhanced debugging: Check stored credentials
        const stored = localStorage.getItem('travner_auth');
        if (stored) {
            const { username } = JSON.parse(stored);
            console.log('💾 Stored username:', username);
        } else {
            console.error('❌ No stored auth credentials found');
        }

        let headers;
        try {
            headers = this.getAdminHeaders();
            console.log('📤 Request headers prepared successfully');
            console.log('🔗 Full request URL:', `${this.ADMIN_BASE_URL}/users`);
        } catch (error) {
            console.error('❌ Failed to create headers:', error);
            throw error;
        }

        return this.http.get<AdminUser[]>(`${this.ADMIN_BASE_URL}/users`, {
            headers: headers,
            withCredentials: false
        }).pipe(
            tap(users => {
                console.log('✅ AdminService: Successfully fetched users:', users.length);
                console.log('📋 Users data:', users);
                if (users && users.length > 0) {
                    console.log('👥 First user sample:', users[0]);
                } else {
                    console.log('⚠️ No users returned from API');
                }
            }),
            catchError(error => {
                console.error('❌ AdminService: Error fetching users:', error);
                console.error('🚨 Request failed for URL:', `${this.ADMIN_BASE_URL}/users`);
                console.error('🚨 Error status:', error.status);
                console.error('🚨 Error response:', error.error);
                throw this.handleAdminError(error);
            })
        );
    }

    /**
     * Get user by username
     */
    getUserByUsername(username: string): Observable<AdminUser> {
        return this.http.get<AdminUser>(`${this.ADMIN_BASE_URL}/users/${username}`, {
            headers: this.getAdminHeaders(),
            withCredentials: false
        }).pipe(
            catchError(error => {
                throw this.handleAdminError(error);
            })
        );
    }

    /**
     * Delete user by username
     */
    deleteUser(username: string): Observable<AdminResponse> {
        return this.http.delete<AdminResponse>(`${this.ADMIN_BASE_URL}/users/${username}`, {
            headers: this.getAdminHeaders(),
            withCredentials: false
        }).pipe(
            catchError(error => {
                throw this.handleAdminError(error);
            })
        );
    }

    /**
     * Update user roles
     */
    updateUserRoles(username: string, roles: string[]): Observable<AdminResponse> {
        const requestBody: UpdateRolesRequest = { roles };

        return this.http.put<AdminResponse>(`${this.ADMIN_BASE_URL}/users/${username}/roles`, requestBody, {
            headers: this.getAdminHeaders(),
            withCredentials: false
        }).pipe(
            catchError(error => {
                throw this.handleAdminError(error);
            })
        );
    }

    /**
     * Reset user password
     */
    resetUserPassword(username: string, newPassword: string): Observable<AdminResponse> {
        const requestBody: ResetPasswordRequest = { password: newPassword };

        return this.http.put<AdminResponse>(`${this.ADMIN_BASE_URL}/users/${username}/password`, requestBody, {
            headers: this.getAdminHeaders(),
            withCredentials: false
        }).pipe(
            catchError(error => {
                throw this.handleAdminError(error);
            })
        );
    }

    /**
     * Promote user to admin
     */
    promoteUserToAdmin(username: string): Observable<AdminResponse> {
        return this.http.post<AdminResponse>(`${this.ADMIN_BASE_URL}/users/${username}/promote`, {}, {
            headers: this.getAdminHeaders(),
            withCredentials: false
        }).pipe(
            catchError(error => {
                throw this.handleAdminError(error);
            })
        );
    }

    /**
     * Get users by role
     */
    getUsersByRole(role: string): Observable<AdminUser[]> {
        return this.http.get<AdminUser[]>(`${this.ADMIN_BASE_URL}/users/role/${role}`, {
            headers: this.getAdminHeaders(),
            withCredentials: false
        }).pipe(
            catchError(error => {
                throw this.handleAdminError(error);
            })
        );
    }

    /**
     * Get system statistics
     */
    getSystemStats(): Observable<SystemStats> {
        console.log('🔄 AdminService: Fetching system stats from', `${this.ADMIN_BASE_URL}/stats`);

        return this.http.get<SystemStats>(`${this.ADMIN_BASE_URL}/stats`, {
            headers: this.getAdminHeaders(),
            withCredentials: false
        }).pipe(
            tap(stats => console.log('✅ AdminService: Successfully fetched stats:', stats)),
            catchError(error => {
                console.error('❌ AdminService: Error fetching stats:', error);
                throw this.handleAdminError(error);
            })
        );
    }

    /**
     * Create new admin user
     */
    createAdminUser(userData: CreateUserRequest): Observable<AdminResponse> {
        return this.http.post<AdminResponse>(`${this.ADMIN_BASE_URL}/users`, userData, {
            headers: this.getAdminHeaders(),
            withCredentials: false
        }).pipe(
            catchError(error => {
                throw this.handleAdminError(error);
            })
        );
    }

    /**
     * Handle admin API errors and provide user-friendly messages
     */
    private handleAdminError(error: any): Error {
        console.error('🚨 AdminService Error Details:', {
            status: error.status,
            statusText: error.statusText,
            url: error.url,
            error: error.error,
            message: error.message
        });

        let errorMessage = 'An error occurred';

        if (error.status === 401) {
            errorMessage = 'Authentication required. Please sign in as an admin.';
        } else if (error.status === 403) {
            errorMessage = 'Access denied. You need admin privileges to perform this action.';
        } else if (error.status === 404) {
            errorMessage = 'Resource not found.';
        } else if (error.status === 409) {
            errorMessage = 'Resource already exists.';
        } else if (error.status === 0) {
            errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.error && error.error.error) {
            errorMessage = error.error.error;
        } else if (error.message) {
            errorMessage = error.message;
        }

        console.error('🚨 Final error message:', errorMessage);

        const customError = new Error(errorMessage);
        (customError as any).status = error.status;
        return customError;
    }

    /**
     * Check if current user has admin privileges
     */
    isCurrentUserAdmin(): boolean {
        const currentUser = this.authService.getCurrentUser();
        return currentUser && currentUser.roles && currentUser.roles.includes('ADMIN') || false;
    }
}