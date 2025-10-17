import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { EnvironmentConfig } from '../config/environment.config';
import { ApiResponse, ApiListResponse } from '../models/api-response.model';
import { User, AdminUser, SystemStats, AdminPost, AdminProduct } from '../models/common.model';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly API_BASE_URL = EnvironmentConfig.getApiBaseUrl();

  constructor(private http: HttpClient) { }

  // User Management

  /**
   * Get all users with pagination and filtering
   */
  getUsers(page: number = 0, size: number = 20, search?: string, role?: string): Observable<ApiListResponse<AdminUser>> {
    const endpoint = `${this.API_BASE_URL}/api/admin/users`;
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (search) {
      params = params.set('search', search);
    }
    if (role) {
      params = params.set('role', role);
    }

    return this.http.get<ApiListResponse<AdminUser>>(endpoint, { params }).pipe(
      catchError(error => {
        console.error('Error fetching users:', error);
        throw error;
      })
    );
  }

  /**
   * Get user by ID
   */
  getUserById(userId: string): Observable<ApiResponse<AdminUser>> {
    const endpoint = `${this.API_BASE_URL}/api/admin/users/${userId}`;
    return this.http.get<ApiResponse<AdminUser>>(endpoint).pipe(
      catchError(error => {
        console.error(`Error fetching user ${userId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Update user role
   */
  updateUserRole(userId: string, role: string): Observable<ApiResponse<AdminUser>> {
    const endpoint = `${this.API_BASE_URL}/api/admin/users/${userId}/role`;
    return this.http.put<ApiResponse<AdminUser>>(endpoint, { role }).pipe(
      catchError(error => {
        console.error(`Error updating role for user ${userId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Activate user
   */
  activateUser(userId: string): Observable<ApiResponse<AdminUser>> {
    const endpoint = `${this.API_BASE_URL}/api/admin/users/${userId}/activate`;
    return this.http.put<ApiResponse<AdminUser>>(endpoint, {}).pipe(
      catchError(error => {
        console.error(`Error activating user ${userId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Delete user
   */
  deleteUser(userId: string): Observable<ApiResponse<void>> {
    const endpoint = `${this.API_BASE_URL}/api/admin/users/${userId}`;
    return this.http.delete<ApiResponse<void>>(endpoint).pipe(
      catchError(error => {
        console.error(`Error deleting user ${userId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Deactivate user
   */
  deactivateUser(userId: string): Observable<ApiResponse<AdminUser>> {
    const endpoint = `${this.API_BASE_URL}/api/admin/users/${userId}/deactivate`;
    return this.http.put<ApiResponse<AdminUser>>(endpoint, {}).pipe(
      catchError(error => {
        console.error(`Error deactivating user ${userId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Get post statistics
   */
  getPostStats(): Observable<ApiResponse<any>> {
    const endpoint = `${this.API_BASE_URL}/api/admin/stats/posts`;
    return this.http.get<ApiResponse<any>>(endpoint).pipe(
      catchError(error => {
        console.error('Error fetching post stats:', error);
        throw error;
      })
    );
  }

  /**
   * Cleanup invalid media URLs
   */
  cleanupInvalidMediaUrls(): Observable<ApiResponse<string>> {
    const endpoint = `${this.API_BASE_URL}/api/admin/cleanup/media-urls`;
    return this.http.post<ApiResponse<string>>(endpoint, {}).pipe(
      catchError(error => {
        console.error('Error cleaning up media URLs:', error);
        throw error;
      })
    );
  }

  // Content Management

  /**
   * Get all posts with admin details
   */
  getAdminPosts(page: number = 0, size: number = 20, search?: string, status?: string): Observable<ApiListResponse<AdminPost>> {
    const endpoint = `${this.API_BASE_URL}/api/admin/posts`;
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (search) {
      params = params.set('search', search);
    }
    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<ApiListResponse<AdminPost>>(endpoint, { params }).pipe(
      catchError(error => {
        console.error('Error fetching admin posts:', error);
        throw error;
      })
    );
  }

  /**
   * Delete post (admin)
   */
  deletePost(postId: string): Observable<ApiResponse<void>> {
    const endpoint = `${this.API_BASE_URL}/api/admin/posts/${postId}`;
    return this.http.delete<ApiResponse<void>>(endpoint).pipe(
      catchError(error => {
        console.error(`Error deleting post ${postId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Get all products with admin details
   */
  getAdminProducts(page: number = 0, size: number = 20, search?: string, status?: string): Observable<ApiListResponse<AdminProduct>> {
    const endpoint = `${this.API_BASE_URL}/api/admin/products`;
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (search) {
      params = params.set('search', search);
    }
    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<ApiListResponse<AdminProduct>>(endpoint, { params }).pipe(
      catchError(error => {
        console.error('Error fetching admin products:', error);
        throw error;
      })
    );
  }

  /**
   * Delete product (admin)
   */
  deleteProduct(productId: string): Observable<ApiResponse<void>> {
    const endpoint = `${this.API_BASE_URL}/api/admin/products/${productId}`;
    return this.http.delete<ApiResponse<void>>(endpoint).pipe(
      catchError(error => {
        console.error(`Error deleting product ${productId}:`, error);
        throw error;
      })
    );
  }

  // Statistics and Analytics

  /**
   * Get system statistics
   */
  getSystemStats(): Observable<ApiResponse<SystemStats>> {
    const endpoint = `${this.API_BASE_URL}/api/admin/stats`;
    return this.http.get<ApiResponse<SystemStats>>(endpoint).pipe(
      catchError(error => {
        console.error('Error fetching system stats:', error);
        throw error;
      })
    );
  }

  /**
   * Get user activity statistics
   */
  getUserActivityStats(period: 'day' | 'week' | 'month' | 'year' = 'week'): Observable<ApiResponse<{
    activeUsers: number;
    newUsers: number;
    totalSessions: number;
    averageSessionDuration: number;
  }>> {
    const endpoint = `${this.API_BASE_URL}/api/admin/stats/user-activity`;
    const params = new HttpParams().set('period', period);

    return this.http.get<ApiResponse<{
      activeUsers: number;
      newUsers: number;
      totalSessions: number;
      averageSessionDuration: number;
    }>>(endpoint, { params }).pipe(
      catchError(error => {
        console.error('Error fetching user activity stats:', error);
        throw error;
      })
    );
  }

  /**
   * Get content statistics
   */
  getContentStats(period: 'day' | 'week' | 'month' | 'year' = 'week'): Observable<ApiResponse<{
    totalPosts: number;
    newPosts: number;
    totalComments: number;
    newComments: number;
    totalProducts: number;
    newProducts: number;
  }>> {
    const endpoint = `${this.API_BASE_URL}/api/admin/stats/content`;
    const params = new HttpParams().set('period', period);

    return this.http.get<ApiResponse<{
      totalPosts: number;
      newPosts: number;
      totalComments: number;
      newComments: number;
      totalProducts: number;
      newProducts: number;
    }>>(endpoint, { params }).pipe(
      catchError(error => {
        console.error('Error fetching content stats:', error);
        throw error;
      })
    );
  }

  // System Management

  /**
   * Get system health status
   */
  getSystemHealth(): Observable<ApiResponse<{
    status: string;
    database: boolean;
    storage: boolean;
    cache: boolean;
    uptime: number;
    version: string;
  }>> {
    const endpoint = `${this.API_BASE_URL}/api/admin/system/health`;
    return this.http.get<ApiResponse<{
      status: string;
      database: boolean;
      storage: boolean;
      cache: boolean;
      uptime: number;
      version: string;
    }>>(endpoint).pipe(
      catchError(error => {
        console.error('Error fetching system health:', error);
        throw error;
      })
    );
  }

  /**
   * Clear system cache
   */
  clearCache(): Observable<ApiResponse<{ message: string }>> {
    const endpoint = `${this.API_BASE_URL}/api/admin/system/cache/clear`;
    return this.http.post<ApiResponse<{ message: string }>>(endpoint, {}).pipe(
      catchError(error => {
        console.error('Error clearing cache:', error);
        throw error;
      })
    );
  }

  /**
   * Get system logs
   */
  getSystemLogs(page: number = 0, size: number = 50, level?: string): Observable<ApiListResponse<{
    id: string;
    level: string;
    message: string;
    timestamp: string;
    source: string;
  }>> {
    const endpoint = `${this.API_BASE_URL}/api/admin/system/logs`;
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (level) {
      params = params.set('level', level);
    }

    return this.http.get<ApiListResponse<{
      id: string;
      level: string;
      message: string;
      timestamp: string;
      source: string;
    }>>(endpoint, { params }).pipe(
      catchError(error => {
        console.error('Error fetching system logs:', error);
        throw error;
      })
    );
  }

  // Reports

  /**
   * Generate user report
   */
  generateUserReport(startDate: string, endDate: string): Observable<ApiResponse<{
    reportId: string;
    downloadUrl: string;
  }>> {
    const endpoint = `${this.API_BASE_URL}/api/admin/reports/users`;
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<ApiResponse<{
      reportId: string;
      downloadUrl: string;
    }>>(endpoint, { params }).pipe(
      catchError(error => {
        console.error('Error generating user report:', error);
        throw error;
      })
    );
  }

  /**
   * Generate content report
   */
  generateContentReport(startDate: string, endDate: string): Observable<ApiResponse<{
    reportId: string;
    downloadUrl: string;
  }>> {
    const endpoint = `${this.API_BASE_URL}/api/admin/reports/content`;
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<ApiResponse<{
      reportId: string;
      downloadUrl: string;
    }>>(endpoint, { params }).pipe(
      catchError(error => {
        console.error('Error generating content report:', error);
        throw error;
      })
    );
  }
}