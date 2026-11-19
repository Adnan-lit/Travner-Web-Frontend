import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { EnvironmentConfig } from '../../config/environment.config';

const PUBLIC_ENDPOINT_FRAGMENTS = [
    '/public/',
    '/api/public/',
    '/signin',
    '/signup',
    '/auth/',
    '/health',
    '/status',
    '/actuator/health'
];

/**
 * Adds Basic Auth credentials to requests that target the configured API only.
 * Never logs headers or credential values, and never fabricates responses.
 */
export const basicAuthInterceptor: HttpInterceptorFn = (
    req: HttpRequest<unknown>,
    next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
    if (req.headers.has('Authorization') || isPublicRequest(req)) {
        return next(req);
    }

    const authData = inject(AuthService).getStoredAuthData();
    if (!authData || !authData.username || !authData.password || !isAllowedOrigin(req.url)) {
        return next(req);
    }

    return addAuthHeader(req, next, authData.username, authData.password);
};

function isPublicRequest(req: HttpRequest<unknown>): boolean {
    const url = req.url;
    const method = (req.method || 'GET').toUpperCase();

    if (PUBLIC_ENDPOINT_FRAGMENTS.some(endpoint => url.includes(endpoint))) {
        return true;
    }

    const isPublicPostsGet = method === 'GET' && (
        url.endsWith('/posts') ||
        url.includes('/posts?') ||
        url.includes('/posts/search') ||
        url.includes('/posts/user/') ||
        url.includes('/posts/location') ||
        url.includes('/posts/tags')
    );
    const isProtectedPostsSubresource = method === 'GET' &&
        url.includes('/posts/') && url.includes('/comments');

    const isPublicMarketGet = method === 'GET' &&
        url.includes('/api/market/products') &&
        !url.includes('/cart') && !url.includes('/orders');

    return (isPublicPostsGet && !isProtectedPostsSubresource) || isPublicMarketGet;
}

/** Relative URLs use the dev proxy or same-origin rewrite and are always safe. */
function isAllowedOrigin(url: string): boolean {
    if (!/^https?:\/\//i.test(url)) {
        return true;
    }

    try {
        const targetOrigin = new URL(url, window.location.href).origin;
        const allowedOrigins = [window.location.origin];
        const apiBaseUrl = EnvironmentConfig.getApiBaseUrl();
        if (/^https?:\/\//i.test(apiBaseUrl)) {
            allowedOrigins.push(new URL(apiBaseUrl).origin);
        }
        return allowedOrigins.includes(targetOrigin);
    } catch {
        return false;
    }
}

function addAuthHeader(
    req: HttpRequest<unknown>,
    next: HttpHandlerFn,
    username: string,
    password: string
): Observable<HttpEvent<unknown>> {
    try {
        const authReq = req.clone({
            headers: req.headers.set(
                'Authorization',
                `Basic ${btoa(`${username}:${password}`)}`
            )
        });
        return next(authReq);
    } catch {
        // If encoding fails, send the request unauthenticated and let the
        // server respond with 401 rather than leaking anything to the console.
        return next(req);
    }
}
