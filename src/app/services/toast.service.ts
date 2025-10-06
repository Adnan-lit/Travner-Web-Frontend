import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ToastMessage {
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    text: string;
    timeout?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService implements OnDestroy {
    private messagesSubject = new BehaviorSubject<ToastMessage[]>([]);
    messages$ = this.messagesSubject.asObservable();
    private timeoutHandles = new Map<string, ReturnType<typeof setTimeout>>();

    private push(msg: Omit<ToastMessage, 'id'>) {
        const id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
        const full: ToastMessage = { timeout: 4000, ...msg, id };
        this.messagesSubject.next([...this.messagesSubject.value, full]);
        if (full.timeout) {
            const handle = setTimeout(() => this.dismiss(id), full.timeout);
            this.timeoutHandles.set(id, handle);
        }
    }

    success(text: string, timeout = 4000) { this.push({ type: 'success', text, timeout }); }
    error(text: string, timeout = 5500) { this.push({ type: 'error', text, timeout }); }
    info(text: string, timeout = 4000) { this.push({ type: 'info', text, timeout }); }
    warning(text: string, timeout = 5000) { this.push({ type: 'warning', text, timeout }); }

    dismiss(id: string) {
        // Clear timeout if exists
        const handle = this.timeoutHandles.get(id);
        if (handle) {
            clearTimeout(handle);
            this.timeoutHandles.delete(id);
        }
        this.messagesSubject.next(this.messagesSubject.value.filter(m => m.id !== id));
    }

    clear() {
        // Clear all timeout handles
        this.timeoutHandles.forEach(handle => clearTimeout(handle));
        this.timeoutHandles.clear();
        this.messagesSubject.next([]);
    }

    ngOnDestroy(): void {
        this.clear();
        this.messagesSubject.complete();
    }
}
