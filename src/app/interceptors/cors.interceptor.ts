import { HttpInterceptorFn, HttpRequest } from '@angular/common/http';

export const corsInterceptor: HttpInterceptorFn = (req, next) => {
    // Add CORS headers for requests to localhost:8080
    if (req.url.includes('localhost:8080')) {
        const corsReq = req.clone({
            setHeaders: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept'
            }
        });

        console.log('🔄 CORS interceptor applied to:', req.url);
        return next(corsReq);
    }

    return next(req);
};
