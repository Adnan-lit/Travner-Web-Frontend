import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { EnvironmentConfig } from '../config/environment.config';

/**
 * Tracks backend reachability (simple heuristic: HTML fallbacks vs JSON success)
 * Other services can call reportHtmlFallback/reportSuccess. Components can subscribe.
 */
@Injectable({ providedIn: 'root' })
export class BackendStatusService {
    private reachableSubject = new BehaviorSubject<boolean>(true);
    reachable$ = this.reachableSubject.asObservable();
    private lastHtmlTimestamp: number | null = null;

    reportHtmlFallback(context: string) {
        this.lastHtmlTimestamp = Date.now();
        if (this.reachableSubject.value) {
            console.warn('[BackendStatus] HTML fallback detected -> marking backend unreachable', { context });
            this.reachableSubject.next(false);
        }
    }

    reportSuccess(context: string) {
        if (!this.reachableSubject.value) {
            console.info('[BackendStatus] Successful JSON after outage -> marking backend reachable again', { context });
            this.reachableSubject.next(true);
        }
    }

    isLikelyReachable(): boolean { return this.reachableSubject.value; }
}
