import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { basicAuthInterceptor } from './core/http/basic-auth.interceptor';
import { apiEnvelopeInterceptor } from './core/http/api-envelope.interceptor';
import { noAuthPopupInterceptor } from './core/http/no-auth-popup.interceptor';
import { corsInterceptor } from './interceptors/cors.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withFetch(),
      withInterceptors([
        corsInterceptor,          // Add CORS interceptor first
        noAuthPopupInterceptor,   // Prevent browser auth popup on 401s
        basicAuthInterceptor,     // Then authentication interceptor
        apiEnvelopeInterceptor    // Finally API envelope interceptor
      ])
    )
  ]
};