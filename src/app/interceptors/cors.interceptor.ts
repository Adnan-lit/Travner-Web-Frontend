import { HttpInterceptorFn, HttpRequest } from '@angular/common/http';

export const corsInterceptor: HttpInterceptorFn = (req, next) => {
    // Add CORS headers for all requests to the Railway backend
    if (req.url.includes('travner-web-backend-production.up.railway.app')) {
        const corsReq = req.clone({
            setHeaders: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept'
            }
        });

        console.log('🔄 CORS interceptor applied to Railway backend:', req.url);
        return next(corsReq);
    }

    // Add CORS headers for requests to localhost:8080 (development)
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

        console.log('🔄 CORS interceptor applied to localhost:', req.url);
        return next(corsReq);
    }

    // For all other requests, add basic CORS headers
    const corsReq = req.clone({
        setHeaders: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    });

    return next(corsReq);
};
