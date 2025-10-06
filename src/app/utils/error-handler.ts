import { HttpErrorResponse } from '@angular/common/http';

/**
 * Standardized Error Handler
 * Provides consistent error handling across all services according to Travner API specifications
 */
export class ErrorHandler {
  /**
   * Parse HTTP error response
   * @param error HTTP error response
   * @returns Parsed error object with standardized format
   */
  static parseHttpError(error: HttpErrorResponse): ApiError {
    // Network error
    if (error.status === 0) {
      return {
        success: false,
        message: 'Network connection failed. Please check your internet connection.',
        code: 'NETWORK_ERROR',
        status: 0
      };
    }

    // Server returned an error response
    if (error.error) {
      // Check if it's already in our API format
      if (typeof error.error === 'object' && 'success' in error.error) {
        return {
          success: error.error.success,
          message: error.error.message || this.getDefaultMessage(error.status),
          code: error.error.code,
          status: error.status,
          data: error.error.data
        };
      }
      
      // Handle standard error formats
      return {
        success: false,
        message: error.error.message || error.message || this.getDefaultMessage(error.status),
        code: error.error.code || this.getStatusName(error.status),
        status: error.status,
        data: error.error
      };
    }

    // Fallback for other error types
    return {
      success: false,
      message: error.message || this.getDefaultMessage(error.status),
      code: this.getStatusName(error.status),
      status: error.status
    };
  }

  /**
   * Get default message for HTTP status code
   * @param status HTTP status code
   * @returns Default error message
   */
  private static getDefaultMessage(status: number): string {
    switch (status) {
      case 400:
        return 'Bad Request - The request could not be understood by the server.';
      case 401:
        return 'Unauthorized - Authentication is required and has failed or has not yet been provided.';
      case 403:
        return 'Forbidden - The server understood the request but refuses to authorize it.';
      case 404:
        return 'Not Found - The requested resource could not be found.';
      case 409:
        return 'Conflict - The request could not be completed due to a conflict with the current state of the target resource.';
      case 422:
        return 'Unprocessable Entity - The request was well-formed but was unable to be followed due to semantic errors.';
      case 500:
        return 'Internal Server Error - The server encountered an unexpected condition.';
      case 502:
        return 'Bad Gateway - The server received an invalid response from the upstream server.';
      case 503:
        return 'Service Unavailable - The server is not ready to handle the request.';
      default:
        return `HTTP Error ${status} - An unexpected error occurred.`;
    }
  }

  /**
   * Get status name for HTTP status code
   * @param status HTTP status code
   * @returns Status name
   */
  private static getStatusName(status: number): string {
    switch (status) {
      case 400:
        return 'BAD_REQUEST';
      case 401:
        return 'UNAUTHORIZED';
      case 403:
        return 'FORBIDDEN';
      case 404:
        return 'NOT_FOUND';
      case 409:
        return 'CONFLICT';
      case 422:
        return 'UNPROCESSABLE_ENTITY';
      case 500:
        return 'INTERNAL_SERVER_ERROR';
      case 502:
        return 'BAD_GATEWAY';
      case 503:
        return 'SERVICE_UNAVAILABLE';
      default:
        return `HTTP_${status}`;
    }
  }

  /**
   * Create a user-friendly error message
   * @param error Parsed error object
   * @returns User-friendly error message
   */
  static getUserFriendlyMessage(error: ApiError): string {
    // Return specific message if available
    if (error.message) {
      return error.message;
    }

    // Return default message based on status
    return this.getDefaultMessage(error.status || 0);
  }

  /**
   * Determine if error is retryable
   * @param error Parsed error object
   * @returns True if error is retryable
   */
  static isRetryable(error: ApiError): boolean {
    // Network errors are retryable
    if (error.status === 0) {
      return true;
    }

    // Server errors (5xx) are retryable
    if (error.status && error.status >= 500 && error.status < 600) {
      return true;
    }

    // Some client errors (408, 429) are retryable
    if (error.status === 408 || error.status === 429) {
      return true;
    }

    return false;
  }
}

/**
 * API Error Interface
 * Standardized error format according to Travner API specifications
 */
export interface ApiError {
  success: boolean;
  message: string;
  code?: string;
  status?: number;
  data?: any;
}