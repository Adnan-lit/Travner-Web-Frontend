import {
  ApplicationConfig,
  ErrorHandler,
  Injector,
  inject,
  provideAppInitializer,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter, withPreloading } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { firstValueFrom } from 'rxjs';

import { routes } from './app.routes';
import { authTokenInterceptor } from './core/http/auth-token.interceptor';
import { apiEnvelopeInterceptor } from './core/http/api-envelope.interceptor';
import { AuthService } from './services/auth.service';
import { SelectivePreloadingStrategy } from './core/routing/selective-preloading.strategy';
import { loadRuntimeConfig } from './config/runtime.config';
import { GlobalErrorHandler } from './core/logging/global-error-handler';

/**
 * Load deployment config first, then restore the session from the HttpOnly
 * refresh cookie. The injector is captured synchronously so AuthService cannot
 * construct before the runtime API prefix is available.
 */
export function initializeApp(): Promise<boolean> {
  const injector = inject(Injector);
  return loadRuntimeConfig().then(() => firstValueFrom(injector.get(AuthService).initializeSession()));
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({
      eventCoalescing: true,
      runCoalescing: true,
    }),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    provideRouter(routes, withPreloading(SelectivePreloadingStrategy)),
    provideAnimationsAsync(),
    provideAppInitializer(initializeApp),
    provideHttpClient(
      withFetch(),
      withInterceptors([
        apiEnvelopeInterceptor, // Normalize API responses/errors
        authTokenInterceptor, // Bearer token + single refresh on 401
      ]),
    ),
  ],
};
