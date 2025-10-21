import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { EnvironmentConfig } from '../config/environment.config';
import { User } from '../models/common.model';
import { ApiResponse, ApiListResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly API_BASE_URL = EnvironmentConfig.getApiBaseUrl();

  constructor(private http: HttpClient) { }

  /**
   * Search users by name, username, or email
   */
  searchUsers(query: string, page: number = 0, size: number = 20): Observable<User[]> {
    const endpoint = `${this.API_BASE_URL}/api/users/search`;
    const params = new HttpParams()
      .set('q', query)
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiResponse<any>>(endpoint, { params }).pipe(
      map(response => {
        // Handle Page format from backend
        if (response.data && response.data.content) {
          return response.data.content;
        }
        return response.data || [];
      }),
      catchError(error => {
        console.error('Error searching users:', error);
        return [];
      })
    );
  }

  /**
   * Get user by ID
   */
  getUserById(userId: string): Observable<User | null> {
    const endpoint = `${this.API_BASE_URL}/api/users/${userId}`;
    
    return this.http.get<ApiResponse<User>>(endpoint).pipe(
      map(response => response.data || null),
      catchError(error => {
        console.error('Error fetching user:', error);
        return of(null);
      })
    );
  }

  /**
   * Get user by username
   */
  getUserByUsername(username: string): Observable<User | null> {
    const endpoint = `${this.API_BASE_URL}/api/users/username/${username}`;
    
    return this.http.get<ApiResponse<User>>(endpoint).pipe(
      map(response => response.data || null),
      catchError(error => {
        console.error('Error fetching user by username:', error);
        return of(null);
      })
    );
  }

  /**
   * Get recent chat users (users you've chatted with recently)
   */
  getRecentChatUsers(): Observable<User[]> {
    const endpoint = `${this.API_BASE_URL}/api/chat/users/recent`;
    
    return this.http.get<ApiResponse<User[]>>(endpoint).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error fetching recent chat users:', error);
        return [];
      })
    );
  }

  /**
   * Get online users
   */
  getOnlineUsers(): Observable<User[]> {
    const endpoint = `${this.API_BASE_URL}/api/chat/users/online`;
    
    return this.http.get<ApiResponse<User[]>>(endpoint).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error fetching online users:', error);
        return [];
      })
    );
  }

  /**
   * Update user profile
   */
  updateProfile(profileData: Partial<User>): Observable<User> {
    const endpoint = `${this.API_BASE_URL}/api/user/profile`;
    
    return this.http.put<ApiResponse<User>>(endpoint, profileData).pipe(
      map(response => response.data!),
      catchError(error => {
        console.error('Error updating profile:', error);
        throw error;
      })
    );
  }

  /**
   * Upload profile image
   */
  uploadProfileImage(file: File): Observable<{ imageUrl: string }> {
    const endpoint = `${this.API_BASE_URL}/api/user/profile/image`;
    const formData = new FormData();
    formData.append('image', file);

    return this.http.post<ApiResponse<{ imageUrl: string }>>(endpoint, formData).pipe(
      map(response => response.data!),
      catchError(error => {
        console.error('Error uploading profile image:', error);
        throw error;
      })
    );
  }

  /**
   * Get user's followers
   */
  getFollowers(userId: string, page: number = 0, size: number = 20): Observable<User[]> {
    const endpoint = `${this.API_BASE_URL}/api/users/${userId}/followers`;
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiListResponse<User>>(endpoint, { params }).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error fetching followers:', error);
        return [];
      })
    );
  }

  /**
   * Get user's following
   */
  getFollowing(userId: string, page: number = 0, size: number = 20): Observable<User[]> {
    const endpoint = `${this.API_BASE_URL}/api/users/${userId}/following`;
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiListResponse<User>>(endpoint, { params }).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error fetching following:', error);
        return [];
      })
    );
  }

  /**
   * Follow a user
   */
  followUser(userId: string): Observable<void> {
    const endpoint = `${this.API_BASE_URL}/api/users/${userId}/follow`;
    
    return this.http.post<ApiResponse<void>>(endpoint, {}).pipe(
      map(() => void 0),
      catchError(error => {
        console.error('Error following user:', error);
        throw error;
      })
    );
  }

  /**
   * Unfollow a user
   */
  unfollowUser(userId: string): Observable<void> {
    const endpoint = `${this.API_BASE_URL}/api/users/${userId}/unfollow`;
    
    return this.http.delete<ApiResponse<void>>(endpoint).pipe(
      map(() => void 0),
      catchError(error => {
        console.error('Error unfollowing user:', error);
        throw error;
      })
    );
  }

  /**
   * Check if current user follows another user
   */
  isFollowing(userId: string): Observable<boolean> {
    const endpoint = `${this.API_BASE_URL}/api/users/${userId}/follow-status`;
    
    return this.http.get<ApiResponse<{ following: boolean }>>(endpoint).pipe(
      map(response => response.data?.following || false),
      catchError(error => {
        console.error('Error checking follow status:', error);
        return of(false);
      })
    );
  }

  /**
   * Get user statistics
   */
  getUserStats(userId: string): Observable<{
    postsCount: number;
    followersCount: number;
    followingCount: number;
    likesReceived: number;
  }> {
    const endpoint = `${this.API_BASE_URL}/api/users/${userId}/stats`;
    
    return this.http.get<ApiResponse<{
      postsCount: number;
      followersCount: number;
      followingCount: number;
      likesReceived: number;
    }>>(endpoint).pipe(
      map(response => response.data!),
      catchError(error => {
        console.error('Error fetching user stats:', error);
        throw error;
      })
    );
  }
}