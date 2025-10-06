/**
 * Marketplace Error Handler Utility
 * Provides consistent error handling for marketplace API calls
 */

export interface MarketplaceError {
    message: string;
    code?: string;
    status?: number;
    type: 'network' | 'validation' | 'server' | 'authentication' | 'authorization' | 'not-found' | 'conflict' | 'unknown';
}

export class MarketplaceErrorHandler {
    /**
     * Parse and categorize HTTP errors from marketplace API
     */
    static parseError(error: any): MarketplaceError {
        // Network errors
        if (!error.status) {
            return {
                message: 'Network connection failed. Please check your internet connection.',
                type: 'network'
            };
        }

        // HTTP errors
        switch (error.status) {
            case 400:
                return {
                    message: error.error?.message || 'Invalid request data. Please check your input.',
                    code: error.error?.code,
                    status: error.status,
                    type: 'validation'
                };

            case 401:
                return {
                    message: 'Authentication required. Please sign in to continue.',
                    status: error.status,
                    type: 'authentication'
                };

            case 403:
                return {
                    message: 'Access denied. You do not have permission to perform this action.',
                    status: error.status,
                    type: 'authorization'
                };

            case 404:
                return {
                    message: 'Requested resource not found.',
                    status: error.status,
                    type: 'not-found'
                };

            case 409:
                return {
                    message: error.error?.message || 'Conflict occurred. Please try again.',
                    status: error.status,
                    type: 'conflict'
                };

            case 422:
                return {
                    message: error.error?.message || 'Validation failed. Please check your input.',
                    status: error.status,
                    type: 'validation'
                };

            case 500:
                return {
                    message: 'Server error occurred. Please try again later.',
                    status: error.status,
                    type: 'server'
                };

            default:
                return {
                    message: error.error?.message || error.message || 'An unexpected error occurred. Please try again.',
                    status: error.status,
                    type: 'unknown'
                };
        }
    }

    /**
     * Get user-friendly error message for display
     */
    static getErrorMessage(error: any): string {
        const parsedError = this.parseError(error);
        return parsedError.message;
    }

    /**
     * Get appropriate toast type based on error
     */
    static getToastType(error: any): 'success' | 'error' | 'info' | 'warning' {
        const parsedError = this.parseError(error);

        switch (parsedError.type) {
            case 'validation':
            case 'authentication':
            case 'authorization':
                return 'warning';
            case 'network':
            case 'server':
            case 'conflict':
            case 'unknown':
            default:
                return 'error';
        }
    }

    /**
     * Handle error with toast notification
     */
    static handleWithToast(error: any, toastService: any): void {
        const message = this.getErrorMessage(error);
        const toastType = this.getToastType(error);

        switch (toastType) {
            case 'error':
                toastService.error(message);
                break;
            case 'warning':
                toastService.warning(message);
                break;
            case 'info':
                toastService.info(message);
                break;
            case 'success':
                toastService.success(message);
                break;
        }
    }
}