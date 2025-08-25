import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService, User } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class UserProfileService {
    private userProfileSubject = new BehaviorSubject<User | null>(null);
    public userProfile$ = this.userProfileSubject.asObservable();

    constructor(private authService: AuthService) {
        // Subscribe to authentication changes
        this.authService.currentUser$.subscribe(user => {
            this.userProfileSubject.next(user);
        });
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
            return `${user.firstName} ${user.lastName}`;
        }
        return '';
    }

    /**
     * Get user's initials
     */
    getInitials(): string {
        const user = this.getCurrentProfile();
        if (user) {
            return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
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