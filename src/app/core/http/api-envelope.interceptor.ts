import { HttpInterceptorFn, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { ApiResponse } from '../../models/api-response.model';

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

            // Check if we received an HTML error page
            const contentType = error.headers?.get('content-type');
            if (contentType?.includes('text/html')) {
                console.error('Received HTML error response:', error.url);
                errorMessage = 'Server returned an error page. Please check the URL and try again.';
            } else {
                // Map HTTP error codes to descriptive messages
                switch (error.status) {
                    case 400:
                        errorMessage = 'Bad Request: The request could not be understood by the server.';
                        break;
                    case 401:
                        errorMessage = 'Unauthorized: Please sign in to continue.';
                        break;
                    case 403:
                        errorMessage = 'Forbidden: You do not have permission to perform this action.';
                        break;
                    case 404:
                        errorMessage = 'Not Found: The requested resource could not be found.';
                        break;
                    case 500:
                        errorMessage = 'Internal Server Error: Please try again later.';
                        break;
                    case 0:
                        errorMessage = 'Network Error: Please check your connection and try again.';
                        break;
                    default:
                        errorMessage = error.message || 'An unknown error occurred.';
                }
            }

            // Create a standardized error response
            const errorResponse: ApiResponse<null> = {
                success: false,
                message: errorMessage,
                data: null,
                error: error.error,
                status: error.status
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