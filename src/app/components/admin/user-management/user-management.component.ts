import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { AdminService } from '../../../services/admin.service';
import { AuthService } from '../../../services/auth.service';
import { User, AdminUser } from '../../../models/common.model';
import { ApiResponse, ApiListResponse } from '../../../models/api-response.model';

interface UserFilters {
  search: string;
  role: string;
  status: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  adminUsers: number;
  bannedUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  users: AdminUser[] = [];
  userStats: UserStats = {
    totalUsers: 0,
    activeUsers: 0,
    adminUsers: 0,
    bannedUsers: 0,
    newUsersToday: 0,
    newUsersThisWeek: 0
  };
  
  filters: UserFilters = {
    search: '',
    role: '',
    status: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  };
  
  pagination = {
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0
  };
  
  isLoading = false;
  selectedUsers: Set<string> = new Set();
  showBulkActions = false;
  
  // Modal states
  showUserModal = false;
  showDeleteModal = false;
  selectedUser: AdminUser | null = null;
  
  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();

  constructor(
    private adminService: AdminService,
    private authService: AuthService
  ) {
    // Debounce search input
    this.searchSubject$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => {
        this.filters.search = searchTerm;
        this.loadUsers();
      });
  }

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        if (user && this.authService.isAdmin()) {
          this.loadUsers();
          this.loadUserStats();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUsers(): void {
    this.isLoading = true;
    
    this.adminService.getUsers(
      this.pagination.page,
      this.pagination.size,
      this.filters.search,
      this.filters.role
    ).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response: ApiListResponse<AdminUser>) => {
        this.users = response.data || [];
        this.pagination.totalElements = response.pagination?.totalElements || 0;
        this.pagination.totalPages = response.pagination?.totalPages || 0;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.isLoading = false;
      }
    });
  }

  loadUserStats(): void {
    // Mock user stats (in real app, this would come from backend)
    this.userStats = {
      totalUsers: this.pagination.totalElements,
      activeUsers: Math.floor(this.pagination.totalElements * 0.85),
      adminUsers: Math.floor(this.pagination.totalElements * 0.02),
      bannedUsers: Math.floor(this.pagination.totalElements * 0.01),
      newUsersToday: Math.floor(Math.random() * 10),
      newUsersThisWeek: Math.floor(Math.random() * 50)
    };
  }

  onSearchChange(searchTerm: string): void {
    this.searchSubject$.next(searchTerm);
  }

  onFilterChange(): void {
    this.pagination.page = 0; // Reset to first page
    this.loadUsers();
  }

  onSortChange(): void {
    this.loadUsers();
  }

  onPageChange(page: number): void {
    this.pagination.page = page;
    this.loadUsers();
  }

  onPageSizeChange(size: string | number): void {
    this.pagination.size = typeof size === 'string' ? parseInt(size, 10) : size;
    this.pagination.page = 0;
    this.loadUsers();
  }

  toggleUserSelection(userId: string): void {
    if (this.selectedUsers.has(userId)) {
      this.selectedUsers.delete(userId);
    } else {
      this.selectedUsers.add(userId);
    }
    this.showBulkActions = this.selectedUsers.size > 0;
  }

  selectAllUsers(): void {
    if (this.selectedUsers.size === this.users.length) {
      this.selectedUsers.clear();
    } else {
      this.selectedUsers.clear();
      this.users.forEach(user => this.selectedUsers.add(user.id));
    }
    this.showBulkActions = this.selectedUsers.size > 0;
  }

  viewUser(user: AdminUser): void {
    this.selectedUser = user;
    this.showUserModal = true;
  }

  editUser(user: AdminUser): void {
    // Navigate to user edit page or open edit modal
    console.log('Edit user:', user);
  }

  deleteUser(user: AdminUser): void {
    this.selectedUser = user;
    this.showDeleteModal = true;
  }

  confirmDeleteUser(): void {
    if (!this.selectedUser) return;
    
    this.adminService.deleteUser(this.selectedUser.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('User deleted:', response);
          this.loadUsers();
          this.loadUserStats();
          this.showDeleteModal = false;
          this.selectedUser = null;
        },
        error: (error) => {
          console.error('Error deleting user:', error);
        }
      });
  }

  bulkAction(action: string): void {
    const userIds = Array.from(this.selectedUsers);
    
    switch (action) {
      case 'delete':
        // Implement bulk delete
        console.log('Bulk delete users:', userIds);
        break;
      case 'ban':
        // Implement bulk ban
        console.log('Bulk ban users:', userIds);
        break;
      case 'activate':
        // Implement bulk activate
        console.log('Bulk activate users:', userIds);
        break;
      default:
        console.log('Unknown bulk action:', action);
    }
    
    // Clear selection after action
    this.selectedUsers.clear();
    this.showBulkActions = false;
  }

  exportUsers(): void {
    // Implement user export functionality
    console.log('Export users');
  }

  getRoleBadgeClass(role: string): string {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'badge-danger';
      case 'user':
        return 'badge-primary';
      case 'moderator':
        return 'badge-warning';
      default:
        return 'badge-secondary';
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'badge-success';
      case 'inactive':
        return 'badge-warning';
      case 'banned':
        return 'badge-danger';
      case 'pending':
        return 'badge-info';
      default:
        return 'badge-secondary';
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getInitials(firstName: string, lastName: string): string {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  }

  closeModal(): void {
    this.showUserModal = false;
    this.showDeleteModal = false;
    this.selectedUser = null;
  }

  getPaginationInfo(): string {
    const start = this.pagination.page * this.pagination.size + 1;
    const end = Math.min((this.pagination.page + 1) * this.pagination.size, this.pagination.totalElements);
    return `${start}-${end} of ${this.pagination.totalElements}`;
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const totalPages = this.pagination.totalPages;
    const currentPage = this.pagination.page;
    
    // Always show first page
    if (totalPages > 0) {
      pages.push(0);
    }
    
    // Show pages around current page
    for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages - 1, currentPage + 2); i++) {
      if (!pages.includes(i)) {
        pages.push(i);
      }
    }
    
    // Always show last page
    if (totalPages > 1 && !pages.includes(totalPages - 1)) {
      pages.push(totalPages - 1);
    }
    
    return pages;
  }
}
