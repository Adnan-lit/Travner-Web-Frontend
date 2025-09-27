import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ToastMessage {
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    text: string;
    timeout?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
    private messagesSubject = new BehaviorSubject<ToastMessage[]>([]);
    messages$ = this.messagesSubject.asObservable();

    private push(msg: Omit<ToastMessage, 'id'>) {
        const id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
        const full: ToastMessage = { timeout: 4000, ...msg, id };
        this.messagesSubject.next([...this.messagesSubject.value, full]);
        if (full.timeout) {
            setTimeout(() => this.dismiss(id), full.timeout);
        }
    }

    success(text: string, timeout = 4000) { this.push({ type: 'success', text, timeout }); }
    error(text: string, timeout = 5500) { this.push({ type: 'error', text, timeout }); }
    info(text: string, timeout = 4000) { this.push({ type: 'info', text, timeout }); }
    warning(text: string, timeout = 5000) { this.push({ type: 'warning', text, timeout }); }

    dismiss(id: string) {
        this.messagesSubject.next(this.messagesSubject.value.filter(m => m.id !== id));
    }

    clear() { this.messagesSubject.next([]); }
}
