import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
    show?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class ToastService {
    private toasts: BehaviorSubject<Toast[]> = new BehaviorSubject<Toast[]>([]);
    public toasts$ = this.toasts.asObservable();
    private currentId = 0;

    success(message: string, duration: number = 5000): void {
        this.show(message, 'success', duration);
    }

    error(message: string, duration: number = 5000): void {
        this.show(message, 'error', duration);
    }

    warning(message: string, duration: number = 5000): void {
        this.show(message, 'warning', duration);
    }

    info(message: string, duration: number = 5000): void {
        this.show(message, 'info', duration);
    }

    private show(message: string, type: Toast['type'], duration: number): void {
        const id = this.currentId++;
        const toast: Toast = { id, message, type, duration, show: true };

        const currentToasts = this.toasts.getValue();
        this.toasts.next([...currentToasts, toast]);

        // Auto remove toast after duration
        if (duration > 0) {
            setTimeout(() => this.remove(toast.id), duration);
        }
    }

    remove(id: number): void {
        const currentToasts = this.toasts.getValue();
        const index = currentToasts.findIndex(toast => toast.id === id);
        if (index !== -1) {
            const newToasts = [...currentToasts];
            newToasts.splice(index, 1);
            this.toasts.next(newToasts);
        }
    }

    clear(): void {
        this.toasts.next([]);
    }
}