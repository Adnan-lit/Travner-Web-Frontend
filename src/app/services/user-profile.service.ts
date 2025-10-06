import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { AuthService, User } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class UserProfileService implements OnDestroy {
    private userProfileSubject = new BehaviorSubject<User | null>(null);
    public userProfile$ = this.userProfileSubject.asObservable();
    private authSubscription?: Subscription;

    constructor(private authService: AuthService) {
        // Subscribe to authentication changes
        this.authSubscription = this.authService.currentUser$.subscribe(user => {
            this.userProfileSubject.next(user);
        });
    }

    ngOnDestroy(): void {
        this.authSubscription?.unsubscribe();
        this.userProfileSubject.complete();
    }

    /**
     * Get current user profile
     */
    getCurrentProfile(): User | null {
        return this.userProfileSubject.value;
    }

    /**
     * Check if user is logged in
     */
    isLoggedIn(): boolean {
        return !!this.userProfileSubject.value;
    }

    /**
     * Get user's full name
     */
    getFullName(): string {
        const user = this.getCurrentProfile();
        if (user) {
            const firstName = user.firstName || '';
            const lastName = user.lastName || '';
            return `${firstName} ${lastName}`.trim();
        }
        return '';
    }

    /**
     * Get user's initials
     */
    getInitials(): string {
        const user = this.getCurrentProfile();
        if (user) {
            const firstName = user.firstName || '';
            const lastName = user.lastName || '';
            return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
        }
        return '';
    }

    /**
     * Update user profile (placeholder for future functionality)
     */
    updateProfile(updatedUser: Partial<User>): void {
        const currentUser = this.getCurrentProfile();
        if (currentUser) {
            const updated = { ...currentUser, ...updatedUser };
            this.userProfileSubject.next(updated);
        }
    }

    /**
     * Clear user profile
     */
    clearProfile(): void {
        this.userProfileSubject.next(null);
    }
}