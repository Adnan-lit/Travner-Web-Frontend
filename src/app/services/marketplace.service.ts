import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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
import { ApiResponse } from '../models/api-response.model';

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
    getProducts(params?: ProductSearchParams): Observable<ProductListResponse> {
        const endpoint = `${this.API_BASE_URL}/api/market/products`;
        const httpParams: any = {};

        if (params) {
            Object.keys(params).forEach(key => {
                if (params[key as keyof ProductSearchParams] !== undefined) {
                    httpParams[key] = params[key as keyof ProductSearchParams];
                }
            });
        }

        // Ensure we're returning the proper type with pagination info
        return this.http.get<ApiResponse<Product[]>>(endpoint, { params: httpParams })
            .pipe(
                map(response => {
                    // Transform the response to include pagination in the expected format
                    return {
                        ...response,
                        data: response.data || [],
                        pagination: response.pagination || {
                            page: 0,
                            size: 0,
                            totalElements: 0,
                            totalPages: 0,
                            first: true,
                            last: true
                        }
                    } as ProductListResponse;
                })
            );
    }

    /**
     * Get product by ID
     */
    getProductById(productId: string): Observable<ProductResponse> {
        const endpoint = `${this.API_BASE_URL}/api/market/products/${productId}`;
        return this.http.get<ProductResponse>(endpoint);
    }

    /**
     * Create a new product
     */
    createProduct(productData: CreateProductRequest): Observable<ProductResponse> {
        const endpoint = `${this.API_BASE_URL}/api/market/products`;
        return this.http.post<ProductResponse>(endpoint, productData);
    }

    /**
     * Update an existing product
     */
    updateProduct(productId: string, productData: UpdateProductRequest): Observable<ProductResponse> {
        const endpoint = `${this.API_BASE_URL}/api/market/products/${productId}`;
        return this.http.put<ProductResponse>(endpoint, productData);
    }

    /**
     * Delete a product
     */
    deleteProduct(productId: string): Observable<void> {
        const endpoint = `${this.API_BASE_URL}/api/market/products/${productId}`;
        return this.http.delete<void>(endpoint);
    }

    /**
     * Search products by query
     */
    searchProducts(query: string, page: number = 0, size: number = 10): Observable<ProductListResponse> {
        const endpoint = `${this.API_BASE_URL}/api/market/products/search`;
        const params = { query, page: page.toString(), size: size.toString() };
        return this.http.get<ProductListResponse>(endpoint, { params });
    }

    /**
     * Get products by category
     */
    getProductsByCategory(category: string, page: number = 0, size: number = 10): Observable<ProductListResponse> {
        const endpoint = `${this.API_BASE_URL}/api/market/products/category/${category}`;
        const params = { page: page.toString(), size: size.toString() };
        return this.http.get<ProductListResponse>(endpoint, { params });
    }

    /**
     * Get products by location
     */
    getProductsByLocation(location: string, page: number = 0, size: number = 10): Observable<ProductListResponse> {
        const endpoint = `${this.API_BASE_URL}/api/market/products/location/${location}`;
        const params = { page: page.toString(), size: size.toString() };
        return this.http.get<ProductListResponse>(endpoint, { params });
    }

    /**
     * Get products by tags
     */
    getProductsByTags(tags: string[], page: number = 0, size: number = 10): Observable<ProductListResponse> {
        const endpoint = `${this.API_BASE_URL}/api/market/products/tags`;
        const params = { tags: tags.join(','), page: page.toString(), size: size.toString() };
        return this.http.get<ProductListResponse>(endpoint, { params });
    }

    /**
     * Get seller's products
     */
    getSellerProducts(sellerId: string, page: number = 0, size: number = 10): Observable<ProductListResponse> {
        const endpoint = `${this.API_BASE_URL}/api/market/products/seller/${sellerId}`;
        const params = { page: page.toString(), size: size.toString() };
        return this.http.get<ProductListResponse>(endpoint, { params });
    }

    // Cart APIs

    /**
     * Get user's cart
     */
    getCart(): Observable<CartResponse> {
        const endpoint = `${this.API_BASE_URL}/api/cart`;
        return this.http.get<CartResponse>(endpoint);
    }

    /**
     * Add item to cart
     */
    addToCart(cartItem: AddToCartRequest): Observable<CartResponse> {
        const endpoint = `${this.API_BASE_URL}/api/cart/items`;
        return this.http.post<CartResponse>(endpoint, cartItem);
    }

    /**
     * Update cart item quantity
     */
    updateCartItem(productId: string, updateData: UpdateCartItemRequest): Observable<CartResponse> {
        const endpoint = `${this.API_BASE_URL}/api/cart/items/${productId}`;
        return this.http.put<CartResponse>(endpoint, updateData);
    }

    /**
     * Remove item from cart
     */
    removeCartItem(productId: string): Observable<CartResponse> {
        const endpoint = `${this.API_BASE_URL}/api/cart/items/${productId}`;
        return this.http.delete<CartResponse>(endpoint);
    }

    /**
     * Clear cart
     */
    clearCart(): Observable<CartResponse> {
        const endpoint = `${this.API_BASE_URL}/api/cart/clear`;
        return this.http.delete<CartResponse>(endpoint);
    }

    /**
     * Get cart item count
     */
    getCartItemCount(): Observable<number> {
        const endpoint = `${this.API_BASE_URL}/api/cart/count`;
        return this.http.get<number>(endpoint);
    }

    /**
     * Checkout cart
     */
    checkout(): Observable<any> {
        const endpoint = `${this.API_BASE_URL}/api/cart/checkout`;
        return this.http.post<any>(endpoint, {});
    }

    /**
     * Cancel an order
     */
    cancelOrder(orderId: string): Observable<OrderResponse> {
        const endpoint = `${this.API_BASE_URL}/api/market/orders/${orderId}/cancel`;
        return this.http.post<OrderResponse>(endpoint, {});
    }

    /**
     * Get order by ID
     */
    getOrderById(orderId: string): Observable<OrderResponse> {
        const endpoint = `${this.API_BASE_URL}/api/market/orders/${orderId}`;
        return this.http.get<OrderResponse>(endpoint);
    }

    /**
     * Get admin orders with search parameters
     */
    getAdminOrders(params?: any): Observable<OrderListResponse> {
        const endpoint = `${this.API_BASE_URL}/api/market/orders/admin`;
        return this.http.get<OrderListResponse>(endpoint, { params });
    }

    /**
     * Mark order as paid
     */
    markOrderPaid(orderId: string, notes?: string): Observable<OrderResponse> {
        const endpoint = `${this.API_BASE_URL}/api/market/orders/${orderId}/pay`;
        return this.http.post<OrderResponse>(endpoint, { notes });
    }

    /**
     * Fulfill order
     */
    fulfillOrder(orderId: string, notes?: string): Observable<OrderResponse> {
        const endpoint = `${this.API_BASE_URL}/api/market/orders/${orderId}/fulfill`;
        return this.http.post<OrderResponse>(endpoint, { notes });
    }

    /**
     * Admin cancel order
     */
    adminCancelOrder(orderId: string, notes?: string): Observable<OrderResponse> {
        const endpoint = `${this.API_BASE_URL}/api/market/orders/${orderId}/admin-cancel`;
        return this.http.post<OrderResponse>(endpoint, { notes });
    }
}