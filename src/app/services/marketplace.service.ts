import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { EnvironmentConfig } from '../config/environment.config';
import {
    Product,
    CreateProductRequest,
    UpdateProductRequest,
    Cart,
    AddToCartRequest,
    UpdateCartItemRequest,
    Order,
    ProductSearchParams,
    ProductListResponse,
    ProductResponse,
    CartResponse,
    OrderResponse,
    OrderListResponse
} from '../models/marketplace.model';
import { ApiResponse, ApiListResponse } from '../models/api-response.model';

@Injectable({
    providedIn: 'root'
})
export class MarketplaceService {
    private readonly API_BASE_URL = EnvironmentConfig.getApiBaseUrl();

    constructor(private http: HttpClient) { }

    // Product Management APIs

    /**
     * Get all products with optional search and pagination
     */
    getProducts(params?: ProductSearchParams): Observable<ApiListResponse<Product>> {
        const endpoint = `${this.API_BASE_URL}/api/market/products`;
        const httpParams: any = {};

        if (params) {
            Object.keys(params).forEach(key => {
                if (params[key as keyof ProductSearchParams] !== undefined) {
                    httpParams[key] = params[key as keyof ProductSearchParams];
                }
            });
        }

        console.log('🛒 MarketplaceService: Making request to:', endpoint);
        console.log('🛒 MarketplaceService: API_BASE_URL:', this.API_BASE_URL);
        console.log('🛒 MarketplaceService: Params:', httpParams);

        return this.http.get<ApiListResponse<Product>>(endpoint, { params: httpParams }).pipe(
            tap(response => {
                console.log('✅ MarketplaceService: Products response received:', response);
            }),
            catchError(error => {
                console.error('❌ MarketplaceService: Error fetching products:', error);
                throw error;
            })
        );
    }

    /**
     * Get product by ID
     */
    getProductById(productId: string): Observable<ApiResponse<Product>> {
        const endpoint = `${this.API_BASE_URL}/api/market/products/${productId}`;
        return this.http.get<ApiResponse<Product>>(endpoint).pipe(
            catchError(error => {
                console.error(`Error fetching product ${productId}:`, error);
                throw error;
            })
        );
    }

    /**
     * Create a new product
     */
    createProduct(productData: CreateProductRequest): Observable<ApiResponse<Product>> {
        const endpoint = `${this.API_BASE_URL}/api/market/products`;
        return this.http.post<ApiResponse<Product>>(endpoint, productData).pipe(
            catchError(error => {
                console.error('Error creating product:', error);
                throw error;
            })
        );
    }

    /**
     * Update an existing product
     */
    updateProduct(productId: string, productData: UpdateProductRequest): Observable<ApiResponse<Product>> {
        const endpoint = `${this.API_BASE_URL}/api/market/products/${productId}`;
        return this.http.put<ApiResponse<Product>>(endpoint, productData).pipe(
            catchError(error => {
                console.error(`Error updating product ${productId}:`, error);
                throw error;
            })
        );
    }

    /**
     * Delete a product
     */
    deleteProduct(productId: string): Observable<ApiResponse<void>> {
        const endpoint = `${this.API_BASE_URL}/api/market/products/${productId}`;
        return this.http.delete<ApiResponse<void>>(endpoint).pipe(
            catchError(error => {
                console.error(`Error deleting product ${productId}:`, error);
                throw error;
            })
        );
    }

    /**
     * Search products by query
     */
    searchProducts(query: string, page: number = 0, size: number = 10): Observable<ApiListResponse<Product>> {
        const endpoint = `${this.API_BASE_URL}/api/market/products/search`;
        const params = new HttpParams()
            .set('query', query)
            .set('page', page.toString())
            .set('size', size.toString());
        return this.http.get<ApiListResponse<Product>>(endpoint, { params }).pipe(
            catchError(error => {
                console.error(`Error searching products with query '${query}':`, error);
                throw error;
            })
        );
    }

    /**
     * Get products by category
     */
    getProductsByCategory(category: string, page: number = 0, size: number = 10): Observable<ApiListResponse<Product>> {
        const endpoint = `${this.API_BASE_URL}/api/market/products/category/${category}`;
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());
        return this.http.get<ApiListResponse<Product>>(endpoint, { params }).pipe(
            catchError(error => {
                console.error(`Error fetching products by category '${category}':`, error);
                throw error;
            })
        );
    }

    /**
     * Get products by location
     */
    getProductsByLocation(location: string, page: number = 0, size: number = 10): Observable<ApiListResponse<Product>> {
        const endpoint = `${this.API_BASE_URL}/api/market/products/location/${location}`;
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());
        return this.http.get<ApiListResponse<Product>>(endpoint, { params }).pipe(
            catchError(error => {
                console.error(`Error fetching products by location '${location}':`, error);
                throw error;
            })
        );
    }

    /**
     * Get products by tags
     */
    getProductsByTags(tags: string[], page: number = 0, size: number = 10): Observable<ApiListResponse<Product>> {
        const endpoint = `${this.API_BASE_URL}/api/market/products/tags`;
        const params = new HttpParams()
            .set('tags', tags.join(','))
            .set('page', page.toString())
            .set('size', size.toString());
        return this.http.get<ApiListResponse<Product>>(endpoint, { params }).pipe(
            catchError(error => {
                console.error(`Error fetching products by tags '${tags.join(',')}':`, error);
                throw error;
            })
        );
    }

    /**
     * Get seller's products
     */
    getSellerProducts(sellerId: string, page: number = 0, size: number = 10): Observable<ApiListResponse<Product>> {
        const endpoint = `${this.API_BASE_URL}/api/market/products/seller/${sellerId}`;
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());
        return this.http.get<ApiListResponse<Product>>(endpoint, { params }).pipe(
            catchError(error => {
                console.error(`Error fetching products for seller ${sellerId}:`, error);
                throw error;
            })
        );
    }

    // Cart APIs

    /**
     * Get user's cart
     */
    getCart(): Observable<ApiResponse<Cart>> {
        const endpoint = `${this.API_BASE_URL}/api/cart`;
        console.log('🛒 Making cart request to:', endpoint);
        console.log('🛒 API_BASE_URL:', this.API_BASE_URL);
        return this.http.get<ApiResponse<Cart>>(endpoint).pipe(
            tap(response => {
                console.log('✅ Cart request successful:', response);
            }),
            catchError(error => {
                console.error('🛒 Error fetching cart:', error);
                if (error.status === 401) {
                    console.warn('🛒 Cart access denied - user not authenticated');
                    console.warn('🛒 This might indicate an authentication issue with the cart endpoint');
                }
                throw error;
            })
        );
    }

    /**
     * Add item to cart
     */
    addToCart(cartItem: AddToCartRequest): Observable<ApiResponse<Cart>> {
        const endpoint = `${this.API_BASE_URL}/api/cart/items`;
        return this.http.post<ApiResponse<Cart>>(endpoint, cartItem).pipe(
            catchError(error => {
                console.error('Error adding item to cart:', error);
                throw error;
            })
        );
    }

    /**
     * Update cart item quantity
     */
    updateCartItem(productId: string, updateData: UpdateCartItemRequest): Observable<ApiResponse<Cart>> {
        const endpoint = `${this.API_BASE_URL}/api/cart/items/${productId}`;
        return this.http.put<ApiResponse<Cart>>(endpoint, updateData).pipe(
            catchError(error => {
                console.error(`Error updating cart item ${productId}:`, error);
                throw error;
            })
        );
    }

    /**
     * Remove item from cart
     */
    removeCartItem(productId: string): Observable<ApiResponse<Cart>> {
        const endpoint = `${this.API_BASE_URL}/api/cart/items/${productId}`;
        return this.http.delete<ApiResponse<Cart>>(endpoint).pipe(
            catchError(error => {
                console.error(`Error removing cart item ${productId}:`, error);
                throw error;
            })
        );
    }

    /**
     * Clear cart
     */
    clearCart(): Observable<ApiResponse<Cart>> {
        const endpoint = `${this.API_BASE_URL}/api/cart/clear`;
        return this.http.delete<ApiResponse<Cart>>(endpoint).pipe(
            catchError(error => {
                console.error('Error clearing cart:', error);
                throw error;
            })
        );
    }

    /**
     * Get cart item count
     */
    getCartItemCount(): Observable<ApiResponse<number>> {
        const endpoint = `${this.API_BASE_URL}/api/cart/count`;
        console.log('🛒 Making cart count request to:', endpoint);
        console.log('🛒 API_BASE_URL:', this.API_BASE_URL);
        return this.http.get<ApiResponse<number>>(endpoint).pipe(
            tap(response => {
                console.log('✅ Cart count request successful:', response);
            }),
            catchError(error => {
                console.error('🛒 Error fetching cart item count:', error);
                if (error.status === 401) {
                    console.warn('🛒 Cart count access denied - user not authenticated');
                    console.warn('🛒 This might indicate an authentication issue with the cart count endpoint');
                }
                throw error;
            })
        );
    }

    /**
     * Checkout cart
     */
    checkout(): Observable<ApiResponse<Order>> {
        const endpoint = `${this.API_BASE_URL}/api/cart/checkout`;
        return this.http.post<ApiResponse<Order>>(endpoint, {}).pipe(
            catchError(error => {
                console.error('Error during checkout:', error);
                throw error;
            })
        );
    }

    /**
     * Cancel an order
     */
    cancelOrder(orderId: string): Observable<ApiResponse<Order>> {
        const endpoint = `${this.API_BASE_URL}/api/market/orders/${orderId}/cancel`;
        return this.http.post<ApiResponse<Order>>(endpoint, {}).pipe(
            catchError(error => {
                console.error(`Error cancelling order ${orderId}:`, error);
                throw error;
            })
        );
    }

    /**
     * Get order by ID
     */
    getOrderById(orderId: string): Observable<ApiResponse<Order>> {
        const endpoint = `${this.API_BASE_URL}/api/market/orders/${orderId}`;
        return this.http.get<ApiResponse<Order>>(endpoint).pipe(
            catchError(error => {
                console.error(`Error fetching order ${orderId}:`, error);
                throw error;
            })
        );
    }

    /**
     * Get admin orders with search parameters
     */
    getAdminOrders(params?: any): Observable<ApiListResponse<Order>> {
        const endpoint = `${this.API_BASE_URL}/api/market/orders/admin`;
        return this.http.get<ApiListResponse<Order>>(endpoint, { params }).pipe(
            catchError(error => {
                console.error('Error fetching admin orders:', error);
                throw error;
            })
        );
    }

    /**
     * Mark order as paid
     */
    markOrderPaid(orderId: string, notes?: string): Observable<ApiResponse<Order>> {
        const endpoint = `${this.API_BASE_URL}/api/market/orders/${orderId}/pay`;
        return this.http.post<ApiResponse<Order>>(endpoint, { notes }).pipe(
            catchError(error => {
                console.error(`Error marking order ${orderId} as paid:`, error);
                throw error;
            })
        );
    }

    /**
     * Fulfill order
     */
    fulfillOrder(orderId: string, notes?: string): Observable<ApiResponse<Order>> {
        const endpoint = `${this.API_BASE_URL}/api/market/orders/${orderId}/fulfill`;
        return this.http.post<ApiResponse<Order>>(endpoint, { notes }).pipe(
            catchError(error => {
                console.error(`Error fulfilling order ${orderId}:`, error);
                throw error;
            })
        );
    }

    /**
     * Admin cancel order
     */
    adminCancelOrder(orderId: string, notes?: string): Observable<ApiResponse<Order>> {
        const endpoint = `${this.API_BASE_URL}/api/market/orders/${orderId}/admin-cancel`;
        return this.http.post<ApiResponse<Order>>(endpoint, { notes }).pipe(
            catchError(error => {
                console.error(`Error admin cancelling order ${orderId}:`, error);
                throw error;
            })
        );
    }
}