import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { Logger } from '../utils/logger.util';

@Injectable({
    providedIn: 'root'
})
export class ErrorHandlerService {

    /**
     * Generic error handler for HTTP requests
     */
    handleError<T>(operation = 'operation', context?: string) {
        return (error: any): Observable<T> => {
            const errorMessage = this.getErrorMessage(error);

            Logger.error(`${operation} failed`, {
                context,
                error: errorMessage,
                status: error.status,
                url: error.url
            });

            return throwError(() => new Error(errorMessage));
        };
    }

    /**
     * Extract user-friendly error message from HTTP error
     */
    private getErrorMessage(error: any): string {
        if (error.error?.message) {
            return error.error.message;
        }

        if (error.message) {
            return error.message;
        }

        switch (error.status) {
            case 401:
                return 'Authentication required. Please sign in.';
            case 403:
                return 'Access denied. Insufficient permissions.';
            case 404:
                return 'Resource not found.';
            case 409:
                return 'Resource already exists.';
            case 422:
                return 'Invalid data provided.';
            case 500:
                return 'Server error. Please try again later.';
            case 0:
                return 'Network error. Please check your connection.';
            default:
                return 'An unexpected error occurred.';
        }
    }

    /**
     * Create a loading state wrapper for observables
     */
    withLoadingState<T>(
        isLoading: { value: boolean },
        clearMessages?: () => void
    ) {
        return (source: Observable<T>) => {
            isLoading.value = true;
            if (clearMessages) clearMessages();

            return source.pipe(
                finalize(() => {
                    isLoading.value = false;
                })
            );
        };
    }
}