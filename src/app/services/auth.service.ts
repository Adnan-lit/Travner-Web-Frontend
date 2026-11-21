import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, finalize, map, shareReplay, switchMap, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { getApiBaseUrl } from '../config/runtime.config';
import { ApiResponse } from '../models/api-response.model';
import { User, SignupRequest, UpdateProfileRequest } from '../models/common.model';

export interface AuthSignupRequest {
    userName: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    bio?: string;
    location?: string;
}

export interface SignupResponse {
    success?: boolean;
    message?: string;
    user?: any;
    [key: string]: any;
}

/** Public identity returned by the backend's /api/auth endpoints. */
export interface AuthUser {
    id?: string;
    username: string;
    email?: string;
    roles?: string[];
}

interface AuthResponseData {
    accessToken: string;
    tokenType: string;
    expiresIn: number;
    user: AuthUser;
}

/**
 * Authentication state. The access token lives only in memory; the rotating
 * refresh token is an HttpOnly cookie set by the backend and is never readable
 * by JavaScript. No credentials or tokens are written to localStorage.
 */
@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly API_BASE_URL = getApiBaseUrl();

    private accessTokenSubject = new BehaviorSubject<string | null>(null);
    public accessToken$ = this.accessTokenSubject.asObservable();

    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
    public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

    private userRoles: string[] = [];

    /** Single-flight refresh so parallel 401s trigger only one rotation. */
    private refreshInFlight$: Observable<AuthResponseData> | null = null;

    constructor(
        private http: HttpClient,
        private router: Router
    ) {}

    // ------------------------------------------------------------------
    // Session lifecycle
    // ------------------------------------------------------------------

    /** Called once at startup; the refresh cookie restores the session. */
    initializeSession(): Observable<boolean> {
        return this.refresh().pipe(
            map(() => true),
            catchError(() => {
                this.clearAuthData();
                return of(false);
            })
        );
    }

    /** Exchange username/password for an access token and refresh cookie. */
    login(username: string, password: string): Observable<AuthResponseData> {
        const endpoint = `${this.API_BASE_URL}/api/auth/login`;
        return this.http.post<ApiResponse<AuthResponseData>>(
            endpoint,
            { username: username.trim().toLowerCase(), password },
            { withCredentials: true }
        ).pipe(
            map(response => this.unwrap(response, 'Invalid username or password')),
            tap(data => this.applySession(data))
        );
    }

    /** Rotate the refresh cookie and replace the in-memory access token. */
    refresh(): Observable<AuthResponseData> {
        if (this.refreshInFlight$) {
            return this.refreshInFlight$;
        }

        const endpoint = `${this.API_BASE_URL}/api/auth/refresh`;
        this.refreshInFlight$ = this.http.post<ApiResponse<AuthResponseData>>(
            endpoint, {}, { withCredentials: true }
        ).pipe(
            map(response => this.unwrap(response, 'Session expired')),
            tap(data => this.applySession(data)),
            catchError(error => {
                this.clearAuthData();
                return throwError(() => error);
            }),
            finalize(() => { this.refreshInFlight$ = null; }),
            shareReplay(1)
        );

        return this.refreshInFlight$;
    }

    /** Revoke the refresh token on the server and clear local state. */
    logout(): void {
        const endpoint = `${this.API_BASE_URL}/api/auth/logout`;
        this.http.post(endpoint, {}, { withCredentials: true })
            .pipe(catchError(() => of(null)))
            .subscribe(() => undefined);
        this.clearAuthData();
        this.router.navigate(['/signin']);
    }

    /** Fetch the authenticated user (used to enrich the profile after login). */
    me(): Observable<AuthUser> {
        return this.http.get<ApiResponse<AuthUser>>(`${this.API_BASE_URL}/api/auth/me`).pipe(
            map(response => this.unwrap(response, 'Unable to load user'))
        );
    }

    // ------------------------------------------------------------------
    // Identity / state accessors used across the app
    // ------------------------------------------------------------------

    getAccessToken(): string | null {
        return this.accessTokenSubject.value;
    }

    /** Backwards-compatible alias; no longer reads localStorage. */
    getToken(): string | null {
        return this.getAccessToken();
    }

    getCurrentUser(): User | null {
        return this.currentUserSubject.value;
    }

    isAuthenticated(): boolean {
        return this.isAuthenticatedSubject.value;
    }

    /** Kept for callers that check before navigating; backed by auth state. */
    verifyAuthentication(): boolean {
        return this.isAuthenticated();
    }

    hasRole(role: string): boolean {
        return this.userRoles.includes(role);
    }

    isAdmin(): boolean {
        return this.hasRole('ADMIN');
    }

    getRedirectUrl(): string {
        if (!this.isAuthenticated()) {
            return '/signin';
        }
        return this.isAdmin() ? '/admin' : '/dashboard';
    }

    // ------------------------------------------------------------------
    // Existing account/profile APIs (all use the auth interceptor)
    // ------------------------------------------------------------------

    signup(signupData: SignupRequest): Observable<ApiResponse<User>> {
        const endpoint = `${this.API_BASE_URL}/api/public/register`;
        const normalizedSignupData = {
            ...signupData,
            userName: signupData.userName.trim().toLowerCase(),
            email: signupData.email.trim().toLowerCase()
        };
        return this.http.post<ApiResponse<User>>(endpoint, normalizedSignupData);
    }

    healthCheck(): Observable<ApiResponse<{ status: string; timestamp: string }>> {
        return this.http.get<ApiResponse<{ status: string; timestamp: string }>>(
            `${this.API_BASE_URL}/actuator/health`);
    }

    deleteUser(): Observable<void> {
        return this.http.delete<void>(`${this.API_BASE_URL}/api/user/account`)
            .pipe(tap(() => this.logout()));
    }

    checkUsername(username: string): Observable<ApiResponse<{ available: boolean }>> {
        return this.http.get<ApiResponse<{ available: boolean }>>(
            `${this.API_BASE_URL}/api/public/check-username/${encodeURIComponent(username.trim().toLowerCase())}`);
    }

    updateProfile(profileData: UpdateProfileRequest): Observable<ApiResponse<User>> {
        return this.http.put<ApiResponse<User>>(`${this.API_BASE_URL}/api/user/profile`, profileData)
            .pipe(tap(response => this.updateCurrentUser(response.data)));
    }

    updateProfilePartial(profileData: Partial<UpdateProfileRequest>): Observable<ApiResponse<User>> {
        return this.http.patch<ApiResponse<User>>(`${this.API_BASE_URL}/api/user/profile`, profileData)
            .pipe(tap(response => this.updateCurrentUser(response.data)));
    }

    changePassword(currentPassword: string, newPassword: string): Observable<ApiResponse<{ message: string }>> {
        return this.http.put<ApiResponse<{ message: string }>>(
            `${this.API_BASE_URL}/api/user/password`, { currentPassword, newPassword });
    }

    createFirstAdmin(userData: {
        userName: string;
        password: string;
        firstName: string;
        lastName: string;
        email: string;
    }): Observable<ApiResponse<{ message: string }>> {
        return this.http.post<ApiResponse<{ message: string }>>(
            `${this.API_BASE_URL}/api/public/create-first-admin`, userData);
    }

    testCartAuthentication(): Observable<any> {
        return this.http.get(`${this.API_BASE_URL}/api/cart/count`);
    }

    getUsers(): Observable<ApiResponse<User[]>> {
        return this.http.get<ApiResponse<User[]>>(`${this.API_BASE_URL}/api/admin/users`);
    }

    getUserById(userId: string): Observable<ApiResponse<User>> {
        return this.http.get<ApiResponse<User>>(`${this.API_BASE_URL}/api/admin/users/${userId}`);
    }

    updateUser(userId: string, userData: Partial<User>): Observable<ApiResponse<User>> {
        return this.http.put<ApiResponse<User>>(`${this.API_BASE_URL}/api/admin/users/${userId}`, userData);
    }

    deleteUserById(userId: string): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.API_BASE_URL}/api/admin/users/${userId}`);
    }

    activateUser(userId: string): Observable<ApiResponse<void>> {
        return this.http.post<ApiResponse<void>>(`${this.API_BASE_URL}/api/admin/users/${userId}/activate`, {});
    }

    deactivateUser(userId: string): Observable<ApiResponse<void>> {
        return this.http.post<ApiResponse<void>>(`${this.API_BASE_URL}/api/admin/users/${userId}/deactivate`, {});
    }

    // ------------------------------------------------------------------
    // Internals
    // ------------------------------------------------------------------

    private applySession(data: AuthResponseData): void {
        this.accessTokenSubject.next(data.accessToken);
        this.userRoles = data.user.roles ?? [];
        this.setCurrentUser(this.toUser(data.user));
    }

    private toUser(authUser: AuthUser): User {
        return {
            id: authUser.id ?? '',
            userName: authUser.username,
            email: authUser.email,
            roles: authUser.roles ?? []
        } as User;
    }

    private updateCurrentUser(user?: User | null): void {
        if (!user) {
            return;
        }
        this.setCurrentUser(user);
    }

    private setCurrentUser(user: User | null): void {
        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(!!user);
        this.userRoles = user?.roles ?? [];
    }

    private clearAuthData(): void {
        this.accessTokenSubject.next(null);
        this.userRoles = [];
        this.setCurrentUser(null);
    }

    private unwrap<T>(response: ApiResponse<T> | null | undefined, fallbackMessage: string): T {
        if (!response || response.success === false) {
            throw new Error(response?.message || fallbackMessage);
        }
        return response.data as T;
    }
}
