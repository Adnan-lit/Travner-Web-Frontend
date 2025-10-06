/**
 * Enhanced User Search Service for Travner Chat
 * Integrates with existing backend APIs for user discovery
 */
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, Subject, BehaviorSubject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, map, catchError } from 'rxjs/operators';
import { EnvironmentConfig } from '../config/environment.config';

export interface UserSearchResult {
    id: string;
    userName: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    bio?: string;
    location?: string;
    profileImageUrl?: string;
    displayName?: string;
}

export interface UserSearchResponse {
    success: boolean;
    message: string;
    data: {
        content: UserSearchResult[];
        pageable: {
            pageNumber: number;
            pageSize: number;
        };
        totalElements: number;
        totalPages: number;
        first: boolean;
        last: boolean;
    };
    pagination?: {
        page: number;
        size: number;
        totalElements: number;
        totalPages: number;
        first: boolean;
        last: boolean;
    };
}

@Injectable({
    providedIn: 'root'
})
export class UserSearchService {
    private readonly baseUrl = this.computeBaseUrl();
    private readonly usersRoot = this.computeUsersRoot(this.baseUrl);

    private searchTerms = new Subject<string>();
    private loadingSubject = new BehaviorSubject<boolean>(false);

    public loading$ = this.loadingSubject.asObservable();

    constructor(private http: HttpClient) { }

    private computeBaseUrl(): string {
        try {
            const override = localStorage.getItem('travner_backend_override');
            if (override) {
                return override.replace(/\/$/, '');
            }
        } catch { }
        return EnvironmentConfig.getApiBaseUrl().replace(/\/$/, '');
    }

    private computeUsersRoot(base: string): string {
        // Ensure we have exactly one '/api' segment
        const normalized = base.replace(/\/api.*$/, '');
        return `${normalized}/api/users`;
    }

    // Rely on interceptor for Authorization; set content-type only when posting JSON bodies

    /**
     * Search users with pagination
     */
    searchUsers(query: string, page: number = 0, size: number = 20): Observable<UserSearchResponse> {
        if (!query.trim()) {
            return of({
                success: true,
                message: 'Empty query',
                data: {
                    content: [],
                    pageable: { pageNumber: page, pageSize: size },
                    totalElements: 0,
                    totalPages: 0,
                    first: true,
                    last: true
                }
            });
        }

        this.loadingSubject.next(true);

        const params = new HttpParams()
            .set('q', query.trim())
            .set('page', page.toString())
            .set('size', size.toString());

        return this.http.get<UserSearchResponse>(`${this.usersRoot}/search`, { params }).pipe(
            map(response => {
                this.loadingSubject.next(false);
                // Enhance display names
                if (response.data?.content) {
                    response.data.content = response.data.content.map(user => ({
                        ...user,
                        displayName: this.getDisplayName(user)
                    }));
                }
                return response;
            }),
            catchError(error => {
                this.loadingSubject.next(false);
                console.error('User search failed:', error);
                return of({
                    success: false,
                    message: 'Search failed',
                    data: {
                        content: [],
                        pageable: { pageNumber: page, pageSize: size },
                        totalElements: 0,
                        totalPages: 0,
                        first: true,
                        last: true
                    }
                });
            })
        );
    }

    /**
     * Get username suggestions for autocomplete
     */
    getUsernameSuggestions(partial: string): Observable<string[]> {
        if (!partial.trim() || partial.length < 2) {
            return of([]);
        }

        const params = new HttpParams().set('partial', partial.trim());

        return this.http.get<{ success: boolean; data: string[] }>(`${this.usersRoot}/suggestions`, { params }).pipe(
            map(response => response.data || []),
            catchError(error => {
                console.error('Username suggestions failed:', error);
                return of([]);
            })
        );
    }

    /**
     * Real-time search with debouncing
     */
    getSearchResults(): Observable<UserSearchResult[]> {
        return this.searchTerms.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            switchMap(term =>
                term.length >= 2
                    ? this.searchUsers(term).pipe(map(response => response.data.content))
                    : of([])
            )
        );
    }

    /**
     * Trigger search
     */
    search(term: string): void {
        this.searchTerms.next(term);
    }

    /**
     * Get display name for user
     */
    private getDisplayName(user: UserSearchResult): string {
        if (user.firstName && user.lastName) {
            return `${user.firstName} ${user.lastName}`;
        } else if (user.firstName) {
            return user.firstName;
        } else if (user.lastName) {
            return user.lastName;
        }
        return user.userName;
    }

    /**
     * Search for users by username (exact match)
     */
    findUserByUsername(username: string): Observable<UserSearchResult | null> {
        if (!username.trim()) {
            return of(null);
        }

        return this.searchUsers(username, 0, 1).pipe(
            map(response => {
                const exactMatch = response.data.content.find(
                    user => user.userName.toLowerCase() === username.toLowerCase()
                );
                return exactMatch || null;
            })
        );
    }

    /**
     * Get current user info
     */
    getCurrentUser(): UserSearchResult | null {
        try {
            const currentUserJson = localStorage.getItem('travner_current_user');
            if (currentUserJson) {
                const user = JSON.parse(currentUserJson);
                return {
                    ...user,
                    displayName: this.getDisplayName(user)
                };
            }
        } catch { }
        return null;
    }
}