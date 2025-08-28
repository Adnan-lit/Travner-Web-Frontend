import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
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
    ) {
        console.log('🔧 AdminService initialized');
        console.log('🔗 Admin API Base URL:', this.ADMIN_BASE_URL);
    }

    /**
     * Determine the appropriate admin API base URL based on environment
     */
    private getAdminBaseUrl(): string {
        // For local development, use localhost if backend is running locally
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            // First try localhost:8080 for local development
            return 'http://localhost:8080/admin';
        } else {
            // Production environment - use Railway deployment
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

        // Get stored credentials for Basic Auth
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
        console.log('🔍 Fetching all users...');

        return this.http.get<AdminUser[]>(`${this.ADMIN_BASE_URL}/users`, {
            headers: this.getAdminHeaders(),
            withCredentials: false
        }).pipe(
            tap(users => {
                console.log('✅ Successfully fetched users:', users.length);
            }),
            catchError(error => {
                console.error('❌ Error fetching users:', error);
                throw this.handleAdminError(error);
            })
        );
    }

    /**
     * Get user by username
     */
    getUserByUsername(username: string): Observable<AdminUser> {
        console.log('🔍 Fetching user:', username);

        return this.http.get<AdminUser>(`${this.ADMIN_BASE_URL}/users/${username}`, {
            headers: this.getAdminHeaders(),
            withCredentials: false
        }).pipe(
            tap(user => {
                console.log('✅ Successfully fetched user:', user);
            }),
            catchError(error => {
                console.error('❌ Error fetching user:', error);
                throw this.handleAdminError(error);
            })
        );
    }

    /**
     * Delete user by username
     */
    deleteUser(username: string): Observable<AdminResponse> {
        console.log('🗑️ Deleting user:', username);

        return this.http.delete<AdminResponse>(`${this.ADMIN_BASE_URL}/users/${username}`, {
            headers: this.getAdminHeaders(),
            withCredentials: false
        }).pipe(
            tap(response => {
                console.log('✅ User deleted successfully:', response);
            }),
            catchError(error => {
                console.error('❌ Error deleting user:', error);
                throw this.handleAdminError(error);
            })
        );
    }

    /**
     * Update user roles
     */
    updateUserRoles(username: string, roles: string[]): Observable<AdminResponse> {
        console.log('🔄 Updating roles for user:', username, roles);

        const requestBody: UpdateRolesRequest = { roles };

        return this.http.put<AdminResponse>(`${this.ADMIN_BASE_URL}/users/${username}/roles`, requestBody, {
            headers: this.getAdminHeaders(),
            withCredentials: false
        }).pipe(
            tap(response => {
                console.log('✅ User roles updated successfully:', response);
            }),
            catchError(error => {
                console.error('❌ Error updating user roles:', error);
                throw this.handleAdminError(error);
            })
        );
    }

    /**
     * Reset user password
     */
    resetUserPassword(username: string, newPassword: string): Observable<AdminResponse> {
        console.log('🔐 Resetting password for user:', username);

        const requestBody: ResetPasswordRequest = { password: newPassword };

        return this.http.put<AdminResponse>(`${this.ADMIN_BASE_URL}/users/${username}/password`, requestBody, {
            headers: this.getAdminHeaders(),
            withCredentials: false
        }).pipe(
            tap(response => {
                console.log('✅ Password reset successfully:', response);
            }),
            catchError(error => {
                console.error('❌ Error resetting password:', error);
                throw this.handleAdminError(error);
            })
        );
    }

    /**
     * Promote user to admin
     */
    promoteUserToAdmin(username: string): Observable<AdminResponse> {
        console.log('⬆️ Promoting user to admin:', username);

        return this.http.post<AdminResponse>(`${this.ADMIN_BASE_URL}/users/${username}/promote`, {}, {
            headers: this.getAdminHeaders(),
            withCredentials: false
        }).pipe(
            tap(response => {
                console.log('✅ User promoted to admin successfully:', response);
            }),
            catchError(error => {
                console.error('❌ Error promoting user:', error);
                throw this.handleAdminError(error);
            })
        );
    }

    /**
     * Get users by role
     */
    getUsersByRole(role: string): Observable<AdminUser[]> {
        console.log('🔍 Fetching users by role:', role);

        return this.http.get<AdminUser[]>(`${this.ADMIN_BASE_URL}/users/role/${role}`, {
            headers: this.getAdminHeaders(),
            withCredentials: false
        }).pipe(
            tap(users => {
                console.log(`✅ Successfully fetched ${role} users:`, users.length);
            }),
            catchError(error => {
                console.error('❌ Error fetching users by role:', error);
                throw this.handleAdminError(error);
            })
        );
    }

    /**
     * Get system statistics
     */
    getSystemStats(): Observable<SystemStats> {
        console.log('📊 Fetching system statistics...');

        return this.http.get<SystemStats>(`${this.ADMIN_BASE_URL}/stats`, {
            headers: this.getAdminHeaders(),
            withCredentials: false
        }).pipe(
            tap(stats => {
                console.log('✅ Successfully fetched system stats:', stats);
            }),
            catchError(error => {
                console.error('❌ Error fetching system stats:', error);
                throw this.handleAdminError(error);
            })
        );
    }

    /**
     * Create new admin user
     */
    createAdminUser(userData: CreateUserRequest): Observable<AdminResponse> {
        console.log('➕ Creating new admin user:', userData.userName);

        return this.http.post<AdminResponse>(`${this.ADMIN_BASE_URL}/users`, userData, {
            headers: this.getAdminHeaders(),
            withCredentials: false
        }).pipe(
            tap(response => {
                console.log('✅ Admin user created successfully:', response);
            }),
            catchError(error => {
                console.error('❌ Error creating admin user:', error);
                throw this.handleAdminError(error);
            })
        );
    }

    /**
     * Handle admin API errors and provide user-friendly messages
     */
    private handleAdminError(error: any): Error {
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