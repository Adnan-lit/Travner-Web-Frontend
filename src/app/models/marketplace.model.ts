// Marketplace models based on API documentation

export interface Product {
    id: string;
    title: string;
    description: string;
    price: number;
    currency: 'BDT'; // Fixed to Bangladeshi Taka
    stock: number;
    imageUrls: string[];
    category: string;
    active: boolean;
    version: number;
}

export interface ProductCreate {
    title: string;
    description: string;
    price: number;
    currency: string;
    stock: number;
    imageUrls: string[];
    category: string;
    active: boolean;
}

export interface ProductUpdate {
    title?: string;
    description?: string;
    price?: number;
    currency?: string;
    stock?: number;
    imageUrls?: string[];
    category?: string;
    active?: boolean;
}

export interface CartItem {
    lineId: string;
    productId: string;
    titleSnapshot: string;
    unitPrice: number;
    quantity: number;
}

export interface Cart {
    id: string;
    items: CartItem[];
    currency: 'BDT'; // Fixed to Bangladeshi Taka
    subtotal: number;
}

export interface CartItemAdd {
    productId: string;
    quantity: number;
}

export interface CartItemUpdate {
    quantity: number;
}

export interface CustomerInfo {
    fullName: string;
    email: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
}

export interface OrderItem {
    productId: string;
    titleSnapshot: string;
    unitPrice: number;
    quantity: number;
}

export interface Order {
    id: string;
    status: OrderStatus;
    items: OrderItem[];
    amountTotal: number;
    currency: 'BDT'; // Fixed to Bangladeshi Taka
    paymentMethod: string;
    customerInfo: CustomerInfo;
    createdAt: string;
    updatedAt: string;
}

export type OrderStatus = 'PLACED' | 'PAID' | 'FULFILLED' | 'CANCELED';

export interface OrderCreate {
    customerInfo: CustomerInfo;
}

export interface OrderAdminUpdate {
    adminNotes?: string;
    paymentNote?: string;
}

export interface OrderListResponse {
    content: Order[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}

export interface ProductListResponse {
    content: Product[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}

// Search parameters for products
export interface ProductSearchParams {
    page?: number;
    size?: number;
    q?: string;
    category?: string;
    active?: boolean;
}

// Search parameters for orders
export interface OrderSearchParams {
    page?: number;
    size?: number;
    buyerId?: string;
    status?: OrderStatus;
}