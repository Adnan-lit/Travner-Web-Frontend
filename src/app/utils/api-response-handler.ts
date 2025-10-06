import { ApiResponse, ApiPaginationInfo } from '../models/api-response.model';

/**
 * Unified API Response Handler
 * Handles responses according to the Travner API specification:
 * {
 *   success: boolean;
 *   message?: string;
 *   data?: T;
 *   pagination?: ApiPaginationInfo;
 * }
 */
export class ApiResponseHandler {
  /**
   * Parse and validate API response
   * @param response The raw API response
   * @returns Parsed response with proper typing
   */
  static parseResponse<T>(response: any): ApiResponse<T> {
    // Handle case where response is already in the correct format
    if (response && typeof response === 'object' && 'success' in response) {
      return response as ApiResponse<T>;
    }

    // Handle direct data responses (fallback for inconsistent APIs)
    return {
      success: true,
      data: response as T
    } as ApiResponse<T>;
  }

  /**
   * Parse paginated response
   * @param response The raw API response
   * @param page Current page number
   * @param size Page size
   * @returns Parsed response with pagination info
   */
  static parsePaginatedResponse<T>(response: any, page: number, size: number): ApiResponse<T[]> {
    const parsedResponse = this.parseResponse<T[]>(response);
    
    // If pagination info already exists, return as is
    if (parsedResponse.pagination) {
      return parsedResponse;
    }

    // Extract pagination info from response structure
    let pagination: ApiPaginationInfo | undefined;

    if (response && typeof response === 'object') {
      // Check for pagination in root level
      if (response.pagination) {
        pagination = this.normalizePagination(response.pagination);
      } 
      // Check for pagination in data object
      else if (response.data && typeof response.data === 'object' && response.data.pagination) {
        pagination = this.normalizePagination(response.data.pagination);
      }
      // Check for Spring-style pagination
      else if (response.content) {
        pagination = {
          page: response.number ?? response.page ?? page,
          size: response.size ?? size,
          totalElements: response.totalElements ?? response.total_elements ?? (response.content?.length || 0),
          totalPages: response.totalPages ?? response.total_pages ?? Math.ceil((response.totalElements || response.total_elements || response.content?.length || 0) / (response.size || size))
        };
      }
    }

    return {
      ...parsedResponse,
      pagination
    };
  }

  /**
   * Normalize pagination info from various formats
   * @param pagination Raw pagination object
   * @returns Normalized pagination info
   */
  private static normalizePagination(pagination: any): ApiPaginationInfo {
    return {
      page: pagination.page ?? pagination.number ?? pagination.pageNumber ?? 0,
      size: pagination.size ?? pagination.pageSize ?? 10,
      totalElements: pagination.totalElements ?? pagination.total_elements ?? 0,
      totalPages: pagination.totalPages ?? pagination.total_pages ?? 0,
      first: pagination.first,
      last: pagination.last
    };
  }

  /**
   * Create a successful API response
   * @param data Response data
   * @param message Optional message
   * @param pagination Optional pagination info
   * @returns Formatted API response
   */
  static createSuccessResponse<T>(data: T, message?: string, pagination?: ApiPaginationInfo): ApiResponse<T> {
    return {
      success: true,
      message,
      data,
      pagination
    };
  }

  /**
   * Create an error API response
   * @param message Error message
   * @param data Optional error data
   * @returns Formatted error response
   */
  static createErrorResponse<T>(message: string, data?: T): ApiResponse<T> {
    return {
      success: false,
      message,
      data
    };
  }
}