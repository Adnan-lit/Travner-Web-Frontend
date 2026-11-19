import { ApplicationConfig, inject, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';
import { authTokenInterceptor } from './core/http/auth-token.interceptor';
import { apiEnvelopeInterceptor } from './core/http/api-envelope.interceptor';
import { AuthService } from './services/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({
      eventCoalescing: true,
      runCoalescing: true
    }),
    provideRouter(routes),
    provideAnimationsAsync(),
    // Restore the session from the HttpOnly refresh cookie before first render.
    provideAppInitializer(() => inject(AuthService).initializeSession()),
    provideHttpClient(
      withFetch(),
      withInterceptors([
        apiEnvelopeInterceptor,   // Normalize API responses/errors
        authTokenInterceptor      // Bearer token + single refresh on 401
      ])
    )
  ]
};
