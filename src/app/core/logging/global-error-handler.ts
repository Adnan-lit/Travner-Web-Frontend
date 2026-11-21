import { ErrorHandler, Injectable, Injector, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService } from '../../services/toast.service';
import { logger } from './logger';

const TOASTED = Symbol('travner.toasted');

/** Prevent the same failure from producing more than one user-visible toast. */
export function markToasted(error: unknown): void {
  if (error && typeof error === 'object') {
    (error as Record<symbol, unknown>)[TOASTED] = true;
  }
}

export function isToasted(error: unknown): boolean {
  return !!error && typeof error === 'object' && (error as Record<symbol, unknown>)[TOASTED] === true;
}

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly injector = inject(Injector);

  handleError(error: unknown): void {
    // Only stable metadata reaches the console; never the raw error, URL or body.
    const status = error instanceof HttpErrorResponse ? error.status : undefined;
    const body = error instanceof HttpErrorResponse ? error.error : undefined;
    const code = body && typeof body === 'object' && typeof body.code === 'string' ? body.code : undefined;
    const traceId = body && typeof body === 'object' && typeof body.traceId === 'string' ? body.traceId : undefined;
    logger.error('global.unhandled', { status, code, traceId });

    if (isToasted(error)) {
      return;
    }
    markToasted(error);

    // Resolve ToastService lazily so bootstrap-time failures do not need a
    // fully constructed component tree.
    queueMicrotask(() => {
      try {
        this.injector.get(ToastService).showGlobalError();
      } catch {
        // Toast UI is not available yet; the sanitized log above is sufficient.
      }
    });
  }
}
