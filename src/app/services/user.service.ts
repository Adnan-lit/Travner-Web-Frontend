import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EnvironmentConfig } from '../config/environment.config';
import { User, UpdateProfileRequest, ChangePasswordRequest } from '../models/common.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private readonly API_BASE_URL = EnvironmentConfig.getApiBaseUrl();

    constructor(private http: HttpClient) { }

    /**
     * Get user profile
     */
    getUserProfile(): Observable<ApiResponse<User>> {
        const endpoint = `${this.API_BASE_URL}/api/user/profile`;
        return this.http.get<ApiResponse<User>>(endpoint);
    }

    /**
     * Update user profile
     */
    updateUserProfile(profileData: UpdateProfileRequest): Observable<ApiResponse<User>> {
        const endpoint = `${this.API_BASE_URL}/api/user/profile`;
        return this.http.put<ApiResponse<User>>(endpoint, profileData);
    }

    /**
     * Change user password
     */
    changePassword(passwordData: ChangePasswordRequest): Observable<ApiResponse<void>> {
        const endpoint = `${this.API_BASE_URL}/api/user/password`;
        return this.http.put<ApiResponse<void>>(endpoint, passwordData);
    }

    /**
     * Delete user account
     */
    deleteUserAccount(): Observable<ApiResponse<void>> {
        const endpoint = `${this.API_BASE_URL}/api/user/account`;
        return this.http.delete<ApiResponse<void>>(endpoint);
    }

    /**
     * Get public user information by username
     */
    getPublicUserByUsername(username: string): Observable<ApiResponse<User>> {
        const endpoint = `${this.API_BASE_URL}/api/public/user/${username}`;
        return this.http.get<ApiResponse<User>>(endpoint);
    }

    /**
     * Check username availability
     */
    checkUsernameAvailability(username: string): Observable<ApiResponse<{ available: boolean }>> {
        const endpoint = `${this.API_BASE_URL}/api/public/check-username/${username}`;
        return this.http.get<ApiResponse<{ available: boolean }>>(endpoint);
    }
}