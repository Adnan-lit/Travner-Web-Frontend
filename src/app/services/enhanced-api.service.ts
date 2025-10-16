import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timer, of } from 'rxjs';
import { retry, retryWhen, delay, take, concatMap, catchError, tap, map } from 'rxjs/operators';
import { EnvironmentConfig } from '../config/environment.config';
import { ApiResponse } from '../models/api-response.model';

/**
 * Enhanced API Service with advanced error handling, retry logic, and performance optimizations
 */
@Injectable({
  providedIn: 'root'
})
export class EnhancedApiService {
  private readonly API_BASE_URL = EnvironmentConfig.getApiBaseUrl();
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly RETRY_DELAY = 1000; // 1 second

  // Request cache for deduplication
  private requestCache = new Map<string, Observable<any>>();

  constructor(private http: HttpClient) {}

  /**
   * Enhanced GET request with retry logic and caching
   */
  get<T>(endpoint: string, options?: {
    params?: any;
    cache?: boolean;
    retry?: boolean;
    timeout?: number;
  }): Observable<ApiResponse<T>> {
    const url = `${this.API_BASE_URL}${endpoint}`;
    const cacheKey = this.generateCacheKey('GET', url, options?.params);

    // Check cache first
    if (options?.cache && this.requestCache.has(cacheKey)) {
      return this.requestCache.get(cacheKey)!;
    }

    const request$ = this.http.get<ApiResponse<T>>(url, {
      params: options?.params
    }).pipe(
      // Retry logic
      options?.retry !== false ? this.retryStrategy() : tap() as any,
      
      // Error handling
      catchError(this.handleError),
      
      // Cache successful responses
      tap((response: any) => {
        if (options?.cache && response.success) {
          this.requestCache.set(cacheKey, of(response));
          // Clear cache after 5 minutes
          timer(300000).subscribe(() => this.requestCache.delete(cacheKey));
        }
      })
    );

    // Store in cache if caching is enabled
    if (options?.cache) {
      this.requestCache.set(cacheKey, request$);
    }

    return request$;
  }

  /**
   * Enhanced POST request with retry logic
   */
  post<T>(endpoint: string, data: any, options?: {
    retry?: boolean;
    timeout?: number;
  }): Observable<ApiResponse<T>> {
    const url = `${this.API_BASE_URL}${endpoint}`;
    
    return this.http.post<ApiResponse<T>>(url, data).pipe(
      options?.retry !== false ? this.retryStrategy() : tap() as any,
      catchError(this.handleError)
    );
  }

  /**
   * Enhanced PUT request with retry logic
   */
  put<T>(endpoint: string, data: any, options?: {
    retry?: boolean;
    timeout?: number;
  }): Observable<ApiResponse<T>> {
    const url = `${this.API_BASE_URL}${endpoint}`;
    
    return this.http.put<ApiResponse<T>>(url, data).pipe(
      options?.retry !== false ? this.retryStrategy() : tap() as any,
      catchError(this.handleError)
    );
  }

  /**
   * Enhanced DELETE request with retry logic
   */
  delete<T>(endpoint: string, options?: {
    retry?: boolean;
    timeout?: number;
  }): Observable<ApiResponse<T>> {
    const url = `${this.API_BASE_URL}${endpoint}`;
    
    return this.http.delete<ApiResponse<T>>(url).pipe(
      options?.retry !== false ? this.retryStrategy() : tap() as any,
      catchError(this.handleError)
    );
  }

  /**
   * Batch multiple requests
   */
  batch<T>(requests: Array<{ method: string; endpoint: string; data?: any }>): Observable<ApiResponse<T>[]> {
    const observables = requests.map(req => {
      switch (req.method.toUpperCase()) {
        case 'GET':
          return this.get<T>(req.endpoint);
        case 'POST':
          return this.post<T>(req.endpoint, req.data);
        case 'PUT':
          return this.put<T>(req.endpoint, req.data);
        case 'DELETE':
          return this.delete<T>(req.endpoint);
        default:
          throw new Error(`Unsupported HTTP method: ${req.method}`);
      }
    });

    return new Observable(observer => {
      let completed = 0;
      const results: ApiResponse<T>[] = [];
      
      observables.forEach((obs, index) => {
        obs.subscribe({
          next: (result) => {
            results[index] = result;
            completed++;
            if (completed === observables.length) {
              observer.next(results);
              observer.complete();
            }
          },
          error: (error) => {
            results[index] = { success: false, message: error.message, data: undefined };
            completed++;
            if (completed === observables.length) {
              observer.next(results);
              observer.complete();
            }
          }
        });
      });
    });
  }

  /**
   * Retry strategy for failed requests
   */
  private retryStrategy() {
    return retryWhen(errors =>
      errors.pipe(
        concatMap((error, index) => {
          if (index >= this.MAX_RETRY_ATTEMPTS - 1) {
            return throwError(error);
          }
          
          // Don't retry on client errors (4xx)
          if (error.status >= 400 && error.status < 500) {
            return throwError(error);
          }
          
          return timer(this.RETRY_DELAY * Math.pow(2, index));
        })
      )
    );
  }

  /**
   * Enhanced error handling
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 400:
          errorMessage = 'Bad Request: Invalid data provided';
          break;
        case 401:
          errorMessage = 'Unauthorized: Please log in again';
          break;
        case 403:
          errorMessage = 'Forbidden: You do not have permission to perform this action';
          break;
        case 404:
          errorMessage = 'Not Found: The requested resource was not found';
          break;
        case 409:
          errorMessage = 'Conflict: The request conflicts with the current state';
          break;
        case 422:
          errorMessage = 'Validation Error: Please check your input';
          break;
        case 429:
          errorMessage = 'Too Many Requests: Please slow down your requests';
          break;
        case 500:
          errorMessage = 'Internal Server Error: Please try again later';
          break;
        case 503:
          errorMessage = 'Service Unavailable: The server is temporarily unavailable';
          break;
        default:
          errorMessage = `Server Error: ${error.status} - ${error.statusText}`;
      }
    }

    console.error('API Error:', {
      status: error.status,
      message: errorMessage,
      url: error.url,
      error: error.error
    });

    return throwError(() => new Error(errorMessage));
  };

  /**
   * Generate cache key for request deduplication
   */
  private generateCacheKey(method: string, url: string, params?: any): string {
    const paramsString = params ? JSON.stringify(params) : '';
    return `${method}:${url}:${paramsString}`;
  }

  /**
   * Clear request cache
   */
  clearCache(): void {
    this.requestCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.requestCache.size,
      keys: Array.from(this.requestCache.keys())
    };
  }

  /**
   * Health check with retry
   */
  healthCheck(): Observable<ApiResponse<{ status: string; timestamp: string }>> {
    return this.get<{ status: string; timestamp: string }>('/actuator/health', {
      retry: true,
      cache: false
    });
  }

  /**
   * Upload file with progress tracking
   */
  uploadFile<T>(endpoint: string, file: File, onProgress?: (progress: number) => void): Observable<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<ApiResponse<T>>(`${this.API_BASE_URL}${endpoint}`, formData, {
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map(event => {
        if (event.type === 1 && onProgress) { // HttpEventType.UploadProgress
          const progress = Math.round(100 * event.loaded / (event.total || 1));
          onProgress(progress);
        }
        return event;
      }),
      map(event => event as any), // Type assertion for simplicity
      catchError(this.handleError)
    );
  }
}
