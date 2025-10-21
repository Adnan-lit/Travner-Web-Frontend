import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ErrorInfo {
  id: string;
  message: string;
  type: 'error' | 'warning' | 'info';
  timestamp: Date;
  source: string;
  details?: any;
  resolved: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  private errorsSubject = new BehaviorSubject<ErrorInfo[]>([]);
  public errors$ = this.errorsSubject.asObservable();

  private errorCount = 0;

  constructor() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.handleError('Global Error', event.error || event.message, 'error');
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.handleError('Unhandled Promise Rejection', event.reason, 'error');
    });
  }

  /**
   * Handle HTTP errors
   */
  handleHttpError(error: HttpErrorResponse, source: string = 'HTTP'): void {
    let message = 'An unexpected error occurred';
    let type: 'error' | 'warning' | 'info' = 'error';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      message = error.error.message;
    } else {
      // Server-side error
      switch (error.status) {
        case 400:
          message = error.error?.message || 'Bad Request';
          type = 'warning';
          break;
        case 401:
          message = 'Authentication required';
          type = 'warning';
          break;
        case 403:
          message = 'Access denied';
          type = 'warning';
          break;
        case 404:
          message = 'Resource not found';
          type = 'info';
          break;
        case 422:
          message = error.error?.message || 'Validation error';
          type = 'warning';
          break;
        case 429:
          message = 'Too many requests. Please try again later.';
          type = 'warning';
          break;
        case 500:
          message = 'Internal server error';
          type = 'error';
          break;
        case 503:
          message = 'Service temporarily unavailable';
          type = 'error';
          break;
        default:
          message = error.error?.message || `HTTP ${error.status} Error`;
      }
    }

    this.handleError(source, message, type, error);
  }

  /**
   * Handle general errors
   */
  handleError(source: string, message: string, type: 'error' | 'warning' | 'info' = 'error', details?: any): void {
    const errorInfo: ErrorInfo = {
      id: this.generateErrorId(),
      message,
      type,
      timestamp: new Date(),
      source,
      details,
      resolved: false
    };

    const currentErrors = this.errorsSubject.value;
    this.errorsSubject.next([errorInfo, ...currentErrors.slice(0, 49)]); // Keep last 50 errors

    this.errorCount++;

    // Log to console in development
    if (type === 'error') {
      console.error(`[${source}] ${message}`, details);
    } else if (type === 'warning') {
      console.warn(`[${source}] ${message}`, details);
    } else {
      console.info(`[${source}] ${message}`, details);
    }

    // Auto-resolve info messages after 5 seconds
    if (type === 'info') {
      setTimeout(() => {
        this.resolveError(errorInfo.id);
      }, 5000);
    }
  }

  /**
   * Handle API errors with retry logic
   */
  handleApiError(error: any, operation: string, retryCallback?: () => void): void {
    this.handleError('API', `${operation} failed: ${error.message || error}`, 'error', error);

    if (retryCallback && this.shouldRetry(error)) {
      setTimeout(() => {
        console.log(`Retrying ${operation}...`);
        retryCallback();
      }, this.getRetryDelay());
    }
  }

  /**
   * Handle validation errors
   */
  handleValidationError(errors: any, source: string = 'Validation'): void {
    const errorMessages = this.extractValidationMessages(errors);
    errorMessages.forEach(message => {
      this.handleError(source, message, 'warning');
    });
  }

  /**
   * Handle network errors
   */
  handleNetworkError(error: any, source: string = 'Network'): void {
    let message = 'Network error occurred';
    
    if (error.name === 'TimeoutError') {
      message = 'Request timed out. Please check your connection.';
    } else if (error.name === 'NetworkError') {
      message = 'Network connection failed. Please check your internet connection.';
    } else if (error.status === 0) {
      message = 'Unable to connect to server. Please try again later.';
    }

    this.handleError(source, message, 'error', error);
  }

  /**
   * Get all errors
   */
  getErrors(): ErrorInfo[] {
    return this.errorsSubject.value;
  }

  /**
   * Get unresolved errors
   */
  getUnresolvedErrors(): ErrorInfo[] {
    return this.errorsSubject.value.filter(error => !error.resolved);
  }

  /**
   * Get error count
   */
  getErrorCount(): number {
    return this.errorCount;
  }

  /**
   * Resolve an error
   */
  resolveError(errorId: string): void {
    const errors = this.errorsSubject.value;
    const updatedErrors = errors.map(error => 
      error.id === errorId ? { ...error, resolved: true } : error
    );
    this.errorsSubject.next(updatedErrors);
  }

  /**
   * Clear all errors
   */
  clearAllErrors(): void {
    this.errorsSubject.next([]);
  }

  /**
   * Clear resolved errors
   */
  clearResolvedErrors(): void {
    const unresolvedErrors = this.getUnresolvedErrors();
    this.errorsSubject.next(unresolvedErrors);
  }

  /**
   * Get error statistics
   */
  getErrorStats(): { total: number; errors: number; warnings: number; info: number; unresolved: number } {
    const errors = this.errorsSubject.value;
    return {
      total: errors.length,
      errors: errors.filter(e => e.type === 'error').length,
      warnings: errors.filter(e => e.type === 'warning').length,
      info: errors.filter(e => e.type === 'info').length,
      unresolved: errors.filter(e => !e.resolved).length
    };
  }

  /**
   * Export errors for debugging
   */
  exportErrors(): string {
    const errors = this.errorsSubject.value;
    return JSON.stringify(errors, null, 2);
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private shouldRetry(error: any): boolean {
    // Retry on network errors, timeouts, and 5xx server errors
    if (error.status === 0 || error.status >= 500) {
      return true;
    }
    
    // Don't retry on client errors (4xx)
    if (error.status >= 400 && error.status < 500) {
      return false;
    }

    return false;
  }

  private getRetryDelay(): number {
    // Exponential backoff: 1s, 2s, 4s, 8s
    return Math.min(1000 * Math.pow(2, this.errorCount), 8000);
  }

  private extractValidationMessages(errors: any): string[] {
    const messages: string[] = [];

    if (typeof errors === 'string') {
      messages.push(errors);
    } else if (Array.isArray(errors)) {
      errors.forEach(error => {
        if (typeof error === 'string') {
          messages.push(error);
        } else if (error.message) {
          messages.push(error.message);
        }
      });
    } else if (errors && typeof errors === 'object') {
      Object.keys(errors).forEach(key => {
        const value = errors[key];
        if (Array.isArray(value)) {
          value.forEach(msg => messages.push(`${key}: ${msg}`));
        } else if (typeof value === 'string') {
          messages.push(`${key}: ${value}`);
        }
      });
    }

    return messages;
  }
}
