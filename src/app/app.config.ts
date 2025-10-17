import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';
import { basicAuthInterceptor } from './core/http/basic-auth.interceptor';
import { apiEnvelopeInterceptor } from './core/http/api-envelope.interceptor';
import { noAuthPopupInterceptor } from './core/http/no-auth-popup.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ 
      eventCoalescing: true,
      runCoalescing: true
    }),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(
      withFetch(),
      withInterceptors([
        apiEnvelopeInterceptor,   // Handle API response format
        noAuthPopupInterceptor,   // Prevent browser auth popup on 401s
        basicAuthInterceptor     // Then authentication interceptor
      ])
    )
  ]
};