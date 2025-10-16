import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { EnvironmentConfig } from '../config/environment.config';
import { ApiResponse, ApiListResponse } from '../models/api-response.model';
import { User, PublicUser, UpdateProfileRequest, ChangePasswordRequest } from '../models/common.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly API_BASE_URL = EnvironmentConfig.getApiBaseUrl();

  constructor(private http: HttpClient) { }

  /**
   * Get current user's profile
   */
  getCurrentUserProfile(): Observable<ApiResponse<User>> {
    const endpoint = `${this.API_BASE_URL}/api/user/profile`;
    return this.http.get<ApiResponse<User>>(endpoint).pipe(
      catchError(error => {
        console.error('Error fetching current user profile:', error);
        throw error;
      })
    );
  }

  /**
   * Update current user's profile
   */
  updateProfile(profileData: UpdateProfileRequest): Observable<ApiResponse<User>> {
    const endpoint = `${this.API_BASE_URL}/api/user/profile`;
    return this.http.put<ApiResponse<User>>(endpoint, profileData).pipe(
      catchError(error => {
        console.error('Error updating profile:', error);
        throw error;
      })
    );
  }

  /**
   * Change user password
   */
  changePassword(passwordData: ChangePasswordRequest): Observable<ApiResponse<{ message: string }>> {
    const endpoint = `${this.API_BASE_URL}/api/user/password`;
    return this.http.put<ApiResponse<{ message: string }>>(endpoint, passwordData).pipe(
      catchError(error => {
        console.error('Error changing password:', error);
        throw error;
      })
    );
  }

  /**
   * Delete current user's account
   */
  deleteAccount(): Observable<ApiResponse<void>> {
    const endpoint = `${this.API_BASE_URL}/api/user/account`;
    return this.http.delete<ApiResponse<void>>(endpoint).pipe(
      catchError(error => {
        console.error('Error deleting account:', error);
        throw error;
      })
    );
  }

  /**
   * Get public user profile by username
   */
  getPublicUserProfile(username: string): Observable<ApiResponse<PublicUser>> {
    const endpoint = `${this.API_BASE_URL}/api/public/user/${username}`;
    return this.http.get<ApiResponse<PublicUser>>(endpoint).pipe(
      catchError(error => {
        console.error(`Error fetching public profile for ${username}:`, error);
        throw error;
      })
    );
  }

  /**
   * Search users by username or name
   */
  searchUsers(query: string, page: number = 0, size: number = 10): Observable<ApiListResponse<PublicUser>> {
    const endpoint = `${this.API_BASE_URL}/api/users/search`;
    const params = new HttpParams()
      .set('query', query)
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiListResponse<PublicUser>>(endpoint, { params }).pipe(
      catchError(error => {
        console.error(`Error searching users with query '${query}':`, error);
        throw error;
      })
    );
  }

  /**
   * Get user's followers
   */
  getUserFollowers(userId: string, page: number = 0, size: number = 10): Observable<ApiListResponse<PublicUser>> {
    const endpoint = `${this.API_BASE_URL}/api/users/${userId}/followers`;
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiListResponse<PublicUser>>(endpoint, { params }).pipe(
      catchError(error => {
        console.error(`Error fetching followers for user ${userId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Get users that the user is following
   */
  getUserFollowing(userId: string, page: number = 0, size: number = 10): Observable<ApiListResponse<PublicUser>> {
    const endpoint = `${this.API_BASE_URL}/api/users/${userId}/following`;
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiListResponse<PublicUser>>(endpoint, { params }).pipe(
      catchError(error => {
        console.error(`Error fetching following for user ${userId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Follow a user
   */
  followUser(userId: string): Observable<ApiResponse<{ message: string }>> {
    const endpoint = `${this.API_BASE_URL}/api/users/${userId}/follow`;
    return this.http.post<ApiResponse<{ message: string }>>(endpoint, {}).pipe(
      catchError(error => {
        console.error(`Error following user ${userId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Unfollow a user
   */
  unfollowUser(userId: string): Observable<ApiResponse<{ message: string }>> {
    const endpoint = `${this.API_BASE_URL}/api/users/${userId}/unfollow`;
    return this.http.delete<ApiResponse<{ message: string }>>(endpoint).pipe(
      catchError(error => {
        console.error(`Error unfollowing user ${userId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Check if current user is following another user
   */
  isFollowingUser(userId: string): Observable<ApiResponse<{ isFollowing: boolean }>> {
    const endpoint = `${this.API_BASE_URL}/api/users/${userId}/is-following`;
    return this.http.get<ApiResponse<{ isFollowing: boolean }>>(endpoint).pipe(
      catchError(error => {
        console.error(`Error checking follow status for user ${userId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Get user statistics
   */
  getUserStats(userId: string): Observable<ApiResponse<{
    totalPosts: number;
    totalFollowers: number;
    totalFollowing: number;
    totalLikes: number;
    joinDate: string;
  }>> {
    const endpoint = `${this.API_BASE_URL}/api/users/${userId}/stats`;
    return this.http.get<ApiResponse<{
      totalPosts: number;
      totalFollowers: number;
      totalFollowing: number;
      totalLikes: number;
      joinDate: string;
    }>>(endpoint).pipe(
      catchError(error => {
        console.error(`Error fetching stats for user ${userId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Upload profile picture
   */
  uploadProfilePicture(file: File): Observable<ApiResponse<{ imageUrl: string }>> {
    const endpoint = `${this.API_BASE_URL}/api/user/profile-picture`;
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<ApiResponse<{ imageUrl: string }>>(endpoint, formData).pipe(
      catchError(error => {
        console.error('Error uploading profile picture:', error);
        throw error;
      })
    );
  }

  /**
   * Delete profile picture
   */
  deleteProfilePicture(): Observable<ApiResponse<{ message: string }>> {
    const endpoint = `${this.API_BASE_URL}/api/user/profile-picture`;
    return this.http.delete<ApiResponse<{ message: string }>>(endpoint).pipe(
      catchError(error => {
        console.error('Error deleting profile picture:', error);
        throw error;
      })
    );
  }

  /**
   * Get user activity feed
   */
  getUserActivityFeed(userId: string, page: number = 0, size: number = 10): Observable<ApiListResponse<any>> {
    const endpoint = `${this.API_BASE_URL}/api/users/${userId}/activity`;
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiListResponse<any>>(endpoint, { params }).pipe(
      catchError(error => {
        console.error(`Error fetching activity feed for user ${userId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Block a user
   */
  blockUser(userId: string): Observable<ApiResponse<{ message: string }>> {
    const endpoint = `${this.API_BASE_URL}/api/users/${userId}/block`;
    return this.http.post<ApiResponse<{ message: string }>>(endpoint, {}).pipe(
      catchError(error => {
        console.error(`Error blocking user ${userId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Unblock a user
   */
  unblockUser(userId: string): Observable<ApiResponse<{ message: string }>> {
    const endpoint = `${this.API_BASE_URL}/api/users/${userId}/unblock`;
    return this.http.delete<ApiResponse<{ message: string }>>(endpoint).pipe(
      catchError(error => {
        console.error(`Error unblocking user ${userId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Get blocked users
   */
  getBlockedUsers(page: number = 0, size: number = 10): Observable<ApiListResponse<PublicUser>> {
    const endpoint = `${this.API_BASE_URL}/api/users/blocked`;
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiListResponse<PublicUser>>(endpoint, { params }).pipe(
      catchError(error => {
        console.error('Error fetching blocked users:', error);
        throw error;
      })
    );
  }
}