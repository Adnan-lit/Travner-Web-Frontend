// Marketplace models based on Travner API documentation

import { ApiResponse, ApiPaginationInfo } from './api-response.model';

// Product models
export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    stockQuantity: number;
    location: string;
    tags: string[];
    images: string[];
    sellerId: string;
    sellerUsername: string;
    isAvailable: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateProductRequest {
    name: string;
    description: string;
    price: number;
    category: string;
    stockQuantity: number;
    location: string;
    tags: string[];
    images: string[];
}

export interface UpdateProductRequest {
    name?: string;
    description?: string;
    price?: number;
    stockQuantity?: number;
}

// Cart models
export interface CartItem {
    productId: string;
    productName: string;
    titleSnapshot: string;
    unitPrice: number;
    quantity: number;
    subtotal: number;
    sellerId: string;
    sellerName: string;
    productImage: string;
    lineId: string;
    addedAt: string;
}

export interface Cart {
    id: string;
    userId: string;
    items: CartItem[];
    totalAmount: number;
    totalItems: number;
    createdAt: string;
    updatedAt: string;
}

export interface AddToCartRequest {
    productId: string;
    quantity: number;
}

export interface UpdateCartItemRequest {
    quantity: number;
}

// Order models (based on checkout response)
export interface OrderItem {
    id: string;
    orderId: string;
    productId: string;
    titleSnapshot: string;
    descriptionSnapshot: string;
    imageUrlSnapshot: string;
    unitPrice: number;
    quantity: number;
    sellerId: string;
    createdAt: string;
    updatedAt: string;
}

export interface CustomerInfo {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    email: string;
    phone: string;
}

export interface Order {
    id: string;
    userId: string;
    items: OrderItem[];
    amountTotal: number;
    itemCount: number;
    status: 'PLACED' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
    customerInfo: CustomerInfo;
    createdAt: string;
    updatedAt: string;
}

// Search and pagination
export interface ProductSearchParams {
    page?: number;
    size?: number;
    sortBy?: string;
    direction?: 'asc' | 'desc';
    query?: string;
    category?: string;
    location?: string;
    tags?: string;
}

// API Response types
export type ProductListResponse = ApiResponse<Product[]> & {
    pagination: ApiPaginationInfo;
};

export type ProductResponse = ApiResponse<Product>;
export type CartResponse = ApiResponse<Cart>;
export type OrderResponse = ApiResponse<Order>;
export type OrderListResponse = ApiResponse<Order[]> & {
    pagination: ApiPaginationInfo;
};