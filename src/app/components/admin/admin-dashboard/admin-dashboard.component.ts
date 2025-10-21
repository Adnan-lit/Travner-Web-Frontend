import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';

interface DashboardStats {
  users: {
    total: number;
    active: number;
    newThisWeek: number;
  };
  content: {
    posts: number;
    comments: number;
    itineraries: number;
    travelBuddies: number;
  };
  engagement: {
    votes: number;
    chatMessages: number;
  };
  marketplace: {
    products: number;
    orders: number;
    revenue: number;
  };
}

interface User {
  id: string;
  userName: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
  active: boolean;
  createdAt: string;
  lastLogin: string;
}

interface SystemHealth {
  database: {
    connected: boolean;
    status: string;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  system: {
    uptime: number;
    javaVersion: string;
    osName: string;
    osVersion: string;
  };
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  loading = false;
  dashboardStats: DashboardStats | null = null;
  systemHealth: SystemHealth | null = null;
  users: User[] = [];
  filteredUsers: User[] = [];
  userSearch = '';
  selectedRole = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadDashboardData();
    this.loadUsers();
    this.loadSystemHealth();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboardData(): void {
    this.loading = true;
    this.http.get<any>('/api/admin/dashboard')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dashboardStats = response.data;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading dashboard data:', error);
          this.loading = false;
        }
      });
  }

  loadUsers(): void {
    this.http.get<any>('/api/admin/users')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.users = response.data.content;
          this.filterUsers();
        },
        error: (error) => {
          console.error('Error loading users:', error);
        }
      });
  }

  loadSystemHealth(): void {
    this.http.get<any>('/api/admin/health')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.systemHealth = response.data;
        },
        error: (error) => {
          console.error('Error loading system health:', error);
        }
      });
  }

  refreshData(): void {
    this.loadDashboardData();
    this.loadUsers();
    this.loadSystemHealth();
  }

  filterUsers(): void {
    this.filteredUsers = this.users.filter(user => {
      const matchesSearch = !this.userSearch || 
        user.userName.toLowerCase().includes(this.userSearch.toLowerCase()) ||
        user.firstName?.toLowerCase().includes(this.userSearch.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(this.userSearch.toLowerCase()) ||
        user.email?.toLowerCase().includes(this.userSearch.toLowerCase());
      
      const matchesRole = !this.selectedRole || user.roles?.includes(this.selectedRole);
      
      return matchesSearch && matchesRole;
    });
  }

  activateUser(username: string): void {
    this.loading = true;
    this.http.put<any>(`/api/admin/users/${username}/activate`, {})
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadUsers();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error activating user:', error);
          this.loading = false;
        }
      });
  }

  deactivateUser(username: string): void {
    this.loading = true;
    this.http.put<any>(`/api/admin/users/${username}/deactivate`, {})
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadUsers();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error deactivating user:', error);
          this.loading = false;
        }
      });
  }

  deleteUser(username: string): void {
    if (confirm(`Are you sure you want to delete user ${username}?`)) {
      this.loading = true;
      this.http.delete<any>(`/api/admin/users/${username}`)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadUsers();
            this.loading = false;
          },
          error: (error) => {
            console.error('Error deleting user:', error);
            this.loading = false;
          }
        });
    }
  }

  cleanupMediaUrls(): void {
    this.loading = true;
    this.http.post<any>('/api/admin/cleanup/media-urls', {})
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          alert(response.message);
          this.loading = false;
        },
        error: (error) => {
          console.error('Error cleaning up media URLs:', error);
          this.loading = false;
        }
      });
  }

  exportUserData(): void {
    // Implementation for data export
    alert('Data export feature coming soon!');
  }

  viewSystemLogs(): void {
    // Implementation for viewing system logs
    alert('System logs feature coming soon!');
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  formatUptime(uptime: number | undefined): string {
    if (!uptime) return 'Unknown';
    
    const seconds = Math.floor(uptime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }
}