export class MarketplaceErrorHandler {
    static getErrorMessage(error: any): string {
        // Handle HTTP errors
        if (error.status) {
            switch (error.status) {
                case 400:
                    return 'Bad Request: Please check your input and try again.';
                case 401:
                    return 'Unauthorized: Please sign in to continue.';
                case 403:
                    return 'Forbidden: You do not have permission to perform this action.';
                case 404:
                    return 'Not Found: The requested resource could not be found.';
                case 409:
                    return 'Conflict: The request could not be completed due to a conflict.';
                case 422:
                    return 'Unprocessable Entity: Please check your input and try again.';
                case 429:
                    return 'Too Many Requests: Please try again later.';
                case 500:
                    return 'Internal Server Error: Please try again later.';
                case 502:
                    return 'Bad Gateway: Please try again later.';
                case 503:
                    return 'Service Unavailable: Please try again later.';
                case 504:
                    return 'Gateway Timeout: Please try again later.';
                default:
                    return error.message || `HTTP Error ${error.status}: An unknown error occurred.`;
            }
        }

        // Handle network errors
        if (error.name === 'HttpErrorResponse') {
            if (!error.status) {
                return 'Network Error: Please check your connection and try again.';
            }
        }

        // Handle other errors
        if (error.message) {
            return error.message;
        }

        // Fallback
        return 'An unknown error occurred. Please try again later.';
    }
}