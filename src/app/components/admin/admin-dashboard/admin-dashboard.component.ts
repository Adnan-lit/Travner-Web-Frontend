import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, interval } from 'rxjs';
import { AdminService } from '../../../services/admin.service';
import { AuthService } from '../../../services/auth.service';
import { PostService } from '../../../services/post.service';
import { MarketplaceService } from '../../../services/marketplace.service';
import { User, SystemStats, AdminUser } from '../../../models/common.model';
import { ApiResponse, ApiListResponse } from '../../../models/api-response.model';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalPosts: number;
  postsWithMedia: number;
  postsWithInvalidMedia: number;
  totalOrders: number;
  pendingOrders: number;
  totalProducts: number;
  availableProducts: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  lastUpdate: string;
}

interface RecentActivity {
  id: string;
  type: 'user_registration' | 'post_created' | 'order_placed' | 'product_added' | 'admin_action';
  description: string;
  timestamp: string;
  user?: string;
  metadata?: any;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  isLoading = true;
  dashboardStats: DashboardStats = {
    totalUsers: 0,
    activeUsers: 0,
    totalPosts: 0,
    postsWithMedia: 0,
    postsWithInvalidMedia: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalProducts: 0,
    availableProducts: 0,
    systemHealth: 'healthy',
    lastUpdate: new Date().toISOString()
  };
  
  recentActivities: RecentActivity[] = [];
  systemAlerts: any[] = [];
  
  // Real-time updates
  private destroy$ = new Subject<void>();
  private refreshInterval$ = interval(30000); // Refresh every 30 seconds

  constructor(
    public authService: AuthService,
    private adminService: AdminService,
    private postService: PostService,
    private marketplaceService: MarketplaceService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        if (user && this.authService.isAdmin()) {
          this.loadDashboardData();
          this.startRealTimeUpdates();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDashboardData(): void {
    this.isLoading = true;
    
    // Load all dashboard data in parallel
    Promise.all([
      this.loadUserStats(),
      this.loadPostStats(),
      this.loadOrderStats(),
      this.loadProductStats(),
      this.loadRecentActivities(),
      this.loadSystemAlerts()
    ]).finally(() => {
      this.isLoading = false;
    });
  }

  private async loadUserStats(): Promise<void> {
    try {
      const response = await this.adminService.getUsers(0, 1).toPromise();
      if (response?.data) {
        this.dashboardStats.totalUsers = response.pagination?.totalElements || 0;
        // Mock active users calculation (in real app, this would come from backend)
        this.dashboardStats.activeUsers = Math.floor(this.dashboardStats.totalUsers * 0.7);
      }
    } catch (error: any) {
      console.error('Error loading user stats:', error);
      
      // Handle specific error cases
      if (error?.status === 401) {
        console.warn('User does not have admin privileges. Please use admin account.');
        // You might want to redirect to a different page or show a message
      } else if (error?.status === 500) {
        console.error('Server error when loading user stats. Admin endpoints may not be properly configured.');
      }
    }
  }

  private async loadPostStats(): Promise<void> {
    try {
      const response = await this.adminService.getPostStats().toPromise();
      if (response?.data) {
        const stats = response.data as any;
        this.dashboardStats.totalPosts = stats.totalPosts || 0;
        this.dashboardStats.postsWithMedia = stats.postsWithMedia || 0;
        this.dashboardStats.postsWithInvalidMedia = stats.postsWithInvalidMedia || 0;
      }
    } catch (error: any) {
      console.error('Error loading post stats:', error);
      
      // Handle specific error cases
      if (error?.status === 401) {
        console.warn('User does not have admin privileges for post stats. Please use admin account.');
      } else if (error?.status === 500) {
        console.error('Server error when loading post stats. Admin endpoints may not be properly configured.');
      }
    }
  }

  private async loadOrderStats(): Promise<void> {
    try {
      const response = await this.marketplaceService.getAllOrders().toPromise();
      if (response?.data) {
        const orders = response.data;
        this.dashboardStats.totalOrders = orders.length;
        this.dashboardStats.pendingOrders = orders.filter((order: any) => 
          order.status === 'PENDING' || order.status === 'PAID'
        ).length;
      }
    } catch (error) {
      console.error('Error loading order stats:', error);
    }
  }

  private async loadProductStats(): Promise<void> {
    try {
      const response = await this.marketplaceService.getProducts({ page: 0, size: 1 }).toPromise();
      if (response?.data) {
        this.dashboardStats.totalProducts = response.pagination?.totalElements || 0;
        // Mock available products (in real app, this would come from backend)
        this.dashboardStats.availableProducts = Math.floor(this.dashboardStats.totalProducts * 0.85);
      }
    } catch (error) {
      console.error('Error loading product stats:', error);
    }
  }

  private async loadRecentActivities(): Promise<void> {
    // Mock recent activities (in real app, this would come from backend)
    this.recentActivities = [
      {
        id: '1',
        type: 'user_registration',
        description: 'New user registered: john_doe',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        user: 'john_doe'
      },
      {
        id: '2',
        type: 'post_created',
        description: 'New post created: "Amazing trip to Japan"',
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        user: 'jane_traveler'
      },
      {
        id: '3',
        type: 'order_placed',
        description: 'New order placed: #ORD-12345',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        user: 'mike_explorer'
      },
      {
        id: '4',
        type: 'product_added',
        description: 'New product added: Travel Backpack',
        timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
        user: 'seller_pro'
      }
    ];
  }

  private async loadSystemAlerts(): Promise<void> {
    // Mock system alerts (in real app, this would come from backend)
    this.systemAlerts = [];
    
    if (this.dashboardStats.postsWithInvalidMedia > 0) {
      this.systemAlerts.push({
        id: '1',
        type: 'warning',
        title: 'Invalid Media URLs Detected',
        message: `${this.dashboardStats.postsWithInvalidMedia} posts have invalid media URLs`,
        action: 'cleanup_media'
      });
    }
    
    if (this.dashboardStats.pendingOrders > 10) {
      this.systemAlerts.push({
        id: '2',
        type: 'info',
        title: 'High Pending Orders',
        message: `${this.dashboardStats.pendingOrders} orders are pending processing`,
        action: 'view_orders'
      });
    }
  }

  private startRealTimeUpdates(): void {
    this.refreshInterval$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadDashboardData();
      });
  }

  refreshData(): void {
    this.loadDashboardData();
  }

  cleanupInvalidMedia(): void {
    this.adminService.cleanupInvalidMediaUrls().subscribe({
      next: (response) => {
        console.log('Media cleanup completed:', response);
        this.loadDashboardData(); // Refresh data
      },
      error: (error) => {
        console.error('Error during media cleanup:', error);
      }
    });
  }

  handleSystemAlert(alert: any): void {
    switch (alert.action) {
      case 'cleanup_media':
        this.cleanupInvalidMedia();
        break;
      case 'view_orders':
        // Navigate to orders page
        break;
      default:
        console.log('Unknown alert action:', alert.action);
    }
  }

  dismissAlert(alertId: string): void {
    this.systemAlerts = this.systemAlerts.filter(alert => alert.id !== alertId);
  }

  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else {
      const diffInHours = Math.floor(diffInMinutes / 60);
      return `${diffInHours}h ago`;
    }
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'user_registration': return 'fas fa-user-plus';
      case 'post_created': return 'fas fa-comment-plus';
      case 'order_placed': return 'fas fa-shopping-cart';
      case 'product_added': return 'fas fa-box';
      case 'admin_action': return 'fas fa-user-shield';
      default: return 'fas fa-info-circle';
    }
  }

  getActivityColor(type: string): string {
    switch (type) {
      case 'user_registration': return 'text-blue-500';
      case 'post_created': return 'text-green-500';
      case 'order_placed': return 'text-purple-500';
      case 'product_added': return 'text-orange-500';
      case 'admin_action': return 'text-red-500';
      default: return 'text-gray-500';
    }
  }

  getAlertIcon(type: string): string {
    switch (type) {
      case 'warning': return 'fas fa-exclamation-triangle';
      case 'error': return 'fas fa-exclamation-circle';
      case 'info': return 'fas fa-info-circle';
      case 'success': return 'fas fa-check-circle';
      default: return 'fas fa-bell';
    }
  }

  getAlertColor(type: string): string {
    switch (type) {
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  }

  goToSignin(): void {
    this.router.navigate(['/signin']);
  }
}
