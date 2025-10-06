import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { EnvironmentConfig } from '../config/environment.config';
import { CentralizedAuthService } from './centralized-auth.service';
import { ApiResponse, ApiPaginationInfo } from '../models/api-response.model';
import { User, AdminUser } from '../models/common.model';
import { Post, PostCreate, PostUpdate } from '../models/post.model';
import { Comment, CommentCreate, CommentUpdate } from '../models/comment.model';
import {
  Product, ProductCreate, ProductUpdate,
  Cart, CartItemAdd, CartItemUpdate,
  Order, OrderCreate
} from '../models/marketplace.model';
import {
  ChatConversation, ChatMessage, ChatMessageCreate,
  ChatConversationCreate, ChatTypingIndicator
} from '../models/chat.models';
import { ApiResponseHandler } from '../utils/api-response-handler';
import { PaginationHandler } from '../utils/pagination-handler';
import { ErrorHandler, ApiError } from '../utils/error-handler';

/**
 * Comprehensive Travner API Service
 * Implements all endpoints according to the Travner API documentation
 * Refactored to follow clean MVP patterns with interceptors handling auth and envelope
 */
@Injectable({
  providedIn: 'root'
})
export class TravnerApiService {
  private readonly API_BASE_URL = EnvironmentConfig.getApiBaseUrl();

  constructor(
    private http: HttpClient,
    private authService: CentralizedAuthService
  ) { }

  // ==================== AUTHENTICATION ====================

  /**
   * Create a new user account
   */
  createUser(userData: {
    userName: string;
    password: string;
    firstName: string;
    lastName: string;
    email: string;
  }): Observable<ApiResponse<User>> {
    const url = `${this.API_BASE_URL}/public/create-user`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.post<ApiResponse<User>>(url, userData, { headers })
      .pipe(catchError(error => this.handleError(error)));
  }

  /**
   * Check username availability
   */
  checkUsername(username: string): Observable<ApiResponse<{ available: boolean }>> {
    const url = `${this.API_BASE_URL}/public/check-username/${username}`;
    return this.http.get<ApiResponse<{ available: boolean }>>(url)
      .pipe(catchError(error => this.handleError(error)));
  }

  /**
   * Request password reset
   */
  forgotPassword(username: string): Observable<ApiResponse<any>> {
    const url = `${this.API_BASE_URL}/public/forgot-password`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const body = { username };

    return this.http.post<ApiResponse<any>>(url, body, { headers })
      .pipe(catchError(error => this.handleError(error)));
  }

  /**
   * Reset password with token
   */
  resetPassword(token: string, newPassword: string): Observable<ApiResponse<any>> {
    const url = `${this.API_BASE_URL}/public/reset-password`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const body = { token, newPassword };

    return this.http.post<ApiResponse<any>>(url, body, { headers })
      .pipe(catchError(error => this.handleError(error)));
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
  }): Observable<ApiResponse<User>> {
    const url = `${this.API_BASE_URL}/public/create-first-admin`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.post<ApiResponse<User>>(url, userData, { headers })
      .pipe(catchError(error => this.handleError(error)));
  }

  // ==================== USER MANAGEMENT ====================

  /**
   * Get current user info
   */
  getCurrentUser(): Observable<ApiResponse<User>> {
    const url = `${this.API_BASE_URL}/user`;

    return this.http.get<ApiResponse<User>>(url)
      .pipe(catchError(error => this.handleError(error)));
  }

  /**
   * Get user profile
   */
  getUserProfile(): Observable<ApiResponse<User>> {
    const url = `${this.API_BASE_URL}/user/profile`;

    return this.http.get<ApiResponse<User>>(url)
      .pipe(catchError(error => this.handleError(error)));
  }

  /**
   * Update full profile
   */
  updateProfile(profileData: {
    firstName: string;
    lastName: string;
    email: string;
    bio?: string;
    location?: string;
  }): Observable<ApiResponse<any>> {
    const url = `${this.API_BASE_URL}/user/profile`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.put<ApiResponse<any>>(url, profileData, { headers })
      .pipe(catchError(error => this.handleError(error)));
  }

  /**
   * Partial profile update
   */
  patchProfile(profileData: Partial<{
    firstName: string;
    lastName: string;
    email: string;
    bio: string;
    location: string;
  }>): Observable<ApiResponse<any>> {
    const url = `${this.API_BASE_URL}/user/profile`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.patch<ApiResponse<any>>(url, profileData, { headers })
      .pipe(catchError(error => this.handleError(error)));
  }

  /**
   * Change password
   */
  changePassword(currentPassword: string, newPassword: string): Observable<ApiResponse<any>> {
    const url = `${this.API_BASE_URL}/user/password`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const body = { currentPassword, newPassword };

    return this.http.put<ApiResponse<any>>(url, body, { headers })
      .pipe(catchError(error => this.handleError(error)));
  }

  /**
   * Delete account
   */
  deleteAccount(): Observable<ApiResponse<any>> {
    const url = `${this.API_BASE_URL}/user`;

    return this.http.delete<ApiResponse<any>>(url)
      .pipe(catchError(error => this.handleError(error)));
  }

  /**
   * Get public user profile
   */
  getPublicUserProfile(username: string): Observable<ApiResponse<User>> {
    const url = `${this.API_BASE_URL}/user/public/${username}`;
    return this.http.get<ApiResponse<User>>(url)
      .pipe(catchError(error => this.handleError(error)));
  }

  // ==================== POST MANAGEMENT ====================

  /**
   * Create new post
   */
  createPost(postData: PostCreate): Observable<ApiResponse<Post>> {
    const url = `${this.API_BASE_URL}/posts`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.post<ApiResponse<Post>>(url, postData, { headers })
      .pipe(catchError(error => this.handleError(error)));
  }

  /**
   * Get all posts with pagination
   */
  getPosts(page: number = 0, size: number = 10, sortBy: string = 'createdAt', direction: 'asc' | 'desc' = 'desc'): Observable<ApiResponse<Post[]>> {
    const url = `${this.API_BASE_URL}/posts`;
    const params = PaginationHandler.createPaginationParams(page, size, sortBy, direction);

    return this.http.get<any>(url, { params: params as any })
      .pipe(
        map(response => ApiResponseHandler.parsePaginatedResponse<Post[]>(response, page, size) as unknown as ApiResponse<Post[]>),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * Get specific post
   */
  getPost(postId: string): Observable<ApiResponse<Post>> {
    const url = `${this.API_BASE_URL}/posts/${postId}`;

    return this.http.get<ApiResponse<Post>>(url)
      .pipe(catchError(error => this.handleError(error)));
  }

  /**
   * Get posts by user
   */
  getPostsByUser(username: string, page: number = 0, size: number = 10): Observable<ApiResponse<Post[]>> {
    const url = `${this.API_BASE_URL}/posts/user/${username}`;
    const params = PaginationHandler.createPaginationParams(page, size);

    return this.http.get<any>(url, { params: params as any })
      .pipe(
        map(response => ApiResponseHandler.parsePaginatedResponse<Post[]>(response, page, size) as unknown as ApiResponse<Post[]>),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * Search posts
   */
  searchPosts(query: string, page: number = 0, size: number = 10): Observable<ApiResponse<Post[]>> {
    const url = `${this.API_BASE_URL}/posts/search`;
    const params = PaginationHandler.createPaginationParams(page, size);
    params.set('query', query);

    return this.http.get<any>(url, { params: params as any })
      .pipe(
        map(response => ApiResponseHandler.parsePaginatedResponse<Post[]>(response, page, size) as unknown as ApiResponse<Post[]>),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * Get posts by location
   */
  getPostsByLocation(location: string, page: number = 0, size: number = 10): Observable<ApiResponse<Post[]>> {
    const url = `${this.API_BASE_URL}/posts/location`;
    const params = PaginationHandler.createPaginationParams(page, size);
    params.set('location', location);

    return this.http.get<any>(url, { params: params as any })
      .pipe(
        map(response => ApiResponseHandler.parsePaginatedResponse<Post[]>(response, page, size) as unknown as ApiResponse<Post[]>),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * Get posts by tags
   */
  getPostsByTags(tags: string[], page: number = 0, size: number = 10): Observable<ApiResponse<Post[]>> {
    const url = `${this.API_BASE_URL}/posts/tags`;
    const params = PaginationHandler.createPaginationParams(page, size);
    params.set('tags', tags.join(','));

    return this.http.get<any>(url, { params: params as any })
      .pipe(
        map(response => ApiResponseHandler.parsePaginatedResponse<Post[]>(response, page, size) as unknown as ApiResponse<Post[]>),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * Update post
   */
  updatePost(postId: string, postData: PostUpdate): Observable<ApiResponse<Post>> {
    const url = `${this.API_BASE_URL}/posts/${postId}`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.put<ApiResponse<Post>>(url, postData, { headers })
      .pipe(catchError(error => this.handleError(error)));
  }

  /**
   * Delete post
   */
  deletePost(postId: string): Observable<ApiResponse<any>> {
    const url = `${this.API_BASE_URL}/posts/${postId}`;

    return this.http.delete<ApiResponse<any>>(url)
      .pipe(catchError(error => this.handleError(error)));
  }

  /**
   * Upvote post
   */
  upvotePost(postId: string): Observable<ApiResponse<Post>> {
    const url = `${this.API_BASE_URL}/posts/${postId}/upvote`;
    return this.http.post<ApiResponse<Post>>(url, {})
      .pipe(catchError(error => this.handleError(error)));
  }

  /**
   * Downvote post
   */
  downvotePost(postId: string): Observable<ApiResponse<Post>> {
    const url = `${this.API_BASE_URL}/posts/${postId}/downvote`;
    return this.http.post<ApiResponse<Post>>(url, {})
      .pipe(catchError(error => this.handleError(error)));
  }

  // ==================== COMMENT MANAGEMENT ====================

  /**
   * Get post comments
   */
  getComments(postId: string, page: number = 0, size: number = 10): Observable<ApiResponse<Comment[]>> {
    const url = `${this.API_BASE_URL}/posts/${postId}/comments`;
    const params = PaginationHandler.createPaginationParams(page, size);

    return this.http.get<any>(url, { params: params as any })
      .pipe(
        map(response => ApiResponseHandler.parsePaginatedResponse<Comment[]>(response, page, size) as unknown as ApiResponse<Comment[]>),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * Create comment
   */
  createComment(postId: string, commentData: CommentCreate): Observable<ApiResponse<Comment>> {
    const url = `${this.API_BASE_URL}/posts/${postId}/comments`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.post<ApiResponse<Comment>>(url, commentData, { headers })
      .pipe(catchError(error => this.handleError(error)));
  }

  /**
   * Update comment
   */
  updateComment(postId: string, commentId: string, commentData: CommentUpdate): Observable<ApiResponse<Comment>> {
    const url = `${this.API_BASE_URL}/posts/${postId}/comments/${commentId}`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.put<ApiResponse<Comment>>(url, commentData, { headers })
      .pipe(catchError(error => this.handleError(error)));
  }

  /**
   * Delete comment
   */
  deleteComment(postId: string, commentId: string): Observable<ApiResponse<any>> {
    const url = `${this.API_BASE_URL}/posts/${postId}/comments/${commentId}`;

    return this.http.delete<ApiResponse<any>>(url)
      .pipe(catchError(error => this.handleError(error)));
  }

  /**
   * Upvote comment
   */
  upvoteComment(postId: string, commentId: string): Observable<ApiResponse<Comment>> {
    const url = `${this.API_BASE_URL}/posts/${postId}/comments/${commentId}/upvote`;
    return this.http.post<ApiResponse<Comment>>(url, {})
      .pipe(catchError(error => this.handleError(error)));
  }

  /**
   * Downvote comment
   */
  downvoteComment(postId: string, commentId: string): Observable<ApiResponse<Comment>> {
    const url = `${this.API_BASE_URL}/posts/${postId}/comments/${commentId}/downvote`;
    return this.http.post<ApiResponse<Comment>>(url, {})
      .pipe(catchError(error => this.handleError(error)));
  }

  // ==================== MARKETPLACE ====================

  /**
   * Browse products
   */
  getProducts(page: number = 0, size: number = 10, q?: string, category?: string, active: boolean = true): Observable<ApiResponse<Product[]>> {
    const url = `${this.API_BASE_URL}/market/products`;
    const params = PaginationHandler.createPaginationParams(page, size);

    if (q) params.set('q', q);
    if (category) params.set('category', category);
    params.set('active', active.toString());

    return this.http.get<any>(url, { params: params as any })
      .pipe(
        map(response => ApiResponseHandler.parsePaginatedResponse<Product[]>(response, page, size) as unknown as ApiResponse<Product[]>),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * Get specific product
   */
  getProduct(productId: string): Observable<ApiResponse<Product>> {
    const url = `${this.API_BASE_URL}/market/products/${productId}`;

    return this.http.get<ApiResponse<Product>>(url)
      .pipe(catchError(error => this.handleError(error)));
  }

  /**
   * Get cart
   */
  getCart(): Observable<ApiResponse<Cart>> {
    const url = `${this.API_BASE_URL}/market/cart`;

    return this.http.get<ApiResponse<Cart>>(url)
      .pipe(catchError(error => this.handleError(error)));
  }

  /**
   * Add item to cart
   */
  addToCart(item: CartItemAdd): Observable<ApiResponse<Cart>> {
    const url = `${this.API_BASE_URL}/market/cart/items`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.post<ApiResponse<Cart>>(url, item, { headers })
      .pipe(catchError(error => this.handleError(error)));
  }

  /**
   * Update cart item
   */
  updateCartItem(lineId: string, item: CartItemUpdate): Observable<ApiResponse<Cart>> {
    const url = `${this.API_BASE_URL}/market/cart/items/${lineId}`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.put<ApiResponse<Cart>>(url, item, { headers })
      .pipe(catchError(error => this.handleError(error)));
  }

  /**
   * Remove item from cart
   */
  removeFromCart(lineId: string): Observable<ApiResponse<Cart>> {
    const url = `${this.API_BASE_URL}/market/cart/items/${lineId}`;

    return this.http.delete<ApiResponse<Cart>>(url)
      .pipe(catchError(error => this.handleError(error)));
  }

  /**
   * Clear cart
   */
  clearCart(): Observable<ApiResponse<Cart>> {
    const url = `${this.API_BASE_URL}/market/cart`;

    return this.http.delete<ApiResponse<Cart>>(url)
      .pipe(catchError(error => this.handleError(error)));
  }

  /**
   * Checkout
   */
  checkout(orderData: OrderCreate): Observable<ApiResponse<Order>> {
    const url = `${this.API_BASE_URL}/market/orders/checkout`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.post<ApiResponse<Order>>(url, orderData, { headers })
      .pipe(catchError(error => this.handleError(error)));
  }

  /**
   * Get orders
   */
  getOrders(page: number = 0, size: number = 10): Observable<ApiResponse<Order[]>> {
    const url = `${this.API_BASE_URL}/market/orders`;
    const params = PaginationHandler.createPaginationParams(page, size);

    return this.http.get<any>(url, { params: params as any })
      .pipe(
        map(response => ApiResponseHandler.parsePaginatedResponse<Order[]>(response, page, size) as unknown as ApiResponse<Order[]>),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * Get specific order
   */
  getOrder(orderId: string): Observable<ApiResponse<Order>> {
    const url = `${this.API_BASE_URL}/market/orders/${orderId}`;

    return this.http.get<ApiResponse<Order>>(url)
      .pipe(catchError(error => this.handleError(error)));
  }

  /**
   * Cancel order
   */
  cancelOrder(orderId: string): Observable<ApiResponse<Order>> {
    const url = `${this.API_BASE_URL}/market/orders/${orderId}`;

    return this.http.delete<ApiResponse<Order>>(url)
      .pipe(catchError(error => this.handleError(error)));
  }

  // ==================== ADMIN APIs ====================

  /**
   * Get all users (admin only)
   */
  getAllUsers(): Observable<ApiResponse<AdminUser[]>> {
    const url = `${this.API_BASE_URL}/admin/users`;

    return this.http.get<ApiResponse<AdminUser[]>>(url)
      .pipe(catchError(error => this.handleError(error)));
  }

  /**
   * Create user (admin only)
   */
  createAdminUser(userData: {
    userName: string;
    password: string;
    firstName: string;
    lastName: string;
    email: string;
  }): Observable<ApiResponse<User>> {
    const url = `${this.API_BASE_URL}/admin/users`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.post<ApiResponse<User>>(url, userData, { headers })
      .pipe(catchError(error => this.handleError(error)));
  }

  /**
   * Delete user (admin only)
   */
  deleteAdminUser(username: string): Observable<ApiResponse<any>> {
    const url = `${this.API_BASE_URL}/admin/users/${username}`;

    return this.http.delete<ApiResponse<any>>(url)
      .pipe(catchError(error => this.handleError(error)));
  }

  /**
   * Reset user password (admin only)
   */
  resetUserPassword(username: string, newPassword: string): Observable<ApiResponse<any>> {
    const url = `${this.API_BASE_URL}/admin/users/${username}/password`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const body = { password: newPassword };

    return this.http.put<ApiResponse<any>>(url, body, { headers })
      .pipe(catchError(error => this.handleError(error)));
  }

  /**
   * Promote user to admin (admin only)
   */
  promoteUserToAdmin(username: string): Observable<ApiResponse<any>> {
    const url = `${this.API_BASE_URL}/admin/users/${username}/promote`;
    return this.http.post<ApiResponse<any>>(url, {})
      .pipe(catchError(error => this.handleError(error)));
  }

  /**
   * Update user roles (admin only)
   */
  updateUserRoles(username: string, roles: string[]): Observable<ApiResponse<any>> {
    const url = `${this.API_BASE_URL}/admin/users/${username}/roles`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const body = { roles };

    return this.http.put<ApiResponse<any>>(url, body, { headers })
      .pipe(catchError(error => this.handleError(error)));
  }

  /**
   * Get user by username (admin only)
   */
  getAdminUserByUsername(username: string): Observable<ApiResponse<AdminUser>> {
    const url = `${this.API_BASE_URL}/admin/users/${username}`;

    return this.http.get<ApiResponse<AdminUser>>(url)
      .pipe(catchError(error => this.handleError(error)));
  }

  /**
   * Get users by role (admin only)
   */
  getUsersByRole(role: string): Observable<ApiResponse<AdminUser[]>> {
    const url = `${this.API_BASE_URL}/admin/users/role/${role}`;

    return this.http.get<ApiResponse<AdminUser[]>>(url)
      .pipe(catchError(error => this.handleError(error)));
  }

  /**
   * Set user active status (admin only)
   */
  setUserActiveStatus(username: string, active: boolean): Observable<ApiResponse<any>> {
    const url = `${this.API_BASE_URL}/admin/users/${username}/status`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const body = { active };

    return this.http.put<ApiResponse<any>>(url, body, { headers })
      .pipe(catchError(error => this.handleError(error)));
  }

  /**
   * Get system statistics (admin only)
   */
  getSystemStats(): Observable<ApiResponse<{ totalUsers: number; adminUsers: number; regularUsers: number }>> {
    const url = `${this.API_BASE_URL}/admin/stats`;

    return this.http.get<ApiResponse<{ totalUsers: number; adminUsers: number; regularUsers: number }>>(url)
      .pipe(catchError(error => this.handleError(error)));
  }

  // ==================== ADMIN MARKETPLACE APIs ====================

  /**
   * Create product (admin only)
   */
  createProduct(productData: ProductCreate): Observable<ApiResponse<Product>> {
    const url = `${this.API_BASE_URL}/admin/market/products`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.post<ApiResponse<Product>>(url, productData, { headers })
      .pipe(catchError(error => this.handleError(error)));
  }

  /**
   * Update product (admin only)
   */
  updateProduct(productId: string, productData: ProductUpdate): Observable<ApiResponse<Product>> {
    const url = `${this.API_BASE_URL}/admin/market/products/${productId}`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.put<ApiResponse<Product>>(url, productData, { headers })
      .pipe(catchError(error => this.handleError(error)));
  }

  /**
   * Delete product (admin only)
   */
  deleteProduct(productId: string): Observable<ApiResponse<any>> {
    const url = `${this.API_BASE_URL}/admin/market/products/${productId}`;

    return this.http.delete<ApiResponse<any>>(url)
      .pipe(catchError(error => this.handleError(error)));
  }

  /**
   * Get admin orders with filtering (admin only)
   */
  getAdminOrders(page: number = 0, size: number = 10, buyerId?: string, status?: string): Observable<ApiResponse<Order[]>> {
    const url = `${this.API_BASE_URL}/admin/market/orders`;
    let params = PaginationHandler.createPaginationParams(page, size);

    if (buyerId) params = params.set('buyerId', buyerId) as any;
    if (status) params = params.set('status', status) as any;

    return this.http.get<any>(url, { params: params as any })
      .pipe(
        map(response => ApiResponseHandler.parsePaginatedResponse<Order[]>(response, page, size) as unknown as ApiResponse<Order[]>),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * Mark order as paid (admin only)
   */
  markOrderPaid(orderId: string, paymentNote?: string): Observable<ApiResponse<Order>> {
    const url = `${this.API_BASE_URL}/admin/market/orders/${orderId}/mark-paid`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const body = paymentNote ? { paymentNote } : {};

    return this.http.put<ApiResponse<Order>>(url, body, { headers })
      .pipe(catchError(error => this.handleError(error)));
  }

  /**
   * Fulfill order (admin only)
   */
  fulfillOrder(orderId: string, adminNotes?: string): Observable<ApiResponse<Order>> {
    const url = `${this.API_BASE_URL}/admin/market/orders/${orderId}/fulfill`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const body = adminNotes ? { adminNotes } : {};

    return this.http.put<ApiResponse<Order>>(url, body, { headers })
      .pipe(catchError(error => this.handleError(error)));
  }

  /**
   * Cancel order (admin only)
   */
  adminCancelOrder(orderId: string, adminNotes?: string): Observable<ApiResponse<Order>> {
    const url = `${this.API_BASE_URL}/admin/market/orders/${orderId}/cancel`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const body = adminNotes ? { adminNotes } : {};

    return this.http.put<ApiResponse<Order>>(url, body, { headers })
      .pipe(catchError(error => this.handleError(error)));
  }

  // ==================== HELPER METHODS ====================

  /**
   * Get authentication data from local storage
   * Note: This is a simplified approach for demonstration
   */
  private getAuthDataFromLocalStorage(): { username: string, password: string } | null {
    try {
      const stored = localStorage.getItem('travner_auth');
      if (!stored) return null;
      const auth = JSON.parse(stored);
      if (!auth?.username || !auth?.password) return null;
      return auth;
    } catch (error) {
      console.error('Error retrieving stored auth data:', error);
      return null;
    }
  }

  /**
   * Handle HTTP errors using standardized error handler
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    const parsedError: ApiError = ErrorHandler.parseHttpError(error);
    console.error('API Error:', parsedError);
    return throwError(parsedError);
  }
}