import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    callback: () => void;
  };
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSubject = new BehaviorSubject<ToastMessage[]>([]);
  public toasts$ = this.toastsSubject.asObservable();

  private toastIdCounter = 0;

  constructor() { }

  /**
   * Show success toast
   */
  success(title: string, message: string, duration: number = 5000): string {
    return this.showToast({
      type: 'success',
      title,
      message,
      duration
    });
  }

  /**
   * Show error toast
   */
  error(title: string, message: string, duration: number = 7000): string {
    return this.showToast({
      type: 'error',
      title,
      message,
      duration
    });
  }

  /**
   * Show warning toast
   */
  warning(title: string, message: string, duration: number = 6000): string {
    return this.showToast({
      type: 'warning',
      title,
      message,
      duration
    });
  }

  /**
   * Show info toast
   */
  info(title: string, message: string, duration: number = 5000): string {
    return this.showToast({
      type: 'info',
      title,
      message,
      duration
    });
  }

  /**
   * Show custom toast
   */
  showToast(toast: Omit<ToastMessage, 'id' | 'timestamp'>): string {
    const id = `toast-${++this.toastIdCounter}`;
    const toastMessage: ToastMessage = {
      ...toast,
      id,
      timestamp: new Date()
    };

    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next([...currentToasts, toastMessage]);

    // Auto-remove toast after duration
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        this.removeToast(id);
      }, toast.duration);
    }

    return id;
  }

  /**
   * Remove toast by ID
   */
  removeToast(id: string): void {
    const currentToasts = this.toastsSubject.value;
    const filteredToasts = currentToasts.filter(toast => toast.id !== id);
    this.toastsSubject.next(filteredToasts);
  }

  /**
   * Clear all toasts
   */
  clearAll(): void {
    this.toastsSubject.next([]);
  }

  /**
   * Get current toasts
   */
  getToasts(): ToastMessage[] {
    return this.toastsSubject.value;
  }

  /**
   * Show API error toast
   */
  showApiError(error: any, defaultMessage: string = 'An error occurred'): string {
    let title = 'Error';
    let message = defaultMessage;

    if (error?.error?.message) {
      message = error.error.message;
    } else if (error?.message) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    }

    if (error?.status) {
      title = `Error ${error.status}`;
    }

    return this.error(title, message);
  }

  /**
   * Show network error toast
   */
  showNetworkError(): string {
    return this.error(
      'Network Error',
      'Unable to connect to the server. Please check your internet connection and try again.'
    );
  }

  /**
   * Show authentication error toast
   */
  showAuthError(): string {
    return this.error(
      'Authentication Error',
      'Your session has expired. Please sign in again.'
    );
  }

  /**
   * Show validation error toast
   */
  showValidationError(message: string): string {
    return this.warning('Validation Error', message);
  }

  /**
   * Show success message for common actions
   */
  showSaveSuccess(): string {
    return this.success('Saved', 'Your changes have been saved successfully.');
  }

  /**
   * Show delete success message
   */
  showDeleteSuccess(item: string = 'item'): string {
    return this.success('Deleted', `${item} has been deleted successfully.`);
  }

  /**
   * Show loading toast (persistent until manually removed)
   */
  showLoading(title: string, message: string): string {
    return this.showToast({
      type: 'info',
      title,
      message,
      duration: 0 // Persistent
    });
  }

  /**
   * Show toast with action button
   */
  showWithAction(
    type: ToastMessage['type'],
    title: string,
    message: string,
    actionLabel: string,
    actionCallback: () => void,
    duration: number = 10000
  ): string {
    return this.showToast({
      type,
      title,
      message,
      duration,
      action: {
        label: actionLabel,
        callback: actionCallback
      }
    });
  }

  /**
   * Show confirmation toast
   */
  showConfirmation(
    title: string,
    message: string,
    confirmCallback: () => void,
    cancelCallback?: () => void
  ): string {
    return this.showWithAction(
      'warning',
      title,
      message,
      'Confirm',
      confirmCallback,
      15000
    );
  }
}