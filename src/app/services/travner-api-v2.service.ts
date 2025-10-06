import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { EnvironmentConfig } from '../config/environment.config';
import { ApiResponse, ApiPaginationInfo } from '../models/api-response.model';
import { User } from '../models/common.model';
import { Post, PostCreate, PostUpdate } from '../models/post.model';
import { Comment, CommentCreate, CommentUpdate } from '../models/comment.model';
import {
    Product, ProductCreate, ProductUpdate,
    Cart, CartItemAdd, CartItemUpdate,
    Order, OrderCreate
} from '../models/marketplace.model';
import {
    ChatConversation, ChatMessage, ChatMessageCreate,
    ChatConversationCreate, ChatMarkAsRead
} from '../models/chat.models';

/**
 * Complete Travner API Service
 * Implements all endpoints according to the official API reference
 */
@Injectable({
    providedIn: 'root'
})
export class TravnerApiService {
    private readonly API_BASE_URL = EnvironmentConfig.getApiBaseUrl();

    constructor(private http: HttpClient) { }

    // ==================== AUTHENTICATION & USERS ====================

    /**
     * Register a new user (public endpoint)
     */
    registerUser(userData: {
        userName: string;
        password: string;
        firstName: string;
        lastName: string;
        email: string;
    }): Observable<ApiResponse<User>> {
        return this.http.post<ApiResponse<User>>(
            `${this.API_BASE_URL}/public/create-user`,
            userData
        );
    }

    /**
     * Check if username is available (public endpoint)
     */
    checkUsernameAvailability(username: string): Observable<ApiResponse<{ available: boolean }>> {
        return this.http.get<ApiResponse<{ available: boolean }>>(
            `${this.API_BASE_URL}/public/check-username/${username}`
        );
    }

    /**
     * Request password reset (public endpoint)
     */
    forgotPassword(username: string): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(
            `${this.API_BASE_URL}/public/forgot-password`,
            { username }
        );
    }

    /**
     * Reset password with token (public endpoint)
     */
    resetPassword(token: string, newPassword: string): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(
            `${this.API_BASE_URL}/public/reset-password`,
            { token, newPassword }
        );
    }

    /**
     * Get current authenticated user
     */
    getCurrentUser(): Observable<ApiResponse<User>> {
        return this.http.get<ApiResponse<User>>(`${this.API_BASE_URL}/user`);
    }

    /**
     * Get user profile
     */
    getUserProfile(): Observable<ApiResponse<any>> {
        return this.http.get<ApiResponse<any>>(`${this.API_BASE_URL}/user/profile`);
    }

    /**
     * Update user profile (full update)
     */
    updateUserProfile(profileData: {
        firstName: string;
        lastName: string;
        email: string;
        bio?: string;
        location?: string;
    }): Observable<ApiResponse<any>> {
        return this.http.put<ApiResponse<any>>(
            `${this.API_BASE_URL}/user/profile`,
            profileData
        );
    }

    /**
     * Partial update user profile
     */
    patchUserProfile(profileData: Partial<{
        firstName: string;
        lastName: string;
        email: string;
        bio: string;
        location: string;
    }>): Observable<ApiResponse<any>> {
        return this.http.patch<ApiResponse<any>>(
            `${this.API_BASE_URL}/user/profile`,
            profileData
        );
    }

    /**
     * Change password
     */
    changePassword(currentPassword: string, newPassword: string): Observable<ApiResponse<any>> {
        return this.http.put<ApiResponse<any>>(
            `${this.API_BASE_URL}/user/password`,
            { currentPassword, newPassword }
        );
    }

    /**
     * Get public profile by username
     */
    getPublicProfile(username: string): Observable<ApiResponse<any>> {
        return this.http.get<ApiResponse<any>>(`${this.API_BASE_URL}/user/public/${username}`);
    }

    // ==================== POSTS & CONTENT ====================

    /**
     * Browse all posts (public endpoint)
     */
    getAllPosts(params?: {
        page?: number;
        size?: number;
        sortBy?: string;
        direction?: 'asc' | 'desc';
    }): Observable<ApiResponse<Post[]>> {
        let httpParams = new HttpParams();
        if (params?.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
        if (params?.size !== undefined) httpParams = httpParams.set('size', params.size.toString());
        if (params?.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
        if (params?.direction) httpParams = httpParams.set('direction', params.direction);

        return this.http.get<ApiResponse<Post[]>>(
            `${this.API_BASE_URL}/posts`,
            { params: httpParams }
        );
    }

    /**
     * Get specific post by ID (public endpoint)
     */
    getPost(postId: string): Observable<ApiResponse<Post>> {
        return this.http.get<ApiResponse<Post>>(`${this.API_BASE_URL}/posts/${postId}`);
    }

    /**
     * Get posts by user (public endpoint)
     */
    getPostsByUser(username: string, params?: {
        page?: number;
        size?: number;
    }): Observable<ApiResponse<Post[]>> {
        let httpParams = new HttpParams();
        if (params?.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
        if (params?.size !== undefined) httpParams = httpParams.set('size', params.size.toString());

        return this.http.get<ApiResponse<Post[]>>(
            `${this.API_BASE_URL}/posts/user/${username}`,
            { params: httpParams }
        );
    }

    /**
     * Search posts (public endpoint)
     */
    searchPosts(query: string, params?: {
        page?: number;
        size?: number;
    }): Observable<ApiResponse<Post[]>> {
        let httpParams = new HttpParams().set('query', query);
        if (params?.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
        if (params?.size !== undefined) httpParams = httpParams.set('size', params.size.toString());

        return this.http.get<ApiResponse<Post[]>>(
            `${this.API_BASE_URL}/posts/search`,
            { params: httpParams }
        );
    }

    /**
     * Filter posts by location (public endpoint)
     */
    getPostsByLocation(location: string, params?: {
        page?: number;
        size?: number;
    }): Observable<ApiResponse<Post[]>> {
        let httpParams = new HttpParams().set('location', location);
        if (params?.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
        if (params?.size !== undefined) httpParams = httpParams.set('size', params.size.toString());

        return this.http.get<ApiResponse<Post[]>>(
            `${this.API_BASE_URL}/posts/location`,
            { params: httpParams }
        );
    }

    /**
     * Filter posts by tags (public endpoint)
     */
    getPostsByTags(tags: string[], params?: {
        page?: number;
        size?: number;
    }): Observable<ApiResponse<Post[]>> {
        let httpParams = new HttpParams().set('tags', tags.join(','));
        if (params?.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
        if (params?.size !== undefined) httpParams = httpParams.set('size', params.size.toString());

        return this.http.get<ApiResponse<Post[]>>(
            `${this.API_BASE_URL}/posts/tags`,
            { params: httpParams }
        );
    }

    /**
     * Create a new post (authenticated)
     */
    createPost(postData: {
        title: string;
        content: string;
        location?: string;
        tags?: string[];
        published?: boolean;
    }): Observable<ApiResponse<Post>> {
        return this.http.post<ApiResponse<Post>>(
            `${this.API_BASE_URL}/posts`,
            postData
        );
    }

    /**
     * Update post (authenticated, owner only)
     */
    updatePost(postId: string, postData: Partial<{
        title: string;
        content: string;
        location: string;
        tags: string[];
        published: boolean;
    }>): Observable<ApiResponse<Post>> {
        return this.http.put<ApiResponse<Post>>(
            `${this.API_BASE_URL}/posts/${postId}`,
            postData
        );
    }

    /**
     * Delete post (authenticated, owner only)
     */
    deletePost(postId: string): Observable<ApiResponse<any>> {
        return this.http.delete<ApiResponse<any>>(`${this.API_BASE_URL}/posts/${postId}`);
    }

    /**
     * Upvote post (authenticated)
     */
    upvotePost(postId: string): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(
            `${this.API_BASE_URL}/posts/${postId}/upvote`,
            {}
        );
    }

    /**
     * Downvote post (authenticated)
     */
    downvotePost(postId: string): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(
            `${this.API_BASE_URL}/posts/${postId}/downvote`,
            {}
        );
    }

    // ==================== COMMENTS ====================

    /**
     * Get comments for a post (public endpoint)
     */
    getPostComments(postId: string, params?: {
        page?: number;
        size?: number;
    }): Observable<ApiResponse<Comment[]>> {
        let httpParams = new HttpParams();
        if (params?.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
        if (params?.size !== undefined) httpParams = httpParams.set('size', params.size.toString());

        return this.http.get<ApiResponse<Comment[]>>(
            `${this.API_BASE_URL}/posts/${postId}/comments`,
            { params: httpParams }
        );
    }

    /**
     * Create comment (authenticated)
     */
    createComment(postId: string, commentData: {
        content: string;
        parentCommentId?: string;
    }): Observable<ApiResponse<Comment>> {
        return this.http.post<ApiResponse<Comment>>(
            `${this.API_BASE_URL}/posts/${postId}/comments`,
            commentData
        );
    }

    /**
     * Update comment (authenticated, owner only)
     */
    updateComment(postId: string, commentId: string, content: string): Observable<ApiResponse<Comment>> {
        return this.http.put<ApiResponse<Comment>>(
            `${this.API_BASE_URL}/posts/${postId}/comments/${commentId}`,
            { content }
        );
    }

    /**
     * Delete comment (authenticated, owner only)
     */
    deleteComment(postId: string, commentId: string): Observable<ApiResponse<any>> {
        return this.http.delete<ApiResponse<any>>(
            `${this.API_BASE_URL}/posts/${postId}/comments/${commentId}`
        );
    }

    /**
     * Upvote comment (authenticated)
     */
    upvoteComment(postId: string, commentId: string): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(
            `${this.API_BASE_URL}/posts/${postId}/comments/${commentId}/upvote`,
            {}
        );
    }

    /**
     * Downvote comment (authenticated)
     */
    downvoteComment(postId: string, commentId: string): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(
            `${this.API_BASE_URL}/posts/${postId}/comments/${commentId}/downvote`,
            {}
        );
    }

    // ==================== REAL-TIME CHAT ====================

    /**
     * List conversations (authenticated)
     */
    getConversations(params?: {
        page?: number;
        size?: number;
    }): Observable<ApiResponse<ChatConversation[]>> {
        let httpParams = new HttpParams();
        if (params?.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
        if (params?.size !== undefined) httpParams = httpParams.set('size', params.size.toString());

        return this.http.get<ApiResponse<ChatConversation[]>>(
            `${this.API_BASE_URL}/api/chat/conversations`,
            { params: httpParams }
        );
    }

    /**
     * Create or get direct conversation (authenticated)
     */
    createConversation(memberIds: string[]): Observable<ApiResponse<ChatConversation>> {
        return this.http.post<ApiResponse<ChatConversation>>(
            `${this.API_BASE_URL}/api/chat/conversations`,
            {
                type: 'DIRECT',
                memberIds
            }
        );
    }

    /**
     * Get conversation with specific user (authenticated)
     */
    getDirectConversation(otherUserId: string): Observable<ApiResponse<ChatConversation>> {
        return this.http.get<ApiResponse<ChatConversation>>(
            `${this.API_BASE_URL}/api/chat/conversations/direct/${otherUserId}`
        );
    }

    /**
     * Send message (authenticated)
     */
    sendMessage(messageData: ChatMessageCreate): Observable<ApiResponse<ChatMessage>> {
        return this.http.post<ApiResponse<ChatMessage>>(
            `${this.API_BASE_URL}/api/chat/messages`,
            messageData
        );
    }

    /**
     * Get messages for conversation (authenticated)
     */
    getMessages(conversationId: string, params?: {
        page?: number;
        size?: number;
    }): Observable<ApiResponse<ChatMessage[]>> {
        let httpParams = new HttpParams();
        if (params?.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
        if (params?.size !== undefined) httpParams = httpParams.set('size', params.size.toString());

        return this.http.get<ApiResponse<ChatMessage[]>>(
            `${this.API_BASE_URL}/api/chat/conversations/${conversationId}/messages`,
            { params: httpParams }
        );
    }

    /**
     * Edit message (authenticated, sender only)
     */
    editMessage(messageId: string, content: string): Observable<ApiResponse<ChatMessage>> {
        return this.http.put<ApiResponse<ChatMessage>>(
            `${this.API_BASE_URL}/api/chat/messages/${messageId}`,
            { content }
        );
    }

    /**
     * Delete message (authenticated, sender only)
     */
    deleteMessage(messageId: string): Observable<ApiResponse<any>> {
        return this.http.delete<ApiResponse<any>>(
            `${this.API_BASE_URL}/api/chat/messages/${messageId}`
        );
    }

    /**
     * Mark messages as read (authenticated)
     */
    markAsRead(readData: ChatMarkAsRead): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(
            `${this.API_BASE_URL}/api/chat/messages/read`,
            readData
        );
    }

    /**
     * Get unread count for conversation (authenticated)
     */
    getUnreadCount(conversationId: string): Observable<ApiResponse<{ count: number }>> {
        return this.http.get<ApiResponse<{ count: number }>>(
            `${this.API_BASE_URL}/api/chat/conversations/${conversationId}/unread-count`
        );
    }

    // ==================== MARKETPLACE ====================

    /**
     * Browse products (public endpoint)
     */
    getProducts(params?: {
        page?: number;
        size?: number;
        q?: string;
        category?: string;
        active?: boolean;
    }): Observable<ApiResponse<Product[]>> {
        let httpParams = new HttpParams();
        if (params?.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
        if (params?.size !== undefined) httpParams = httpParams.set('size', params.size.toString());
        if (params?.q) httpParams = httpParams.set('q', params.q);
        if (params?.category) httpParams = httpParams.set('category', params.category);
        if (params?.active !== undefined) httpParams = httpParams.set('active', params.active.toString());

        return this.http.get<ApiResponse<Product[]>>(
            `${this.API_BASE_URL}/market/products`,
            { params: httpParams }
        );
    }

    /**
     * Get product details (public endpoint)
     */
    getProduct(productId: string): Observable<ApiResponse<Product>> {
        return this.http.get<ApiResponse<Product>>(
            `${this.API_BASE_URL}/market/products/${productId}`
        );
    }

    /**
     * Get shopping cart (authenticated)
     */
    getCart(): Observable<ApiResponse<Cart>> {
        return this.http.get<ApiResponse<Cart>>(`${this.API_BASE_URL}/market/cart`);
    }

    /**
     * Add item to cart (authenticated)
     */
    addToCart(item: CartItemAdd): Observable<ApiResponse<Cart>> {
        return this.http.post<ApiResponse<Cart>>(
            `${this.API_BASE_URL}/market/cart/items`,
            item
        );
    }

    /**
     * Update cart item quantity (authenticated)
     */
    updateCartItem(lineId: string, quantity: number): Observable<ApiResponse<Cart>> {
        return this.http.put<ApiResponse<Cart>>(
            `${this.API_BASE_URL}/market/cart/items/${lineId}`,
            { quantity }
        );
    }

    /**
     * Remove cart item (authenticated)
     */
    removeCartItem(lineId: string): Observable<ApiResponse<Cart>> {
        return this.http.delete<ApiResponse<Cart>>(
            `${this.API_BASE_URL}/market/cart/items/${lineId}`
        );
    }

    /**
     * Clear cart (authenticated)
     */
    clearCart(): Observable<ApiResponse<any>> {
        return this.http.delete<ApiResponse<any>>(`${this.API_BASE_URL}/market/cart`);
    }

    /**
     * Checkout order (authenticated)
     */
    checkout(customerInfo: {
        fullName: string;
        email: string;
        phone: string;
        addressLine1: string;
        city: string;
        country: string;
    }): Observable<ApiResponse<Order>> {
        return this.http.post<ApiResponse<Order>>(
            `${this.API_BASE_URL}/market/orders/checkout`,
            { customerInfo }
        );
    }

    /**
     * Get user orders (authenticated)
     */
    getUserOrders(params?: {
        page?: number;
        size?: number;
    }): Observable<ApiResponse<Order[]>> {
        let httpParams = new HttpParams();
        if (params?.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
        if (params?.size !== undefined) httpParams = httpParams.set('size', params.size.toString());

        return this.http.get<ApiResponse<Order[]>>(
            `${this.API_BASE_URL}/market/orders`,
            { params: httpParams }
        );
    }

    /**
     * Get specific order (authenticated)
     */
    getOrder(orderId: string): Observable<ApiResponse<Order>> {
        return this.http.get<ApiResponse<Order>>(`${this.API_BASE_URL}/market/orders/${orderId}`);
    }

    /**
     * Cancel order (authenticated, PLACED status only)
     */
    cancelOrder(orderId: string): Observable<ApiResponse<any>> {
        return this.http.delete<ApiResponse<any>>(
            `${this.API_BASE_URL}/market/orders/${orderId}`
        );
    }

    // ==================== MEDIA MANAGEMENT ====================

    /**
     * Upload media to post (authenticated)
     */
    uploadPostMedia(postId: string, file: File): Observable<ApiResponse<any>> {
        const formData = new FormData();
        formData.append('file', file);

        return this.http.post<ApiResponse<any>>(
            `${this.API_BASE_URL}/posts/${postId}/media/upload`,
            formData
        );
    }

    /**
     * Get post media list (authenticated)
     */
    getPostMedia(postId: string): Observable<ApiResponse<any[]>> {
        return this.http.get<ApiResponse<any[]>>(
            `${this.API_BASE_URL}/posts/${postId}/media`
        );
    }

    /**
     * Download/Get specific media file (authenticated)
     */
    getMediaFile(postId: string, mediaId: string): Observable<Blob> {
        return this.http.get(
            `${this.API_BASE_URL}/posts/${postId}/media/${mediaId}`,
            { responseType: 'blob' }
        );
    }

    /**
     * Delete media file (authenticated)
     */
    deleteMedia(postId: string, mediaId: string): Observable<ApiResponse<any>> {
        return this.http.delete<ApiResponse<any>>(
            `${this.API_BASE_URL}/posts/${postId}/media/${mediaId}`
        );
    }

    // ==================== ADMIN APIs ====================

    /**
     * List all users (admin only)
     */
    adminGetUsers(): Observable<ApiResponse<User[]>> {
        return this.http.get<ApiResponse<User[]>>(`${this.API_BASE_URL}/admin/users`);
    }

    /**
     * Get specific user (admin only)
     */
    adminGetUser(username: string): Observable<ApiResponse<User>> {
        return this.http.get<ApiResponse<User>>(`${this.API_BASE_URL}/admin/users/${username}`);
    }

    /**
     * Delete user (admin only)
     */
    adminDeleteUser(username: string): Observable<ApiResponse<any>> {
        return this.http.delete<ApiResponse<any>>(`${this.API_BASE_URL}/admin/users/${username}`);
    }

    /**
     * Update user roles (admin only)
     */
    adminUpdateUserRoles(username: string, roles: string[]): Observable<ApiResponse<any>> {
        return this.http.put<ApiResponse<any>>(
            `${this.API_BASE_URL}/admin/users/${username}/roles`,
            { roles }
        );
    }

    /**
     * Reset user password (admin only)
     */
    adminResetUserPassword(username: string, password: string): Observable<ApiResponse<any>> {
        return this.http.put<ApiResponse<any>>(
            `${this.API_BASE_URL}/admin/users/${username}/password`,
            { password }
        );
    }

    /**
     * Create admin user (admin only)
     */
    adminCreateUser(userData: {
        userName: string;
        password: string;
        firstName: string;
        lastName: string;
        email: string;
    }): Observable<ApiResponse<User>> {
        return this.http.post<ApiResponse<User>>(
            `${this.API_BASE_URL}/admin/users`,
            userData
        );
    }

    /**
     * Admin get products (admin only)
     */
    adminGetProducts(params?: {
        page?: number;
        size?: number;
        q?: string;
        category?: string;
        active?: boolean;
    }): Observable<ApiResponse<Product[]>> {
        let httpParams = new HttpParams();
        if (params?.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
        if (params?.size !== undefined) httpParams = httpParams.set('size', params.size.toString());
        if (params?.q) httpParams = httpParams.set('q', params.q);
        if (params?.category) httpParams = httpParams.set('category', params.category);
        if (params?.active !== undefined) httpParams = httpParams.set('active', params.active.toString());

        return this.http.get<ApiResponse<Product[]>>(
            `${this.API_BASE_URL}/admin/market/products`,
            { params: httpParams }
        );
    }

    /**
     * Admin create product (admin only)
     */
    adminCreateProduct(productData: {
        title: string;
        description: string;
        price: number;
        currency: string;
        stock: number;
        imageUrls?: string[];
        category?: string;
        active?: boolean;
    }): Observable<ApiResponse<Product>> {
        return this.http.post<ApiResponse<Product>>(
            `${this.API_BASE_URL}/admin/market/products`,
            productData
        );
    }

    /**
     * Admin update product (admin only)
     */
    adminUpdateProduct(productId: string, productData: Partial<{
        title: string;
        description: string;
        price: number;
        currency: string;
        stock: number;
        imageUrls: string[];
        category: string;
        active: boolean;
    }>): Observable<ApiResponse<Product>> {
        return this.http.put<ApiResponse<Product>>(
            `${this.API_BASE_URL}/admin/market/products/${productId}`,
            productData
        );
    }

    /**
     * Admin delete product (admin only)
     */
    adminDeleteProduct(productId: string): Observable<ApiResponse<any>> {
        return this.http.delete<ApiResponse<any>>(
            `${this.API_BASE_URL}/admin/market/products/${productId}`
        );
    }

    /**
     * Admin get orders (admin only)
     */
    adminGetOrders(params?: {
        page?: number;
        size?: number;
        buyerId?: string;
        status?: string;
    }): Observable<ApiResponse<Order[]>> {
        let httpParams = new HttpParams();
        if (params?.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
        if (params?.size !== undefined) httpParams = httpParams.set('size', params.size.toString());
        if (params?.buyerId) httpParams = httpParams.set('buyerId', params.buyerId);
        if (params?.status) httpParams = httpParams.set('status', params.status);

        return this.http.get<ApiResponse<Order[]>>(
            `${this.API_BASE_URL}/admin/market/orders`,
            { params: httpParams }
        );
    }

    /**
     * Admin mark order as paid (admin only)
     */
    adminMarkOrderPaid(orderId: string, paymentNote?: string): Observable<ApiResponse<any>> {
        const body = paymentNote ? { paymentNote } : {};
        return this.http.put<ApiResponse<any>>(
            `${this.API_BASE_URL}/admin/market/orders/${orderId}/mark-paid`,
            body
        );
    }

    /**
     * Admin fulfill order (admin only)
     */
    adminFulfillOrder(orderId: string, adminNotes?: string): Observable<ApiResponse<any>> {
        const body = adminNotes ? { adminNotes } : {};
        return this.http.put<ApiResponse<any>>(
            `${this.API_BASE_URL}/admin/market/orders/${orderId}/fulfill`,
            body
        );
    }

    /**
     * Admin cancel order (admin only)
     */
    adminCancelOrder(orderId: string, adminNotes?: string): Observable<ApiResponse<any>> {
        const body = adminNotes ? { adminNotes } : {};
        return this.http.put<ApiResponse<any>>(
            `${this.API_BASE_URL}/admin/market/orders/${orderId}/cancel`,
            body
        );
    }

    /**
     * Get system statistics (admin only)
     */
    adminGetStats(): Observable<ApiResponse<any>> {
        return this.http.get<ApiResponse<any>>(`${this.API_BASE_URL}/admin/stats`);
    }
}