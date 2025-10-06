import { HttpInterceptorFn } from '@angular/common/http';

// Note: "Access-Control-Allow-*" headers are response headers (set by the server),
// not request headers. Setting them here has no effect and may cause issues.
export const corsInterceptor: HttpInterceptorFn = (req, next) => {
    // If this is a FormData upload, DO NOT set Content-Type.
    // The browser must set the correct multipart boundary automatically.
    if (req.body instanceof FormData) {
        const headers = req.headers
            .delete('Content-Type')
            .delete('Accept'); // let browser decide, avoids forcing JSON for binary

        // Optional debug
        if (localStorage.getItem('travner_debug') === 'true') {
            console.log('🧭 Skipping JSON headers for FormData request:', req.url);
        }

        return next(req.clone({ headers }));
    }

    // For non-FormData requests, set sensible defaults without overriding explicit headers.
    const setHeaders: Record<string, string> = {};

    // Only set Content-Type for requests with a JSON-like body (not string/Blob)
    const hasBody = ['POST', 'PUT', 'PATCH'].includes(req.method) && req.body != null;
    const isJsonLikeBody = hasBody &&
        !(typeof req.body === 'string') &&
        !(req.body instanceof Blob);

    if (isJsonLikeBody && !req.headers.has('Content-Type')) {
        setHeaders['Content-Type'] = 'application/json';
    }
    // Avoid forcing JSON for binary downloads (blob/arraybuffer)
    const expectsBinary = req.responseType === 'blob' || req.responseType === 'arraybuffer';
    if (!expectsBinary && !req.headers.has('Accept')) {
        setHeaders['Accept'] = 'application/json';
    }

    if (Object.keys(setHeaders).length > 0) {
        return next(req.clone({ setHeaders }));
    }

    return next(req);
};
