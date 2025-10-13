import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { EnvironmentConfig } from '../config/environment.config';
import { AdminUserResponse, CreateUserRequest, SystemStats } from '../models/common.model';
import { ApiResponse, ApiListResponse } from '../models/api-response.model';

export interface AdminResponse {
    message: string;
}

export interface UpdateRolesRequest {
    roles: string[];
}

export interface ResetPasswordRequest {
    password: string;
}

export interface UpdateUserStatusRequest {
    active: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class AdminService {
    private readonly API_BASE_URL = EnvironmentConfig.getApiBaseUrl();

    constructor(private http: HttpClient) { }

    /**
     * Get all users in the system
     */
    getAllUsers(page: number = 0, size: number = 20): Observable<ApiListResponse<AdminUserResponse>> {
        const endpoint = `${this.API_BASE_URL}/api/admin/users`;
        const params = {
            page: page.toString(),
            size: size.toString()
        };
        return this.http.get<ApiListResponse<AdminUserResponse>>(endpoint, { params }).pipe(
            tap(response => {
                console.log('✅ AdminService: Successfully fetched users:', response.data?.length);
            }),
            catchError(error => {
                console.error('❌ AdminService: Error fetching users:', error);
                throw this.handleAdminError(error);
            })
        );
    }

    /**
     * Get user by username
     */
    getUserByUsername(username: string): Observable<ApiResponse<AdminUserResponse>> {
        const endpoint = `${this.API_BASE_URL}/api/admin/users/${username}`;
        return this.http.get<ApiResponse<AdminUserResponse>>(endpoint).pipe(
            catchError(error => {
                throw this.handleAdminError(error);
            })
        );
    }

    /**
     * Delete user by username
     */
    deleteUser(username: string): Observable<ApiResponse<void>> {
        const endpoint = `${this.API_BASE_URL}/api/admin/users/${username}`;
        return this.http.delete<ApiResponse<void>>(endpoint).pipe(
            catchError(error => {
                throw this.handleAdminError(error);
            })
        );
    }

    /**
     * Update user roles
     */
    updateUserRoles(username: string, roles: string[]): Observable<ApiResponse<void>> {
        const endpoint = `${this.API_BASE_URL}/api/admin/users/${username}/roles`;
        const requestBody: UpdateRolesRequest = { roles };
        return this.http.put<ApiResponse<void>>(endpoint, requestBody).pipe(
            catchError(error => {
                throw this.handleAdminError(error);
            })
        );
    }

    /**
     * Reset user password
     */
    resetUserPassword(username: string, newPassword: string): Observable<ApiResponse<void>> {
        const endpoint = `${this.API_BASE_URL}/api/admin/users/${username}/password`;
        const requestBody: ResetPasswordRequest = { password: newPassword };
        return this.http.put<ApiResponse<void>>(endpoint, requestBody).pipe(
            catchError(error => {
                throw this.handleAdminError(error);
            })
        );
    }

    /**
     * Promote user to admin
     */
    promoteUserToAdmin(username: string): Observable<ApiResponse<void>> {
        const endpoint = `${this.API_BASE_URL}/api/admin/users/${username}/promote`;
        return this.http.post<ApiResponse<void>>(endpoint, {}).pipe(
            catchError(error => {
                throw this.handleAdminError(error);
            })
        );
    }

    /**
     * Get users by role
     */
    getUsersByRole(role: string): Observable<ApiListResponse<AdminUserResponse>> {
        const endpoint = `${this.API_BASE_URL}/api/admin/users/role/${role}`;
        return this.http.get<ApiListResponse<AdminUserResponse>>(endpoint).pipe(
            catchError(error => {
                throw this.handleAdminError(error);
            })
        );
    }

    /**
     * Get system statistics
     */
    getSystemStats(): Observable<ApiResponse<SystemStats>> {
        const endpoint = `${this.API_BASE_URL}/api/admin/stats`;
        return this.http.get<ApiResponse<SystemStats>>(endpoint).pipe(
            tap(response => console.log('✅ AdminService: Successfully fetched stats:', response.data)),
            catchError(error => {
                console.error('❌ AdminService: Error fetching stats:', error);
                throw this.handleAdminError(error);
            })
        );
    }

    /**
     * Create new admin user
     */
    createAdminUser(userData: CreateUserRequest): Observable<ApiResponse<void>> {
        const endpoint = `${this.API_BASE_URL}/api/admin/users`;
        return this.http.post<ApiResponse<void>>(endpoint, userData).pipe(
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
        // This method should be implemented to check if the current user has admin privileges
        // For now, we'll return false as this would typically be handled by the auth service
        return false;
    }
}