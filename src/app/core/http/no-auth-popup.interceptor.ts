import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

/**
 * No Auth Popup Interceptor
 * Prevents browser's basic auth popup by intercepting 401 responses
 * and removing the WWW-Authenticate header that triggers the popup
 */
export const noAuthPopupInterceptor: HttpInterceptorFn = (req, next) => {
    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            // If it's a 401 error, remove the WWW-Authenticate header to prevent browser popup
            if (error.status === 401) {
                console.log('🚫 Intercepting 401 to prevent browser auth popup for:', req.url);

                // Create a new error response without the WWW-Authenticate header
                const modifiedHeaders = error.headers.delete('WWW-Authenticate');

                const modifiedError = new HttpErrorResponse({
                    error: error.error,
                    status: error.status,
                    statusText: error.statusText,
                    url: error.url || undefined,
                    headers: modifiedHeaders
                });

                return throwError(() => modifiedError);
            }

            // For all other errors, pass through unchanged
            return throwError(() => error);
        })
    );
};