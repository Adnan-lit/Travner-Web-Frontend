import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { EnvironmentConfig } from '../../config/environment.config';

const AUTH_ENDPOINTS = [
    '/api/auth/login',
    '/api/auth/refresh',
    '/api/auth/logout'
];

const PUBLIC_GET_FRAGMENTS = [
    '/api/public/',
    '/actuator/health',
    '/api/posts',
    '/api/comments/posts/',
    '/api/itineraries',
    '/api/travel-buddies',
    '/api/local-guides',
    '/api/market/products',
    '/api/media/files/',
    '/api/media/posts/',
    '/api/media/entity/'
];

/**
 * Replaces Basic auth: attaches the in-memory access token to API calls,
 * performs at most one refresh on 401, and never reads/writes credentials in
 * browser storage or logs headers.
 */
export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const apiBaseUrl = EnvironmentConfig.getApiBaseUrl();

    if (!isApiRequest(req, apiBaseUrl) || isAuthEndpoint(req) || isPublicGet(req)) {
        return next(req);
    }

    const token = authService.getAccessToken();
    const authenticatedRequest = token ? withBearer(req, token) : req;

    return next(authenticatedRequest).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status !== 401) {
                return throwError(() => error);
            }

            // One refresh + one retry only; auth endpoints and failed refreshes
            // go straight to logout to avoid loops.
            return authService.refresh().pipe(
                switchMap(() => {
                    const freshToken = authService.getAccessToken();
                    return next(freshToken ? withBearer(authenticatedRequest, freshToken) : authenticatedRequest);
                }),
                catchError(() => {
                    authService.logout();
                    return throwError(() => error);
                })
            );
        })
    );
};

function isApiRequest(req: HttpRequest<unknown>, apiBaseUrl: string): boolean {
    if (apiBaseUrl && req.url.startsWith(apiBaseUrl)) {
        return true;
    }
    return /(^|\/)(api|actuator)(\/|$)/.test(req.url);
}

function isAuthEndpoint(req: HttpRequest<unknown>): boolean {
    return AUTH_ENDPOINTS.some(endpoint => req.url.includes(endpoint));
}

function isPublicGet(req: HttpRequest<unknown>): boolean {
    if (req.method !== 'GET') {
        return false;
    }
    const path = req.url.split('?')[0];
    return PUBLIC_GET_FRAGMENTS.some(fragment => path.includes(fragment));
}

function withBearer(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
    return req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
    });
}
