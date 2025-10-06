import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Basic Authentication Interceptor
 * Automatically adds Basic Auth headers for protected routes
 */
export const basicAuthInterceptor: HttpInterceptorFn = (req, next) => {
    // Skip authentication for public endpoints
    const url = req.url;
    const method = (req.method || 'GET').toUpperCase();

    // Always-public endpoints
    const publicEndpoints = [
        '/public/',
        '/api/public/',
        '/signin',
        '/signup',
        '/auth/'
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

    if (isAlwaysPublic || (isPublicPostsGet && !isProtectedPostsSubresource)) {
        return next(req);
    }

    // Get stored authentication data
    const authData = getStoredAuthData();

    // If no auth data, proceed without auth headers
    if (!authData) {
        console.warn(`⚠️ No auth data found for protected endpoint: ${req.url}`);
        return next(req);
    }

    // Create Basic Auth header
    try {
        const credentials = btoa(`${authData.username}:${authData.password}`);
        const authReq = req.clone({
            headers: req.headers.set('Authorization', `Basic ${credentials}`)
        });

        console.log(`🔐 Adding auth header for: ${req.url}`);
        return next(authReq);
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
        if (authJson) {
            const authData = JSON.parse(authJson);

            if (authData.username && authData.password) {
                return authData;
            }
        }
    } catch (e) {
        console.warn('⚠️ Error parsing auth data:', e);
    }

    return null;
}