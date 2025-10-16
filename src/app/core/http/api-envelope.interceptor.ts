import { HttpInterceptorFn, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { ApiResponse, ApiErrorResponse } from '../../models/api-response.model';

/**
 * API Envelope Interceptor
 * Handles the standard API response format { success, message, data, pagination? }
 * Maps HTTP error codes to descriptive messages
 * Unwraps successful responses while preserving error information
 * Handles HTML error responses gracefully
 */
export const apiEnvelopeInterceptor: HttpInterceptorFn = (req, next) => {
    return next(req).pipe(
        map(event => {
            if (event instanceof HttpResponse) {
                // Skip wrapping for binary responses (blob/arraybuffer)
                const isBinaryResponse = req.responseType === 'blob' || req.responseType === 'arraybuffer' || event.body instanceof Blob;
                if (isBinaryResponse) {
                    return event;
                }
                
                // Check if response is HTML, which indicates an error page
                const contentType = event.headers.get('content-type');
                if (contentType?.includes('text/html')) {
                    console.error('Received HTML response instead of JSON:', event.url);

                    // Return a structured error response
                    const errorResponse: ApiResponse<null> = {
                        success: false,
                        message: 'Server returned an error page',
                        data: null,
                        error: event.body
                    };

                    return event.clone({ body: errorResponse });
                }
                
                // If content type is clearly binary, do not wrap
                const isClearlyBinary = !!contentType && (
                    contentType.startsWith('image/') ||
                    contentType.startsWith('video/') ||
                    contentType.startsWith('audio/') ||
                    contentType === 'application/octet-stream' ||
                    contentType === 'application/pdf'
                );
                if (isClearlyBinary) {
                    return event;
                }

                // Handle successful responses
                const body = event.body;

                // If it's already in the expected format, return as is
                if (body && typeof body === 'object' && 'success' in body) {
                    return event.clone({ body });
                }

                // If it's not in our standard format, wrap it
                const wrappedResponse: ApiResponse<any> = {
                    success: true,
                    message: 'Request successful',
                    data: body
                };

                return event.clone({ body: wrappedResponse });
            }
            return event;
        }),
        catchError((error: HttpErrorResponse) => {
            // For binary requests, don't wrap errors; let callers handle them
            if (req.responseType === 'blob' || req.responseType === 'arraybuffer') {
                return throwError(() => error);
            }
            
            let errorMessage = '';
            let errorDetails: any = error.error;

            // Check if the error is already in our API format
            if (error.error && typeof error.error === 'object' && 'success' in error.error) {
                // It's already our API error format
                return throwError(() => error);
            }

            // Check if we received an HTML error page
            const contentType = error.headers?.get('content-type');
            if (contentType?.includes('text/html')) {
                console.error('Received HTML error response:', error.url);
                errorMessage = 'Server returned an error page. Please check the URL and try again.';
                errorDetails = error.error;
            } else {
                // Map HTTP error codes to descriptive messages
                switch (error.status) {
                    case 400:
                        errorMessage = 'Bad Request: The request could not be understood by the server.';
                        // Try to extract validation error details
                        if (error.error && typeof error.error === 'object') {
                            if (error.error.message) {
                                errorMessage = error.error.message;
                            }
                            if (error.error.errors) {
                                errorDetails = error.error.errors;
                            }
                        }
                        break;
                    case 401:
                        errorMessage = 'Unauthorized: Please sign in to continue.';
                        // Don't automatically trigger logout for cart endpoints - they might be failing due to other issues
                        if (typeof window !== 'undefined' && !req.url.includes('/api/cart')) {
                            console.warn('🚫 Received 401 Unauthorized - triggering logout for:', req.url);
                            // You might want to dispatch an auth logout action here
                        } else if (req.url.includes('/api/cart')) {
                            console.warn('🚫 Received 401 for cart endpoint - not triggering logout, might be a temporary issue');
                        }
                        break;
                    case 403:
                        errorMessage = 'Forbidden: You do not have permission to perform this action.';
                        break;
                    case 404:
                        errorMessage = 'Not Found: The requested resource could not be found.';
                        break;
                    case 422:
                        errorMessage = 'Validation Error: The request contains invalid data.';
                        if (error.error && typeof error.error === 'object') {
                            errorDetails = error.error;
                        }
                        break;
                    case 429:
                        errorMessage = 'Too Many Requests: Please try again later.';
                        break;
                    case 500:
                        errorMessage = 'Internal Server Error: Please try again later.';
                        break;
                    case 502:
                        errorMessage = 'Bad Gateway: The server received an invalid response.';
                        break;
                    case 503:
                        errorMessage = 'Service Unavailable: The server is temporarily unavailable.';
                        break;
                    case 0:
                        errorMessage = 'Network Error: Please check your connection and try again.';
                        break;
                    default:
                        errorMessage = error.message || `An error occurred (${error.status}).`;
                }
            }

            // Create a standardized error response
            const errorResponse: ApiResponse<null> = {
                success: false,
                message: errorMessage,
                data: null,
                error: errorDetails,
                status: error.status,
                timestamp: new Date().toISOString()
            };

            return throwError(() => new HttpErrorResponse({
                error: errorResponse,
                status: error.status,
                statusText: error.statusText,
                url: error.url || undefined,
                headers: error.headers
            }));
        })
    );
};