import { HttpInterceptorFn, HttpHandlerFn, HttpRequest, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable, throwError, from, of } from 'rxjs';
import { catchError, tap, switchMap } from 'rxjs/operators';
import { inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';

/**
 * Basic Authentication Interceptor
 * Automatically adds Basic Auth headers for protected routes
 * Enhanced with rate limiting and improved error handling
 */
export const basicAuthInterceptor: HttpInterceptorFn =
    (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
        // If request already has Authorization header, skip interceptor
        if (req.headers.has('Authorization')) {
            console.log(`🔐 Request already has Authorization header, skipping interceptor: ${req.url}`);
            return next(req);
        }

        // Skip authentication for public endpoints
        const url = req.url;
        const method = (req.method || 'GET').toUpperCase();

        // Always-public endpoints according to API documentation
        const publicEndpoints = [
            '/public/',
            '/api/public/',
            '/signin',
            '/signup',
            '/auth/',
            '/health',
            '/status',
            '/actuator/health'
        ];

        const isAlwaysPublic = publicEndpoints.some(endpoint => url.includes(endpoint));

        // Public GETs for community browsing (no auth header)
        // According to API documentation, these endpoints are public:
        // - GET /api/posts (with pagination params)
        // - GET /api/posts/search?query=...
        // - GET /api/posts/user/{username}
        // - GET /api/posts/location/{location}
        // - GET /api/posts/tags?tags=...
        const isPublicPostsGet = method === 'GET' && (
            url.endsWith('/posts') ||
            url.includes('/posts?') ||
            url.includes('/posts/search') ||
            url.includes('/posts/user/') ||
            url.includes('/posts/location') ||
            url.includes('/posts/tags')
        );

        // Protected GET exception under /posts (e.g., comments)
        const isProtectedPostsSubresource = method === 'GET' && url.includes('/posts/') && url.includes('/comments');

        // Public GETs for marketplace browsing (no auth header)
        // According to API documentation, these endpoints are public:
        // - GET /api/market/products (with pagination params)
        // - GET /api/market/products/search?query=...
        // - GET /api/market/products/category/{category}
        // - GET /api/market/products/location/{location}
        // - GET /api/market/products/tags?tags=...
        const isPublicMarketGet = method === 'GET' && (
            url.includes('/api/market/products') && !url.includes('/cart') && !url.includes('/orders')
        );

        // In development mode with empty API_BASE_URL, all requests go through proxy
        // Only skip auth for explicitly public endpoints
        if (isAlwaysPublic || (isPublicPostsGet && !isProtectedPostsSubresource) || isPublicMarketGet) {
            return next(req);
        }

        // Get stored authentication data using AuthService
        const authService = inject(AuthService);
        return from(getStoredAuthDataAsync(authService)).pipe(
            switchMap(authData => {
                // If no auth data, proceed without auth headers but log the attempt
                if (!authData) {
                    console.warn(`⚠️ No auth data found for protected endpoint: ${req.url}`);
                    console.log(`🔧 Debug - Current localStorage keys:`, Object.keys(localStorage));
                    // For cart endpoints, return a mock response to prevent Basic Auth popup
                    if (req.url.includes('/api/cart')) {
                        console.log('🛒 Preventing Basic Auth popup for cart endpoint without credentials');
                        return of(new HttpResponse({
                            status: 200,
                            body: { success: true, data: { count: 0, items: [] } }
                        }));
                    }
                    return next(req);
                }

                // In development mode, check if this is a proxied request
                // If the URL starts with the current origin and doesn't include a full backend URL,
                // it's a proxied request that needs auth headers
                const isProxiedRequest = url.startsWith(window.location.origin) &&
                    !url.includes('http://localhost:8080') &&
                    !url.includes('https://travner-web-backend-production.up.railway.app');

                console.log(`🔍 Request analysis:`, {
                    url: url,
                    origin: window.location.origin,
                    isProxiedRequest: isProxiedRequest,
                    includesBackendUrl: url.includes('http://localhost:8080'),
                    includesProductionUrl: url.includes('https://travner-web-backend-production.up.railway.app')
                });

                if (isProxiedRequest) {
                    // This is a proxied request in development mode, add auth headers
                    console.log('🔄 Processing as proxied request');
                    return addAuthHeader(req, next, authData, true);
                }

                // Create Basic Auth header
                console.log('🔄 Processing as direct request');
                return addAuthHeader(req, next, authData, false);
            }),
            catchError(error => {
                console.error('❌ Auth interceptor error:', error);
                return throwError(() => error);
            })
        );
    };

/**
 * Add authentication header to request
 */
function addAuthHeader(
    req: HttpRequest<unknown>,
    next: HttpHandlerFn,
    authData: { username: string; password: string },
    isProxied: boolean
): Observable<HttpEvent<unknown>> {
    try {
        const credentials = btoa(`${authData.username}:${authData.password}`);
        const authReq = req.clone({
            headers: req.headers.set('Authorization', `Basic ${credentials}`)
        });

        const requestType = isProxied ? 'proxied' : 'direct';
        console.log(`🔐 Adding auth header for ${requestType} request: ${req.url}`);
        console.log(`🔐 Auth header details:`, {
            username: authData.username,
            hasPassword: !!authData.password,
            headerValue: `Basic ${credentials}`,
            url: req.url,
            method: req.method
        });

        return next(authReq).pipe(
            tap({
                next: (event) => {
                    // Successful request
                    if (event.type === 4) { // HttpResponse type
                        // Only log successful requests for non-public endpoints to avoid noise
                        if (!req.url.includes('/public/')) {
                            console.log(`✅ Successful request: ${req.url}`);
                        }
                    }
                },
                error: (error) => {
                    // Failed request
                    if (error.status === 401) {
                        console.warn(`❌ Failed request (401): ${req.url}`);
                        // You might want to trigger a logout or refresh token here
                    } else if (error.status === 429) {
                        console.warn(`⚠️ Rate limited (429): ${req.url}`);
                    }
                }
            }),
            catchError(error => {
                // Enhanced error handling for authentication issues
                if (error.status === 401) {
                    const authError = new Error('Authentication failed. Please sign in again.');
                    (authError as any).originalError = error;
                    (authError as any).status = 401;
                    (authError as any).shouldLogout = true;
                    return throwError(() => authError);
                }

                // Handle rate limiting errors
                if (error.status === 429) {
                    const rateLimitError = new Error('Too many requests. Please try again later.');
                    (rateLimitError as any).originalError = error;
                    (rateLimitError as any).status = 429;
                    return throwError(() => rateLimitError);
                }

                // Handle network errors
                if (error.status === 0) {
                    const networkError = new Error('Network error. Please check your connection.');
                    (networkError as any).originalError = error;
                    (networkError as any).status = 0;
                    return throwError(() => networkError);
                }

                return throwError(() => error);
            })
        );
    } catch (error) {
        console.error(`❌ Failed to create auth header for ${req.url}:`, error);
        // If we can't create the auth header, proceed without it
        return next(req);
    }
}

/**
 * Get stored authentication data from localStorage asynchronously
 */
async function getStoredAuthDataAsync(authService: AuthService): Promise<{ username: string; password: string } | null> {
    try {
        // Try multiple possible keys for backward compatibility
        const possibleKeys = [
            'authCredentials',           // Current key from AuthService
            'travner_credentials',       // Old key from localStorage
            'travner_auth',             // Another possible old key
            'currentUser'               // User data key
        ];

        let credentials: string | null = null;
        let usedKey: string | null = null;

        for (const key of possibleKeys) {
            const value = localStorage.getItem(key);
            if (value) {
                credentials = value;
                usedKey = key;
                break;
            }
        }
        
        if (!credentials) {
            console.warn('⚠️ No auth credentials found in localStorage');
            console.log('🔧 Available localStorage keys:', Object.keys(localStorage));
            // Try to get credentials from AuthService directly
            try {
                const authData = authService.getStoredAuthData();
                if (authData && authData.username && authData.password) {
                    console.log('✅ Found auth data via AuthService');
                    return { username: authData.username, password: authData.password };
                }
            } catch (error) {
                console.warn('⚠️ Error getting auth data from AuthService:', error);
            }
            return null;
        }

        console.log(`✅ Found auth credentials using key: ${usedKey}`);
        console.log(`🔧 Raw credentials length: ${credentials.length}`);

        // Decode base64 credentials
        const decodedCredentials = atob(credentials);
        console.log(`🔧 Decoded credentials: ${decodedCredentials.substring(0, 10)}...`);
        const [username, password] = decodedCredentials.split(':');

        if (username && password) {
            console.log('✅ Found valid auth credentials for user:', username);
            console.log(`🔧 Password length: ${password.length}`);
            return { username, password };
        } else {
            console.warn('⚠️ Auth credentials missing username or password');
            console.warn(`🔧 Username: ${username}, Password: ${password ? 'present' : 'missing'}`);
            return null;
        }
    } catch (e) {
        console.warn('⚠️ Error parsing auth credentials:', e);
        return null;
    }
}