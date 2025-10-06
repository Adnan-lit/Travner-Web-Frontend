import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError, BehaviorSubject } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import {
    Product, ProductCreate, ProductUpdate, ProductListResponse,
    Cart, CartItem, CartItemAdd, CartItemUpdate,
    Order, OrderCreate, OrderAdminUpdate, OrderListResponse, OrderStatus,
    ProductSearchParams, OrderSearchParams
} from '../models/marketplace.model';
import { EnvironmentConfig } from '../config/environment.config';
import { CentralizedAuthService } from './centralized-auth.service';
import { BackendStatusService } from './backend-status.service';
import { ApiResponse, ApiListResponse } from '../models/api-response.model';
import { MarketplaceErrorHandler } from '../utils/marketplace-error-handler';
import { ApiResponseHandler } from '../utils/api-response-handler';
import { PaginationHandler } from '../utils/pagination-handler';
import { ErrorHandler } from '../utils/error-handler';
import { ImageUtil } from '../utils/image.util';

@Injectable({
    providedIn: 'root'
})
export class MarketplaceService {
    // API base URL (EnvironmentConfig now returns '/api' in dev for proxy, full absolute in prod)
    private readonly API_BASE_URL = this.normalizeBaseUrl(EnvironmentConfig.getApiBaseUrl());

    // Cart count observable
    private cartItemCountSubject = new BehaviorSubject<number>(0);
    public cartItemCount$ = this.cartItemCountSubject.asObservable();

    constructor(
        private http: HttpClient,
        private auth: CentralizedAuthService,
        private backendStatus: BackendStatusService
    ) { }

    private normalizeBaseUrl(url: string): string {
        if (!url) return '';
        if (url === '/api') return url; // keep proxy root
        return url.replace(/\/+$/, '');
    }

    private buildUrl(path: string): string {
        if (!path.startsWith('/')) path = '/' + path;
        const full = `${this.API_BASE_URL}${path}`;
        return full.replace(/([^:])\/\//g, '$1/');
    }

    // Rely on interceptor for Authorization. Set content-type only when sending JSON bodies as needed.

    /**
     * Get stored authentication data from localStorage
     * This is the same implementation as in AuthService
     */
    private getStoredAuthData(): { username: string, password: string } | null {
        const authJson = localStorage.getItem('travner_auth');
        if (authJson) {
            try {
                return JSON.parse(authJson);
            } catch (e) {
                console.error('Error parsing auth data from localStorage', e);
                return null;
            }
        }
        return null;
    }

    /**
     * Check if user is admin
     */
    private isAdmin(): boolean {
        const authData = this.getStoredAuthData();
        return authData ? authData.username === 'admin' : false;
    }

    // PRODUCT API ENDPOINTS

    /**
     * Get products with pagination and filtering (PUBLIC)
     */
    getProducts(params: ProductSearchParams = {}): Observable<ProductListResponse> {
        const httpParams = new HttpParams()
            .set('page', (params.page || 0).toString())
            .set('size', (params.size || 12).toString());

        if (params.q) httpParams.set('q', params.q);
        if (params.category) httpParams.set('category', params.category);
        if (params.active !== undefined) httpParams.set('active', params.active.toString());

        const url = this.buildUrl('/market/products');

        return this.http.get<any>(url, {
            params: httpParams,
            withCredentials: false
        }).pipe(
            map(response => {
                console.log('[MarketplaceService] Received JSON response:', response);

                // The response is already parsed JSON, no need to decode
                if (response && (response.content || response.data || Array.isArray(response))) {
                    return this.parseProductsList(response, params.page || 0, params.size || 12);
                } else {
                    console.warn('[MarketplaceService] Unexpected API response structure, using mock data', { url, response });
                    return this.getMockProducts(params.page || 0, params.size || 12);
                }
            }),
            catchError((err: HttpErrorResponse) => {
                console.error('[MarketplaceService] getProducts transport error', { url, params, status: err.status, message: err.message });
                // Use our standardized error handler
                const parsedError = ErrorHandler.parseHttpError(err);
                return throwError(parsedError);
            })
        ) as Observable<ProductListResponse>;
    }

    /**
     * Parse products list response
     */
    private parseProductsList(response: any, page: number, size: number): ProductListResponse {
        // Use our standardized API response handler
        const parsedResponse = ApiResponseHandler.parsePaginatedResponse<Product>(response, page, size);

        // Extract content and pagination
        let content: Product[] = [];
        let totalElements = 0;
        let totalPages = 0;
        let pageSize = size;
        let pageNumber = page;

        if (parsedResponse.data) {
            content = Array.isArray(parsedResponse.data)
                ? parsedResponse.data.map((p: any) => this.processProduct(p))
                : [this.processProduct(parsedResponse.data)];
        }

        if (parsedResponse.pagination) {
            totalElements = parsedResponse.pagination.totalElements;
            totalPages = parsedResponse.pagination.totalPages;
            pageSize = parsedResponse.pagination.size;
            pageNumber = parsedResponse.pagination.page;
        } else {
            // Fallback for responses without explicit pagination
            totalElements = content.length;
            totalPages = 1;
        }

        return {
            content,
            totalElements,
            totalPages,
            size: pageSize,
            number: pageNumber
        } as ProductListResponse;
    }

    /**
     * Process a single product
     */
    private processProduct(product: any): Product {
        return {
            ...product,
            id: product.id || '',
            title: product.title || '',
            description: product.description || '',
            price: Number(product.price) || 0,
            currency: product.currency || 'BDT',
            stock: Number(product.stock) || 0,
            imageUrls: Array.isArray(product.imageUrls) ? product.imageUrls : [],
            category: product.category || '',
            active: Boolean(product.active),
            version: Number(product.version) || 1
        };
    }

    /**
     * Direct backend fetch fallback disabled (simplified mode)
     */
    private attemptDirectProductsFetch(params: ProductSearchParams): Observable<ProductListResponse> {
        console.warn('[MarketplaceService] Direct products fetch fallback disabled in simplified mode');
        const size = params.size || 10;
        const page = params.page || 0;
        return of({ content: [], totalElements: 0, totalPages: 0, size, number: page });
    }

    // Removed direct header builders – interceptor handles Authorization

    /**
     * Get a specific product by ID (PUBLIC)
     */
    getProductById(id: string): Observable<Product> {
        const url = this.buildUrl(`/market/products/${id}`);
        return this.http.get<any>(url, { withCredentials: false }).pipe(
            map((response: any) => {
                if (response && response.success && response.data) {
                    return this.processProduct(response.data);
                } else {
                    return this.processProduct(response);
                }
            }),
            catchError((err: HttpErrorResponse) => {
                console.error('[MarketplaceService] getProductById error', { url, id, status: err.status, message: err.message });
                return throwError(() => MarketplaceErrorHandler.parseError(err));
            })
        );
    }

    // ADMIN PRODUCT ENDPOINTS (Authenticated ADMIN only)

    /**
     * Create a new product (ADMIN)
     */
    createProduct(product: ProductCreate): Observable<Product> {
        if (!this.isAdmin()) {
            throw new Error('Admin access required');
        }

        const url = this.buildUrl('/admin/market/products');
        return this.http.post<any>(url, product, { withCredentials: false }).pipe(
            map((response: any) => {
                if (response && response.success && response.data) {
                    return this.processProduct(response.data);
                } else {
                    return this.processProduct(response);
                }
            })
        );
    }

    /**
     * Update a product (ADMIN)
     */
    updateProduct(id: string, product: ProductUpdate): Observable<Product> {
        if (!this.isAdmin()) {
            throw new Error('Admin access required');
        }

        const url = this.buildUrl(`/admin/market/products/${id}`);
        return this.http.put<any>(url, product, { withCredentials: false }).pipe(
            map((response: any) => {
                if (response && response.success && response.data) {
                    return this.processProduct(response.data);
                } else {
                    return this.processProduct(response);
                }
            })
        );
    }

    /**
     * Delete a product (ADMIN)
     */
    deleteProduct(id: string): Observable<void> {
        if (!this.isAdmin()) {
            throw new Error('Admin access required');
        }

        const url = this.buildUrl(`/admin/market/products/${id}`);
        return this.http.delete<void>(url, { withCredentials: false });
    }

    // CART API ENDPOINTS

    /**
     * Get user cart
     */
    getCart(): Observable<Cart> {
        const url = this.buildUrl('/market/cart');
        return this.http.get<any>(url, { withCredentials: false }).pipe(
            map((response: any) => {
                if (response && response.success && response.data) {
                    return this.processCart(response.data);
                } else {
                    return this.processCart(response);
                }
            })
        );
    }

    /**
     * Process cart data
     */
    private processCart(cart: any): Cart {
        const processedCart = {
            id: cart.id || '',
            items: Array.isArray(cart.items) ? cart.items.map((item: any) => this.processCartItem(item)) : [],
            currency: cart.currency || 'BDT',
            subtotal: Number(cart.subtotal) || 0
        };

        // Update cart item count
        const itemCount = processedCart.items.reduce((total: number, item: CartItem) => total + item.quantity, 0);
        this.cartItemCountSubject.next(itemCount);

        return processedCart;
    }

    /**
     * Process cart item
     */
    private processCartItem(item: any): CartItem {
        return {
            lineId: item.lineId || '',
            productId: item.productId || '',
            titleSnapshot: item.titleSnapshot || '',
            unitPrice: Number(item.unitPrice) || 0,
            quantity: Number(item.quantity) || 0
        };
    }

    /**
     * Add item to cart
     */
    addToCart(item: CartItemAdd): Observable<Cart> {
        const url = this.buildUrl('/market/cart/items');
        return this.http.post<any>(url, item, { withCredentials: false }).pipe(
            map((response: any) => {
                if (response && response.success && response.data) {
                    return this.processCart(response.data);
                } else {
                    return this.processCart(response);
                }
            }),
            catchError((err: HttpErrorResponse) => {
                console.error('[MarketplaceService] addToCart error', { url, item, status: err.status, message: err.message });
                return throwError(() => MarketplaceErrorHandler.parseError(err));
            })
        );
    }

    /**
     * Update cart item quantity
     */
    updateCartItem(lineId: string, update: CartItemUpdate): Observable<Cart> {
        const url = this.buildUrl(`/market/cart/items/${lineId}`);
        return this.http.put<any>(url, update, { withCredentials: false }).pipe(
            map((response: any) => {
                if (response && response.success && response.data) {
                    return this.processCart(response.data);
                } else {
                    return this.processCart(response);
                }
            })
        );
    }

    /**
     * Remove cart item
     */
    removeCartItem(lineId: string): Observable<Cart> {
        const url = this.buildUrl(`/market/cart/items/${lineId}`);
        return this.http.delete<any>(url, { withCredentials: false }).pipe(
            map((response: any) => {
                if (response && response.success && response.data) {
                    return this.processCart(response.data);
                } else {
                    return this.processCart(response);
                }
            })
        );
    }

    /**
     * Clear cart
     */
    clearCart(): Observable<void> {
        const url = this.buildUrl('/market/cart');
        return this.http.delete<void>(url, { withCredentials: false });
    }

    // ORDER API ENDPOINTS

    /**
     * Checkout and create order
     */
    checkout(order: OrderCreate): Observable<Order> {
        const url = this.buildUrl('/market/orders/checkout');
        return this.http.post<any>(url, order, { withCredentials: false }).pipe(
            map((response: any) => {
                if (response && response.success && response.data) {
                    return this.processOrder(response.data);
                } else {
                    return this.processOrder(response);
                }
            }),
            catchError((err: HttpErrorResponse) => {
                console.error('[MarketplaceService] checkout error', { url, order, status: err.status, message: err.message });
                return throwError(() => MarketplaceErrorHandler.parseError(err));
            })
        );
    }

    /**
     * Process order data
     */
    private processOrder(order: any): Order {
        return {
            id: order.id || '',
            status: order.status || 'PLACED',
            items: Array.isArray(order.items) ? order.items.map((item: any) => this.processOrderItem(item)) : [],
            amountTotal: Number(order.amountTotal) || 0,
            currency: order.currency || 'BDT',
            paymentMethod: order.paymentMethod || 'MANUAL',
            customerInfo: order.customerInfo || {},
            createdAt: order.createdAt || '',
            updatedAt: order.updatedAt || ''
        };
    }

    /**
     * Process order item
     */
    private processOrderItem(item: any): any {
        return {
            productId: item.productId || '',
            titleSnapshot: item.titleSnapshot || '',
            unitPrice: Number(item.unitPrice) || 0,
            quantity: Number(item.quantity) || 0
        };
    }

    /**
     * Get user orders
     */
    getOrders(params: OrderSearchParams = {}): Observable<OrderListResponse> {
        const httpParams = new HttpParams()
            .set('page', (params.page || 0).toString())
            .set('size', (params.size || 10).toString());

        if (params.buyerId) httpParams.set('buyerId', params.buyerId);
        if (params.status) httpParams.set('status', params.status);

        const url = this.buildUrl('/market/orders');
        return this.http.get<any>(url, { params: httpParams, withCredentials: false }).pipe(
            map(response => {
                console.log('[MarketplaceService] Received orders JSON response:', response);

                // The response is already parsed JSON, no need to decode
                return this.parseOrdersList(response, params.page || 0, params.size || 10);
            }),
            catchError(err => {
                if (err && err.__htmlFallback) {
                    return this.attemptDirectOrdersFetch(params);
                }
                console.error('[MarketplaceService] getOrders transport error', { url, params, status: err.status, message: err.message });
                throw err;
            })
        ) as Observable<OrderListResponse>;
    }

    /**
     * Parse orders list response
     */
    private parseOrdersList(response: any, page: number, size: number): OrderListResponse {
        if (response && response.success) {
            const data = response.data;
            const paginationFromRoot = response.pagination || {};

            // Case: data is a wrapper again containing content
            if (data && Array.isArray(data.content)) {
                const pagination = data.pagination || paginationFromRoot;
                return {
                    content: data.content.map((o: any) => this.processOrder(o)),
                    totalElements: pagination?.totalElements || data.totalElements || data.content.length,
                    totalPages: pagination?.totalPages || data.totalPages || 1,
                    size: pagination?.size || size,
                    number: pagination?.page || page
                } as OrderListResponse;
            }

            // Case: data itself is an array
            if (Array.isArray(data)) {
                return {
                    content: data.map((o: any) => this.processOrder(o)),
                    totalElements: data.length,
                    totalPages: 1,
                    size,
                    number: page
                } as OrderListResponse;
            }
        }

        // Direct Spring page w/out wrapper
        if (response && Array.isArray(response.content)) {
            return {
                ...response,
                content: response.content.map((o: any) => this.processOrder(o))
            } as OrderListResponse;
        }

        // Simple array
        if (Array.isArray(response)) {
            return {
                content: response.map((o: any) => this.processOrder(o)),
                totalElements: response.length,
                totalPages: 1,
                size,
                number: page
            } as OrderListResponse;
        }

        console.warn('[MarketplaceService] Unexpected orders list format', response);
        return { content: [], totalElements: 0, totalPages: 0, size, number: page } as OrderListResponse;
    }

    /**
     * Attempt direct backend fetch for orders
     */
    private attemptDirectOrdersFetch(params: OrderSearchParams): Observable<OrderListResponse> {
        // Simplified build: no direct fallback; return empty result with diagnostic
        console.warn('[MarketplaceService] Direct orders fetch fallback disabled in simplified mode');
        const size = params.size || 10;
        const page = params.page || 0;
        return of({ content: [], totalElements: 0, totalPages: 0, size, number: page });
    }

    /**
     * Get a specific order by ID
     */
    getOrderById(id: string): Observable<Order> {
        const url = this.buildUrl(`/market/orders/${id}`);
        return this.http.get<any>(url, { withCredentials: false }).pipe(
            map((response: any) => {
                if (response && response.success && response.data) {
                    return this.processOrder(response.data);
                } else {
                    return this.processOrder(response);
                }
            })
        );
    }

    /**
     * Cancel an order (User - only if status = PLACED)
     */
    cancelOrder(id: string): Observable<Order> {
        const url = this.buildUrl(`/market/orders/${id}`);
        return this.http.delete<any>(url, { withCredentials: false }).pipe(
            map((response: any) => {
                if (response && response.success && response.data) {
                    return this.processOrder(response.data);
                } else {
                    return this.processOrder(response);
                }
            })
        );
    }

    // ADMIN ORDER ENDPOINTS (Authenticated ADMIN only)

    /**
     * Get admin orders with filtering
     */
    getAdminOrders(params: OrderSearchParams = {}): Observable<OrderListResponse> {
        if (!this.isAdmin()) {
            throw new Error('Admin access required');
        }

        const httpParams = new HttpParams()
            .set('page', (params.page || 0).toString())
            .set('size', (params.size || 10).toString());

        if (params.buyerId) httpParams.set('buyerId', params.buyerId);
        if (params.status) httpParams.set('status', params.status);

        const url = this.buildUrl('/admin/market/orders');
        return this.http.get<any>(url, { params: httpParams, withCredentials: false }).pipe(
            map(response => {
                console.log('[MarketplaceService] Received admin orders JSON response:', response);

                // The response is already parsed JSON, no need to decode
                return this.parseOrdersList(response, params.page || 0, params.size || 10);
            }),
            catchError(err => {
                if (err && err.__htmlFallback) {
                    return this.attemptDirectAdminOrdersFetch(params);
                }
                console.error('[MarketplaceService] getAdminOrders transport error', { url, params, status: err.status, message: err.message });
                throw err;
            })
        ) as Observable<OrderListResponse>;
    }

    /**
     * Attempt direct backend fetch for admin orders
     */
    private attemptDirectAdminOrdersFetch(params: OrderSearchParams): Observable<OrderListResponse> {
        // Simplified build: no direct fallback; return empty result with diagnostic
        console.warn('[MarketplaceService] Direct admin orders fetch fallback disabled in simplified mode');
        const size = params.size || 10;
        const page = params.page || 0;
        return of({ content: [], totalElements: 0, totalPages: 0, size, number: page });
    }

    /**
     * Mark order as paid (ADMIN)
     */
    markOrderPaid(id: string, notes?: string): Observable<Order> {
        if (!this.isAdmin()) {
            throw new Error('Admin access required');
        }

        const url = this.buildUrl(`/admin/market/orders/${id}/mark-paid`);
        const body = notes ? { paymentNote: notes } : {};
        return this.http.put<any>(url, body, { withCredentials: false }).pipe(
            map((response: any) => {
                if (response && response.success && response.data) {
                    return this.processOrder(response.data);
                } else {
                    return this.processOrder(response);
                }
            })
        );
    }

    /**
     * Fulfill an order (ADMIN)
     */
    fulfillOrder(id: string, notes?: string): Observable<Order> {
        if (!this.isAdmin()) {
            throw new Error('Admin access required');
        }

        const url = this.buildUrl(`/admin/market/orders/${id}/fulfill`);
        const body = notes ? { adminNotes: notes } : {};
        return this.http.put<any>(url, body, { withCredentials: false }).pipe(
            map((response: any) => {
                if (response && response.success && response.data) {
                    return this.processOrder(response.data);
                } else {
                    return this.processOrder(response);
                }
            })
        );
    }

    /**
     * Cancel an order (ADMIN)
     */
    adminCancelOrder(id: string, notes?: string): Observable<Order> {
        if (!this.isAdmin()) {
            throw new Error('Admin access required');
        }

        const url = this.buildUrl(`/admin/market/orders/${id}/cancel`);
        const body = notes ? { adminNotes: notes } : {};
        return this.http.put<any>(url, body, { withCredentials: false }).pipe(
            map((response: any) => {
                if (response && response.success && response.data) {
                    return this.processOrder(response.data);
                } else {
                    return this.processOrder(response);
                }
            })
        );
    }

    /**
     * Get mock products for development/fallback
     */
    private getMockProducts(page: number = 0, size: number = 12): ProductListResponse {
        console.log('[MarketplaceService] Using mock products data');

        const mockProducts: Product[] = [
            {
                id: 'mock-1',
                title: 'Smartphone Pro Max',
                description: 'Latest smartphone with advanced camera system and powerful processor',
                price: 89999,
                currency: 'BDT',
                stock: 25,
                imageUrls: [ImageUtil.createSampleProductImage('Smartphone')],
                category: 'electronics',
                active: true,
                version: 1
            },
            {
                id: 'mock-2',
                title: 'Wireless Headphones',
                description: 'High-quality wireless headphones with noise cancellation',
                price: 15999,
                currency: 'BDT',
                stock: 50,
                imageUrls: [ImageUtil.createSampleProductImage('Headphones')],
                category: 'electronics',
                active: true,
                version: 1
            },
            {
                id: 'mock-3',
                title: 'Smart Watch',
                description: 'Fitness tracker with heart rate monitor and GPS',
                price: 24999,
                currency: 'BDT',
                stock: 15,
                imageUrls: [ImageUtil.createSampleProductImage('Smart Watch')],
                category: 'electronics',
                active: true,
                version: 1
            },
            {
                id: 'mock-4',
                title: 'Laptop Backpack',
                description: 'Durable laptop backpack with multiple compartments',
                price: 2999,
                currency: 'BDT',
                stock: 30,
                imageUrls: [ImageUtil.createSampleProductImage('Backpack')],
                category: 'gadgets',
                active: true,
                version: 1
            },
            {
                id: 'mock-5',
                title: 'Bluetooth Speaker',
                description: 'Portable Bluetooth speaker with premium sound quality',
                price: 4999,
                currency: 'BDT',
                stock: 0,
                imageUrls: [ImageUtil.createSampleProductImage('Speaker')],
                category: 'electronics',
                active: true,
                version: 1
            },
            {
                id: 'mock-6',
                title: 'Gaming Mouse',
                description: 'High-precision gaming mouse with customizable RGB lighting',
                price: 3999,
                currency: 'BDT',
                stock: 20,
                imageUrls: [ImageUtil.createSampleProductImage('Gaming Mouse')],
                category: 'gadgets',
                active: true,
                version: 1
            }
        ];

        // Paginate the mock data
        const startIndex = page * size;
        const endIndex = startIndex + size;
        const paginatedProducts = mockProducts.slice(startIndex, endIndex);

        return {
            content: paginatedProducts,
            totalElements: mockProducts.length,
            totalPages: Math.ceil(mockProducts.length / size),
            size: size,
            number: page
        } as ProductListResponse;
    }
}