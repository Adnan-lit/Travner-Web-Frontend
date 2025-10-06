/**
 * User Search Component for starting new conversations
 * Integrates with existing Travner chat system
 */
import { Component, OnInit, OnDestroy, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { UserSearchService, UserSearchResult } from '../../services/user-search.service';

@Component({
    selector: 'app-user-search',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    templateUrl: './user-search.component.html',
    styleUrls: ['./user-search.component.css']
})
export class UserSearchComponent implements OnInit, OnDestroy {
    @Output() userSelected = new EventEmitter<UserSearchResult>();
    @Output() onCancel = new EventEmitter<void>();
    @Input() placeholder = 'Search users by name or username...';
    @Input() showCancel = true;

    searchControl = new FormControl('');
    searchResults: UserSearchResult[] = [];
    suggestions: string[] = [];
    loading = false;
    showResults = false;
    errorMessage = '';

    private destroy$ = new Subject<void>();

    constructor(private userSearchService: UserSearchService) { }

    ngOnInit(): void {
        // Setup search with debouncing
        this.searchControl.valueChanges.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            takeUntil(this.destroy$)
        ).subscribe(searchTerm => {
            if (searchTerm && searchTerm.length >= 2) {
                this.performSearch(searchTerm);
            } else {
                this.clearResults();
            }
        });

        // Subscribe to loading state
        this.userSearchService.loading$.pipe(
            takeUntil(this.destroy$)
        ).subscribe(loading => {
            this.loading = loading;
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private performSearch(searchTerm: string): void {
        this.loading = true;
        this.errorMessage = '';

        this.userSearchService.searchUsers(searchTerm).subscribe({
            next: (response) => {
                if (response.success) {
                    this.searchResults = response.data.content;
                    this.showResults = true;
                } else {
                    this.errorMessage = response.message || 'Search failed';
                    this.searchResults = [];
                }
                this.loading = false;
            },
            error: (error) => {
                console.error('Search error:', error);
                this.errorMessage = 'Search failed. Please try again.';
                this.loading = false;
                this.clearResults();
            }
        });
    }

    onUserSelect(user: UserSearchResult): void {
        this.userSelected.emit(user);
        this.clearResults();
        this.searchControl.setValue('');
    }

    onCancelClick(): void {
        this.onCancel.emit();
        this.clearResults();
        this.searchControl.setValue('');
    }

    clearResults(): void {
        this.searchResults = [];
        this.showResults = false;
        this.errorMessage = '';
    }

    onFocus(): void {
        if (this.searchResults.length > 0) {
            this.showResults = true;
        }
    }

    onBlur(): void {
        // Delay hiding results to allow for clicks
        setTimeout(() => {
            this.showResults = false;
        }, 200);
    }

    getDisplayName(user: UserSearchResult): string {
        return user.displayName || user.userName;
    }

    getAvatarUrl(user: UserSearchResult): string {
        return user.profileImageUrl || this.generateDefaultAvatar(user.userName);
    }

    // Public method to handle image errors
    handleImageError(event: Event, username: string): void {
        const imgElement = event.target as HTMLImageElement;
        if (imgElement) {
            imgElement.src = this.generateDefaultAvatar(username);
        }
    }

    private generateDefaultAvatar(username: string): string {
        // Generate a simple colored avatar based on username
        const colors = [
            '#f44336', '#e91e63', '#9c27b0', '#673ab7',
            '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4',
            '#009688', '#4caf50', '#8bc34a', '#cddc39',
            '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'
        ];

        const hash = username.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);

        const color = colors[Math.abs(hash) % colors.length];
        const initials = this.getInitials(username);

        // Generate SVG avatar
        const svg = `<svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="${color}"/>
      <text x="20" y="25" font-family="Arial, sans-serif" font-size="14" font-weight="bold" 
            fill="white" text-anchor="middle">${initials}</text>
    </svg>`;

        return `data:image/svg+xml;base64,${btoa(svg)}`;
    }

    private getInitials(name: string): string {
        return name
            .split(' ')
            .map(part => part.charAt(0).toUpperCase())
            .slice(0, 2)
            .join('');
    }

    onKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Escape') {
            this.onCancelClick();
        } else if (event.key === 'Enter' && this.searchResults.length === 1) {
            this.onUserSelect(this.searchResults[0]);
        }
    }

    trackByUserId(index: number, user: UserSearchResult): string {
        return user.id;
    }
}