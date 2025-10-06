import { Injectable, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

/**
 * Subscription management utility to prevent memory leaks
 */
@Injectable()
export class SubscriptionManager implements OnDestroy {
    private subscriptions: Subscription[] = [];

    /**
     * Add a subscription to be managed
     */
    add(subscription: Subscription): void {
        this.subscriptions.push(subscription);
    }

    /**
     * Unsubscribe from all managed subscriptions
     */
    ngOnDestroy(): void {
        this.subscriptions.forEach(sub => {
            if (sub && !sub.closed) {
                sub.unsubscribe();
            }
        });
        this.subscriptions = [];
    }

    /**
     * Get count of active subscriptions
     */
    getActiveCount(): number {
        return this.subscriptions.filter(sub => sub && !sub.closed).length;
    }

    /**
     * Manually unsubscribe from all subscriptions
     */
    unsubscribeAll(): void {
        this.ngOnDestroy();
    }
}