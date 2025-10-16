import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

/**
 * No Auth Popup Interceptor
 * Prevents browser's basic auth popup by intercepting 401 responses
 * and removing the WWW-Authenticate header that triggers the popup
 * Also handles authentication errors more gracefully
 */
export const noAuthPopupInterceptor: HttpInterceptorFn = (req, next) => {
    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            // If it's a 401 error, remove the WWW-Authenticate header to prevent browser popup
            if (error.status === 401) {
                console.log('🚫 Intercepting 401 to prevent browser auth popup for:', req.url);

                // Create a new error response without the WWW-Authenticate header
                const modifiedHeaders = error.headers ? error.headers.delete('WWW-Authenticate') : error.headers;

                const modifiedError = new HttpErrorResponse({
                    error: error.error,
                    status: error.status,
                    statusText: error.statusText,
                    url: error.url || undefined,
                    headers: modifiedHeaders
                });

                // Add additional context to help with error handling
                (modifiedError as any).isAuthError = true;
                (modifiedError as any).shouldRedirectToLogin = true;

                return throwError(() => modifiedError);
            }

            // Handle 403 Forbidden errors
            if (error.status === 403) {
                console.warn('🚫 Access forbidden for:', req.url);
                
                const modifiedError = new HttpErrorResponse({
                    error: error.error,
                    status: error.status,
                    statusText: error.statusText,
                    url: error.url || undefined,
                    headers: error.headers
                });

                // Add additional context to help with error handling
                (modifiedError as any).isForbiddenError = true;
                (modifiedError as any).message = error.message || 'Access denied. You do not have permission to access this resource.';

                return throwError(() => modifiedError);
            }

            // Handle 429 Too Many Requests errors
            if (error.status === 429) {
                console.warn('⚠️ Rate limited for:', req.url);
                
                const modifiedError = new HttpErrorResponse({
                    error: error.error,
                    status: error.status,
                    statusText: error.statusText,
                    url: error.url || undefined,
                    headers: error.headers
                });

                // Add additional context to help with error handling
                (modifiedError as any).isRateLimitError = true;
                (modifiedError as any).message = error.message || 'Too many requests. Please try again later.';

                return throwError(() => modifiedError);
            }

            // For all other errors, pass through unchanged
            return throwError(() => error);
        })
    );
};