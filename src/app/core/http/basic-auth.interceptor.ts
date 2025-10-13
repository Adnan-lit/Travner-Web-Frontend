import { HttpInterceptorFn, HttpHandlerFn, HttpRequest, HttpEvent } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

/**
 * Basic Authentication Interceptor
 * Automatically adds Basic Auth headers for protected routes
 * Enhanced with rate limiting and improved error handling
 */
export const basicAuthInterceptor: HttpInterceptorFn =
    (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
        // Skip authentication for public endpoints
        const url = req.url;
        const method = (req.method || 'GET').toUpperCase();

        // Always-public endpoints
        const publicEndpoints = [
            '/public/',
            '/api/public/',
            '/signin',
            '/signup',
            '/auth/',
            '/health',
            '/status'
        ];

        const isAlwaysPublic = publicEndpoints.some(endpoint => url.includes(endpoint));

        // Public GETs for community browsing (no auth header)
        const isPublicPostsGet = method === 'GET' && (
            url.endsWith('/posts') ||
            url.includes('/posts?') ||
            url.includes('/posts/search') ||
            url.includes('/posts/user/') ||
            url.includes('/posts/location')
        );

        // Protected GET exception under /posts (e.g., comments)
        const isProtectedPostsSubresource = method === 'GET' && url.includes('/posts/') && url.includes('/comments');

        // In development mode with empty API_BASE_URL, all requests go through proxy
        // Only skip auth for explicitly public endpoints
        if (isAlwaysPublic || (isPublicPostsGet && !isProtectedPostsSubresource)) {
            return next(req);
        }

        // Get stored authentication data
        const authData = getStoredAuthData();

        // If no auth data, proceed without auth headers but log the attempt
        if (!authData) {
            console.warn(`⚠️ No auth data found for protected endpoint: ${req.url}`);
            console.log(`🔧 Debug - Current localStorage keys:`, Object.keys(localStorage));
            return next(req);
        }

        // In development mode, check if this is a proxied request
        // If the URL starts with the current origin and doesn't include a full backend URL,
        // it's a proxied request that needs auth headers
        const isProxiedRequest = url.startsWith(window.location.origin) &&
            !url.includes('http://localhost:8080') &&
            !url.includes('https://travner-web-backend-production.up.railway.app');

        if (isProxiedRequest) {
            // This is a proxied request in development mode, add auth headers
            try {
                const credentials = btoa(`${authData.username}:${authData.password}`);
                const authReq = req.clone({
                    headers: req.headers.set('Authorization', `Basic ${credentials}`)
                });

                console.log(`🔐 Adding auth header for proxied request: ${req.url}`);

                return next(authReq).pipe(
                    tap({
                        next: (event) => {
                            // Successful request
                            if (event.type === 4) { // HttpResponse type
                                console.log(`✅ Successful request: ${req.url}`);
                            }
                        },
                        error: (error) => {
                            // Failed request
                            if (error.status === 401) {
                                console.warn(`❌ Failed request (401): ${req.url}`);
                            }
                        }
                    }),
                    catchError(error => {
                        // Enhanced error handling for authentication issues
                        if (error.status === 401) {
                            const authError = new Error('Authentication failed. Please check your credentials.');
                            (authError as any).originalError = error;
                            (authError as any).status = 401;
                            return throwError(() => authError);
                        }

                        // Handle rate limiting errors
                        if (error.status === 429) {
                            const rateLimitError = new Error('Too many requests. Please try again later.');
                            (rateLimitError as any).originalError = error;
                            (rateLimitError as any).status = 429;
                            return throwError(() => rateLimitError);
                        }

                        return throwError(() => error);
                    })
                );
            } catch (error) {
                console.error(`❌ Failed to create auth header for ${req.url}:`, error);
                return next(req);
            }
        }

        // Create Basic Auth header
        try {
            const credentials = btoa(`${authData.username}:${authData.password}`);
            const authReq = req.clone({
                headers: req.headers.set('Authorization', `Basic ${credentials}`)
            });

            console.log(`🔐 Adding auth header for: ${req.url}`);

            return next(authReq).pipe(
                tap({
                    next: (event) => {
                        // Successful request
                        if (event.type === 4) { // HttpResponse type
                            console.log(`✅ Successful request: ${req.url}`);
                        }
                    },
                    error: (error) => {
                        // Failed request
                        if (error.status === 401) {
                            console.warn(`❌ Failed request (401): ${req.url}`);
                        }
                    }
                }),
                catchError(error => {
                    // Enhanced error handling for authentication issues
                    if (error.status === 401) {
                        const authError = new Error('Authentication failed. Please check your credentials.');
                        (authError as any).originalError = error;
                        (authError as any).status = 401;
                        return throwError(() => authError);
                    }

                    // Handle rate limiting errors
                    if (error.status === 429) {
                        const rateLimitError = new Error('Too many requests. Please try again later.');
                        (rateLimitError as any).originalError = error;
                        (rateLimitError as any).status = 429;
                        return throwError(() => rateLimitError);
                    }

                    return throwError(() => error);
                })
            );
        } catch (error) {
            console.error(`❌ Failed to create auth header for ${req.url}:`, error);
            return next(req);
        }
    };

/**
 * Get stored authentication data from localStorage
 */
interface AuthData {
    username: string;
    password: string;
}

function getStoredAuthData(): AuthData | null {
    try {
        const authJson = localStorage.getItem('travner_auth');
        console.log('🔐 Checking for stored auth data:', {
            hasAuthJson: !!authJson,
            localStorageKeys: Object.keys(localStorage),
            authJson: authJson
        });

        if (authJson) {
            const authData = JSON.parse(authJson);

            if (authData.username && authData.password) {
                console.log('✅ Found valid auth data for user:', authData.username);
                return authData;
            } else {
                console.warn('⚠️ Auth data missing username or password:', authData);
            }
        } else {
            console.warn('⚠️ No auth data found in localStorage');
        }
    } catch (e) {
        console.warn('⚠️ Error parsing auth data:', e);
    }

    return null;
}

