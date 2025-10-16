// Generic API response wrapper based on backend documentation
// Format:
// {
//   success: boolean;
//   message?: string;
//   data?: T;
//   pagination?: {
//     page: number;
//     size: number;
//     totalElements: number;
//     totalPages: number;
//     first?: boolean;
//     last?: boolean;
//   }
// }

export interface ApiPaginationInfo {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
}

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
    pagination?: ApiPaginationInfo;
    // The backend sometimes may include other keys; we allow index signature
    [key: string]: any;
}

// Utility type to express a wrapped paginated list (
// sometimes backend may put array directly in data, or data.content)
export type ApiListResponse<T> = ApiResponse<T[]>;

// Error response interface
export interface ApiErrorResponse {
    success: false;
    message: string;
    error?: any;
    status?: number;
    timestamp?: string;
}

// Health check response
export interface HealthCheckResponse {
    status: string;
    timestamp: string;
    version?: string;
    uptime?: number;
}

// Diagnostic response
export interface DiagnosticResponse {
    success: boolean;
    message: string;
    data: {
        timestamp: string;
        status: string;
        checks: {
            database: boolean;
            storage: boolean;
            auth: boolean;
            api: boolean;
        };
        version: string;
    };
}

// File upload response
export interface FileUploadResponse {
    success: boolean;
    message: string;
    data: {
        files: Array<{
            id: string;
            name: string;
            size: number;
            type: string;
            url: string;
        }>;
    };
}

// Statistics response
export interface StatisticsResponse {
    success: boolean;
    message: string;
    data: {
        totalUsers: number;
        totalPosts: number;
        totalComments: number;
        totalProducts: number;
        totalOrders: number;
        activeUsers: number;
        newUsersToday: number;
        newPostsToday: number;
        newOrdersToday: number;
    };
}

// Activity log response
export interface ActivityLogResponse {
    success: boolean;
    message: string;
    data: Array<{
        id: string;
        userId: string;
        userName: string;
        action: string;
        resource: string;
        resourceId: string;
        timestamp: string;
        details?: any;
    }>;
}

// Search response
export interface SearchResponse<T> {
    success: boolean;
    message: string;
    data: T[];
    pagination: ApiPaginationInfo;
    totalResults: number;
    query: string;
    searchTime: number;
}
