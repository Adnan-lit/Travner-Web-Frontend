import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, Renderer2, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { AdminService, AdminUser, SystemStats, CreateUserRequest } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';
import { CursorService } from '../../services/cursor.service';
import { AdminMarketplaceComponent } from './admin-marketplace.component';
import { Logger } from '../../utils/logger.util';

interface UserFilter {
    search: string;
    role: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
}

interface DiagnosticStep {
    step: string;
    status: string;
    data: any;
}

interface DiagnosticResults {
    timestamp: string;
    status: string;
    steps: DiagnosticStep[];
}

@Component({
    selector: 'app-admin',
    templateUrl: './admin.component.html',
    styleUrls: ['./admin.component.css'],
    standalone: true,
    imports: [CommonModule, RouterModule, ReactiveFormsModule, AdminMarketplaceComponent]
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

    // Marketplace management component
    marketplaceComponent: any;
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

    // Diagnostic properties
    diagnosticResults: DiagnosticResults | null = null;
    showDiagnosticResults = false;

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

        // Load data immediately and set active tab
        this.activeTab = 'users';
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
        // Animate dashboard elements on load
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

        // Add a small delay and then reload users to ensure proper initialization
        setTimeout(() => {
            this.loadUsers();
        }, 500);
    }

    // Tab management
    setActiveTab(tab: string): void {
        this.activeTab = tab;
        this.clearMessages();

        if (tab === 'overview') {
            // Only reload stats if we don't have them or they're stale
            if (!this.systemStats || this.isStatsStale()) {
                this.loadSystemStats();
            }
        } else if (tab === 'users') {
            // Always reload users to ensure fresh data
            this.loadUsers();
        } else if (tab === 'marketplace') {
            // Load marketplace management component
            this.loadMarketplaceManagement();
        }
    }

    private loadMarketplaceManagement(): void {
        // The marketplace component is now loaded directly in the template
        // No additional loading logic needed here
        console.log('Marketplace tab selected - marketplace component loaded');
    }

    private isStatsStale(): boolean {
        if (!this.systemStats) return true;
        // Consider stats stale if they're older than 5 minutes
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
        return this.systemStats.timestamp < fiveMinutesAgo;
    }

    // Data loading methods
    loadUsers(): void {
        this.isLoading = true;
        this.clearMessages();
        console.log('🔄 Loading users...');

        // Enhanced debugging: Check authentication and admin status
        const currentUser = this.authService.getCurrentUser();
        console.log('👤 Current user in component:', currentUser);
        console.log('🔐 Is admin:', this.adminService.isCurrentUserAdmin());

        // Enhanced debugging: Check component state before API call
        console.log('📊 Component state before API call:', {
            isLoading: this.isLoading,
            activeTab: this.activeTab,
            usersCount: this.users.length,
            filteredUsersCount: this.filteredUsers.length
        });

        const subscription = this.adminService.getAllUsers().subscribe({
            next: (users) => {
                console.log('✅ Users loaded successfully in component:', users.length, 'users');
                console.log('📊 Full users data received:', users);

                // Enhanced debugging: Check users data structure
                if (users && users.length > 0) {
                    console.log('👥 Sample user structure:', {
                        firstUser: users[0],
                        userKeys: Object.keys(users[0]),
                        hasRequiredFields: {
                            userName: !!users[0].userName,
                            firstName: !!users[0].firstName,
                            lastName: !!users[0].lastName,
                            email: !!users[0].email,
                            roles: !!users[0].roles
                        }
                    });
                } else {
                    console.log('⚠️ Empty users array received from API');
                }

                this.users = users;
                console.log('💾 Users assigned to component property:', this.users.length);

                this.applyFilters();
                this.isLoading = false;

                console.log('📋 Final component state:', {
                    usersCount: this.users.length,
                    filteredUsersCount: this.filteredUsers.length,
                    isLoading: this.isLoading
                });
            },
            error: (error) => {
                console.error('❌ Error loading users in component:', error);
                console.error('🚨 Error details:', {
                    message: error.message,
                    status: error.status,
                    stack: error.stack
                });

                this.errorMessage = `Failed to load users: ${error.message}`;
                this.isLoading = false;

                // Ensure arrays are initialized even on error
                this.users = [];
                this.filteredUsers = [];

                console.log('📋 Component state after error:', {
                    errorMessage: this.errorMessage,
                    usersCount: this.users.length,
                    filteredUsersCount: this.filteredUsers.length,
                    isLoading: this.isLoading
                });
            }
        });

        this.subscriptions.push(subscription);
    }

    loadSystemStats(): void {
        this.isStatsLoading = true;
        this.clearMessages();
        console.log('🔄 Loading system stats...');

        const subscription = this.adminService.getSystemStats().subscribe({
            next: (stats) => {
                console.log('✅ System stats loaded successfully:', stats);
                this.systemStats = stats;
                this.isStatsLoading = false;
            },
            error: (error) => {
                console.error('❌ Error loading system stats:', error);
                this.errorMessage = `Failed to load system statistics: ${error.message}`;
                this.isStatsLoading = false;
                // Ensure stats is reset on error
                this.systemStats = null;
            }
        });

        this.subscriptions.push(subscription);
    }

    // Filtering and sorting
    applyFilters(): void {
        console.log('🔍 Applying filters to users:', this.users.length, 'users');

        if (!this.users || this.users.length === 0) {
            console.log('⚠️ No users to filter');
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
            console.log('🔍 After search filter:', filtered.length, 'users');
        }

        // Apply role filter
        if (this.userFilter.role) {
            filtered = filtered.filter(user => user.roles.includes(this.userFilter.role));
            console.log('🔍 After role filter:', filtered.length, 'users');
        }

        // Apply sorting
        filtered.sort((a, b) => {
            const aValue = this.getNestedValue(a, this.userFilter.sortBy);
            const bValue = this.getNestedValue(b, this.userFilter.sortBy);

            const comparison = aValue.localeCompare(bValue);
            return this.userFilter.sortOrder === 'asc' ? comparison : -comparison;
        });

        this.filteredUsers = filtered;
        console.log('✅ Final filtered users:', this.filteredUsers.length);
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

    /**
     * Toggle user status (active/inactive)
     */
    // TODO: Implement user status toggle when updateUserStatus method is added to AdminService
    // toggleUserStatus(user: AdminUser): void {
    //     this.isLoading = true;
    //     this.clearMessages();
    //
    //     const newStatus = !user.active;
    //
    //     const subscription = this.adminService.updateUserStatus(user.userName, newStatus).subscribe({
    //         next: (response) => {
    //             this.successMessage = `User ${newStatus ? 'activated' : 'deactivated'} successfully`;
    //             this.loadUsers();
    //             this.isLoading = false;
    //         },
    //         error: (error) => {
    //             this.errorMessage = error.message;
    //             this.isLoading = false;
    //         }
    //     });
    //
    //     this.subscriptions.push(subscription);
    // }

    // Utility methods
    isUserAdmin(user: AdminUser): boolean {
        return user.roles.includes('ADMIN');
    }

    getCurrentUser(): string {
        const currentUser = this.authService.getCurrentUser();
        return currentUser ? currentUser.userName : '';
    }

    // Force refresh users method for debugging
    forceRefreshUsers(): void {
        console.log('🔄 Force refreshing users...');
        this.loadUsers();
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

    // Diagnostic methods for debugging frontend issues
    runDiagnosticTest(): void {
        console.log('🔧 Running diagnostic test...');
        this.showDiagnosticResults = true;
        this.diagnosticResults = {
            timestamp: new Date().toISOString(),
            status: 'Running...',
            steps: []
        };

        // Step 1: Check authentication
        const currentUser = this.authService.getCurrentUser();
        this.diagnosticResults.steps.push({
            step: 'Authentication Check',
            status: currentUser ? '✅ Passed' : '❌ Failed',
            data: currentUser
        });

        // Step 2: Check admin privileges
        const isAdmin = this.adminService.isCurrentUserAdmin();
        this.diagnosticResults.steps.push({
            step: 'Admin Privileges Check',
            status: isAdmin ? '✅ Passed' : '❌ Failed',
            data: { isAdmin, userRoles: currentUser?.roles }
        });

        // Step 3: Check stored credentials
        const stored = localStorage.getItem('travner_auth');
        let credentials = null;
        if (stored) {
            try {
                credentials = JSON.parse(stored);
                this.diagnosticResults.steps.push({
                    step: 'Stored Credentials Check',
                    status: '✅ Found',
                    data: { username: credentials.username, hasPassword: !!credentials.password }
                });
            } catch (e) {
                this.diagnosticResults.steps.push({
                    step: 'Stored Credentials Check',
                    status: '❌ Invalid Format',
                    data: { error: e }
                });
            }
        } else {
            this.diagnosticResults.steps.push({
                step: 'Stored Credentials Check',
                status: '❌ Not Found',
                data: null
            });
        }

        // Step 4: Test API call
        this.diagnosticResults.steps.push({
            step: 'API Call Test',
            status: '🔄 Testing...',
            data: null
        });

        const apiTestIndex = this.diagnosticResults.steps.length - 1;

        const subscription = this.adminService.getAllUsers().subscribe({
            next: (users) => {
                console.log('🎯 Diagnostic API test - Success:', users);
                if (this.diagnosticResults) {
                    this.diagnosticResults.steps[apiTestIndex] = {
                        step: 'API Call Test',
                        status: '✅ Success',
                        data: {
                            usersCount: users?.length || 0,
                            firstUser: users?.[0] || null,
                            allUsers: users
                        }
                    };
                    this.diagnosticResults.status = 'Completed Successfully';

                    // Also test the component's loadUsers method
                    this.diagnosticResults.steps.push({
                        step: 'Component State After API',
                        status: '📊 Info',
                        data: {
                            componentUsersLength: this.users?.length || 0,
                            filteredUsersLength: this.filteredUsers?.length || 0,
                            isLoading: this.isLoading,
                            activeTab: this.activeTab
                        }
                    });
                }
            },
            error: (error) => {
                console.error('🎯 Diagnostic API test - Error:', error);
                if (this.diagnosticResults) {
                    this.diagnosticResults.steps[apiTestIndex] = {
                        step: 'API Call Test',
                        status: '❌ Failed',
                        data: {
                            errorMessage: error?.message || 'Unknown error',
                            errorStatus: error?.status,
                            fullError: error
                        }
                    };
                    this.diagnosticResults.status = 'Failed';
                }
            }
        });

        this.subscriptions.push(subscription);
    }

    closeDiagnosticResults(): void {
        this.showDiagnosticResults = false;
        this.diagnosticResults = null;
    }

    clearMessages(): void {
        this.errorMessage = '';
        this.successMessage = '';
    }
}