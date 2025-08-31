import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { Subscription } from 'rxjs';

import { AdminService, AdminUser, SystemStats, CreateUserRequest } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';
import { CursorService } from '../../services/cursor.service';

interface UserFilter {
    search: string;
    role: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
}

@Component({
    selector: 'app-admin',
    imports: [CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule],
    templateUrl: './admin.component.html',
    styleUrl: './admin.component.css'
})
export class AdminComponent implements OnInit, OnDestroy, AfterViewInit {
    // Data properties
    users: AdminUser[] = [];
    filteredUsers: AdminUser[] = [];
    systemStats: SystemStats | null = null;
    selectedUser: AdminUser | null = null;

    // Loading and error states
    isLoading = false;
    isStatsLoading = false;
    errorMessage = '';
    successMessage = '';

    // Forms
    createUserForm!: FormGroup;
    editRolesForm!: FormGroup;
    resetPasswordForm!: FormGroup;

    // UI state
    activeTab = 'overview';
    showCreateUserModal = false;
    showEditRolesModal = false;
    showResetPasswordModal = false;
    showDeleteConfirmModal = false;

    // Filtering and sorting
    userFilter: UserFilter = {
        search: '',
        role: '',
        sortBy: 'userName',
        sortOrder: 'asc'
    };

    // Available roles
    availableRoles = ['USER', 'ADMIN'];

    // Subscriptions
    private subscriptions: Subscription[] = [];

    constructor(
        private adminService: AdminService,
        private authService: AuthService,
        private cursorService: CursorService,
        private formBuilder: FormBuilder,
        private router: Router,
        private el: ElementRef,
        private renderer: Renderer2
    ) { }

    ngOnInit(): void {
        // Check authentication first
        const currentUser = this.authService.getCurrentUser();

        if (!currentUser) {
            this.router.navigate(['/signin']);
            return;
        }

        // Check if user has admin privileges
        if (!this.adminService.isCurrentUserAdmin()) {
            this.errorMessage = 'Access denied. You need admin privileges to access this page.';
            setTimeout(() => {
                this.router.navigate(['/dashboard']);
            }, 2000);
            return;
        }

        this.initializeForms();
        this.cursorService.initializeCursor(this.renderer, this.el);
        this.loadInitialData();
    }

    ngAfterViewInit(): void {
        this.initializeAnimations();
    }

    ngOnDestroy(): void {
        this.cursorService.cleanup(this.renderer);
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }

    private initializeForms(): void {
        this.createUserForm = this.formBuilder.group({
            userName: ['', [Validators.required, Validators.minLength(3)]],
            firstName: ['', [Validators.required, Validators.minLength(2)]],
            lastName: ['', [Validators.required, Validators.minLength(2)]],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]]
        });

        this.editRolesForm = this.formBuilder.group({
            roles: [[], [Validators.required]]
        });

        this.resetPasswordForm = this.formBuilder.group({
            newPassword: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', [Validators.required]]
        });
    }

    private initializeAnimations(): void {
        const elements = this.el.nativeElement.querySelectorAll('.fade-in');
        elements.forEach((element: HTMLElement, index: number) => {
            this.renderer.setStyle(element, 'opacity', '0');
            this.renderer.setStyle(element, 'transform', 'translateY(30px)');

            setTimeout(() => {
                this.renderer.setStyle(element, 'transition', 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)');
                this.renderer.setStyle(element, 'opacity', '1');
                this.renderer.setStyle(element, 'transform', 'translateY(0)');
            }, index * 100);
        });
    }

    private loadInitialData(): void {
        this.loadSystemStats();
        this.loadUsers();
    }

    // Tab management
    setActiveTab(tab: string): void {
        this.activeTab = tab;
        this.clearMessages();

        if (tab === 'overview') {
            if (!this.systemStats || this.isStatsStale()) {
                this.loadSystemStats();
            }
        } else if (tab === 'users') {
            this.loadUsers();
        }
    }

    private isStatsStale(): boolean {
        if (!this.systemStats) return true;
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
        return this.systemStats.timestamp < fiveMinutesAgo;
    }

    // Data loading methods
    loadUsers(): void {
        this.isLoading = true;
        this.clearMessages();

        const subscription = this.adminService.getAllUsers().subscribe({
            next: (users) => {
                this.users = users;
                this.applyFilters();
                this.isLoading = false;
            },
            error: (error) => {
                this.errorMessage = `Failed to load users: ${error.message}`;
                this.isLoading = false;
                this.users = [];
                this.filteredUsers = [];
            }
        });

        this.subscriptions.push(subscription);
    }

    loadSystemStats(): void {
        this.isStatsLoading = true;
        this.clearMessages();

        const subscription = this.adminService.getSystemStats().subscribe({
            next: (stats) => {
                this.systemStats = stats;
                this.isStatsLoading = false;
            },
            error: (error) => {
                this.errorMessage = `Failed to load system statistics: ${error.message}`;
                this.isStatsLoading = false;
                this.systemStats = null;
            }
        });

        this.subscriptions.push(subscription);
    }

    // Filtering and sorting
    applyFilters(): void {
        if (!this.users || this.users.length === 0) {
            this.filteredUsers = [];
            return;
        }

        let filtered = [...this.users];

        // Apply search filter
        if (this.userFilter.search) {
            const search = this.userFilter.search.toLowerCase();
            filtered = filtered.filter(user =>
                user.userName.toLowerCase().includes(search) ||
                user.firstName.toLowerCase().includes(search) ||
                user.lastName.toLowerCase().includes(search) ||
                user.email.toLowerCase().includes(search)
            );
        }

        // Apply role filter
        if (this.userFilter.role) {
            filtered = filtered.filter(user => user.roles.includes(this.userFilter.role));
        }

        // Apply sorting
        filtered.sort((a, b) => {
            const aValue = this.getNestedValue(a, this.userFilter.sortBy);
            const bValue = this.getNestedValue(b, this.userFilter.sortBy);

            const comparison = aValue.localeCompare(bValue);
            return this.userFilter.sortOrder === 'asc' ? comparison : -comparison;
        });

        this.filteredUsers = filtered;
    }

    private getNestedValue(obj: any, path: string): string {
        return path.split('.').reduce((o, p) => o && o[p], obj) || '';
    }

    onSearchChange(search: string): void {
        this.userFilter.search = search;
        this.applyFilters();
    }

    onSearchInputChange(event: Event): void {
        const target = event.target as HTMLInputElement;
        this.onSearchChange(target.value);
    }

    onRoleFilterChange(role: string): void {
        this.userFilter.role = role;
        this.applyFilters();
    }

    onRoleSelectChange(event: Event): void {
        const target = event.target as HTMLSelectElement;
        this.onRoleFilterChange(target.value);
    }

    onSortChange(sortBy: string): void {
        if (this.userFilter.sortBy === sortBy) {
            this.userFilter.sortOrder = this.userFilter.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            this.userFilter.sortBy = sortBy;
            this.userFilter.sortOrder = 'asc';
        }
        this.applyFilters();
    }

    // User management actions
    openCreateUserModal(): void {
        this.showCreateUserModal = true;
        this.createUserForm.reset();
        this.clearMessages();
    }

    closeCreateUserModal(): void {
        this.showCreateUserModal = false;
        this.createUserForm.reset();
    }

    onCreateUser(): void {
        if (this.createUserForm.valid) {
            this.isLoading = true;
            const userData: CreateUserRequest = this.createUserForm.value;

            const subscription = this.adminService.createAdminUser(userData).subscribe({
                next: (response) => {
                    this.successMessage = response.message;
                    this.closeCreateUserModal();
                    this.loadUsers();
                    this.isLoading = false;
                },
                error: (error) => {
                    this.errorMessage = error.message;
                    this.isLoading = false;
                }
            });

            this.subscriptions.push(subscription);
        }
    }

    openEditRolesModal(user: AdminUser): void {
        this.selectedUser = user;
        this.editRolesForm.patchValue({ roles: [...user.roles] });
        this.showEditRolesModal = true;
        this.clearMessages();
    }

    closeEditRolesModal(): void {
        this.showEditRolesModal = false;
        this.selectedUser = null;
        this.editRolesForm.reset();
    }

    onUpdateRoles(): void {
        if (this.editRolesForm.valid && this.selectedUser) {
            this.isLoading = true;
            const roles = this.editRolesForm.value.roles;

            const subscription = this.adminService.updateUserRoles(this.selectedUser.userName, roles).subscribe({
                next: (response) => {
                    this.successMessage = response.message;
                    this.closeEditRolesModal();
                    this.loadUsers();
                    this.isLoading = false;
                },
                error: (error) => {
                    this.errorMessage = error.message;
                    this.isLoading = false;
                }
            });

            this.subscriptions.push(subscription);
        }
    }

    openResetPasswordModal(user: AdminUser): void {
        this.selectedUser = user;
        this.resetPasswordForm.reset();
        this.showResetPasswordModal = true;
        this.clearMessages();
    }

    closeResetPasswordModal(): void {
        this.showResetPasswordModal = false;
        this.selectedUser = null;
        this.resetPasswordForm.reset();
    }

    onResetPassword(): void {
        if (this.resetPasswordForm.valid && this.selectedUser) {
            const newPassword = this.resetPasswordForm.value.newPassword;
            const confirmPassword = this.resetPasswordForm.value.confirmPassword;

            if (newPassword !== confirmPassword) {
                this.errorMessage = 'Passwords do not match';
                return;
            }

            this.isLoading = true;

            const subscription = this.adminService.resetUserPassword(this.selectedUser.userName, newPassword).subscribe({
                next: (response) => {
                    this.successMessage = response.message;
                    this.closeResetPasswordModal();
                    this.isLoading = false;
                },
                error: (error) => {
                    this.errorMessage = error.message;
                    this.isLoading = false;
                }
            });

            this.subscriptions.push(subscription);
        }
    }

    openDeleteConfirmModal(user: AdminUser): void {
        this.selectedUser = user;
        this.showDeleteConfirmModal = true;
        this.clearMessages();
    }

    closeDeleteConfirmModal(): void {
        this.showDeleteConfirmModal = false;
        this.selectedUser = null;
    }

    onDeleteUser(): void {
        if (this.selectedUser) {
            this.isLoading = true;

            const subscription = this.adminService.deleteUser(this.selectedUser.userName).subscribe({
                next: (response) => {
                    this.successMessage = response.message;
                    this.closeDeleteConfirmModal();
                    this.loadUsers();
                    this.isLoading = false;
                },
                error: (error) => {
                    this.errorMessage = error.message;
                    this.isLoading = false;
                }
            });

            this.subscriptions.push(subscription);
        }
    }

    promoteToAdmin(user: AdminUser): void {
        this.isLoading = true;
        this.clearMessages();

        const subscription = this.adminService.promoteUserToAdmin(user.userName).subscribe({
            next: (response) => {
                this.successMessage = response.message;
                this.loadUsers();
                this.isLoading = false;
            },
            error: (error) => {
                this.errorMessage = error.message;
                this.isLoading = false;
            }
        });

        this.subscriptions.push(subscription);
    }

    // Utility methods
    isUserAdmin(user: AdminUser): boolean {
        return user.roles.includes('ADMIN');
    }

    getCurrentUser(): string {
        const currentUser = this.authService.getCurrentUser();
        return currentUser ? currentUser.userName : '';
    }

    clearMessages(): void {
        this.errorMessage = '';
        this.successMessage = '';
    }

    // Form validation helpers
    isFieldInvalid(form: FormGroup, fieldName: string): boolean {
        const field = form.get(fieldName);
        return field ? field.invalid && (field.dirty || field.touched) : false;
    }

    getFieldError(form: FormGroup, fieldName: string): string {
        const field = form.get(fieldName);
        if (field && field.errors) {
            if (field.errors['required']) return `${fieldName} is required`;
            if (field.errors['minlength']) return `${fieldName} must be at least ${field.errors['minlength'].requiredLength} characters`;
            if (field.errors['email']) return 'Please enter a valid email address';
        }
        return '';
    }

    onRoleToggle(role: string, event: any): void {
        const currentRoles = this.editRolesForm.value.roles || [];
        if (event.target.checked) {
            if (!currentRoles.includes(role)) {
                currentRoles.push(role);
            }
        } else {
            const index = currentRoles.indexOf(role);
            if (index > -1) {
                currentRoles.splice(index, 1);
            }
        }
        this.editRolesForm.patchValue({ roles: currentRoles });
    }
}