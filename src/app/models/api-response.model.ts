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
    first?: boolean;
    last?: boolean;
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
