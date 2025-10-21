import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil, interval } from 'rxjs';
import { AdminService } from '../../../services/admin.service';
import { AuthService } from '../../../services/auth.service';
import { MarketplaceService } from '../../../services/marketplace.service';

interface AnalyticsData {
  users: {
    total: number;
    active: number;
    newThisMonth: number;
    growth: number;
  };
  posts: {
    total: number;
    thisMonth: number;
    popularTags: Array<{ tag: string; count: number }>;
  };
  marketplace: {
    totalProducts: number;
    totalOrders: number;
    revenue: number;
    pendingOrders: number;
  };
  chat: {
    totalConversations: number;
    activeConversations: number;
    messagesToday: number;
  };
  system: {
    uptime: string;
    lastBackup: string;
    storageUsed: string;
    performance: 'excellent' | 'good' | 'fair' | 'poor';
  };
}

interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
    fill?: boolean;
  }>;
}

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="analytics-container">
      <div class="analytics-header">
        <h1>Analytics Dashboard</h1>
        <div class="refresh-controls">
          <button class="refresh-btn" (click)="refreshData()" [disabled]="isLoading">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
            </svg>
            Refresh
          </button>
          <div class="auto-refresh">
            <label>
              <input type="checkbox" [(ngModel)]="autoRefresh" (change)="toggleAutoRefresh()">
              Auto-refresh (30s)
            </label>
          </div>
        </div>
      </div>

      <!-- Key Metrics Cards -->
      <div class="metrics-grid">
        <div class="metric-card users">
          <div class="metric-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <div class="metric-content">
            <h3>Total Users</h3>
            <div class="metric-value">{{ analyticsData?.users?.total || 0 }}</div>
            <div class="metric-change" [class.positive]="(analyticsData?.users?.growth || 0) > 0">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                <polyline points="17 6 23 6 23 12"></polyline>
              </svg>
              {{ analyticsData?.users?.growth || 0 }}% this month
            </div>
          </div>
        </div>

        <div class="metric-card posts">
          <div class="metric-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14,2 14,8 20,8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10,9 9,9 8,9"></polyline>
            </svg>
          </div>
          <div class="metric-content">
            <h3>Total Posts</h3>
            <div class="metric-value">{{ analyticsData?.posts?.total || 0 }}</div>
            <div class="metric-change positive">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                <polyline points="17 6 23 6 23 12"></polyline>
              </svg>
              {{ analyticsData?.posts?.thisMonth || 0 }} this month
            </div>
          </div>
        </div>

        <div class="metric-card orders">
          <div class="metric-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
          </div>
          <div class="metric-content">
            <h3>Total Orders</h3>
            <div class="metric-value">{{ analyticsData?.marketplace?.totalOrders || 0 }}</div>
            <div class="metric-change" [class.warning]="(analyticsData?.marketplace?.pendingOrders || 0) > 0">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              {{ analyticsData?.marketplace?.pendingOrders || 0 }} pending
            </div>
          </div>
        </div>

        <div class="metric-card revenue">
          <div class="metric-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <div class="metric-content">
            <h3>Revenue</h3>
            <div class="metric-value">{{ formatCurrency(analyticsData?.marketplace?.revenue || 0) }}</div>
            <div class="metric-change positive">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                <polyline points="17 6 23 6 23 12"></polyline>
              </svg>
              This month
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="charts-section">
        <div class="chart-container">
          <h3>User Growth</h3>
          <div class="chart-placeholder">
            <div class="chart-mock">
              <div class="chart-bars">
                <div class="bar" style="height: 60%"></div>
                <div class="bar" style="height: 75%"></div>
                <div class="bar" style="height: 85%"></div>
                <div class="bar" style="height: 90%"></div>
                <div class="bar" style="height: 100%"></div>
                <div class="bar" style="height: 95%"></div>
                <div class="bar" style="height: 110%"></div>
              </div>
              <div class="chart-labels">
                <span>Jan</span>
                <span>Feb</span>
                <span>Mar</span>
                <span>Apr</span>
                <span>May</span>
                <span>Jun</span>
                <span>Jul</span>
              </div>
            </div>
          </div>
        </div>

        <div class="chart-container">
          <h3>Popular Tags</h3>
          <div class="tags-list">
            <div *ngFor="let tag of analyticsData?.posts?.popularTags" class="tag-item">
              <span class="tag-name">{{ tag.tag }}</span>
              <span class="tag-count">{{ tag.count }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- System Health -->
      <div class="system-health">
        <h3>System Health</h3>
        <div class="health-metrics">
          <div class="health-item">
            <span class="health-label">Performance</span>
            <div class="health-status" [ngClass]="analyticsData?.system?.performance">
              {{ analyticsData?.system?.performance || 'Unknown' }}
            </div>
          </div>
          <div class="health-item">
            <span class="health-label">Uptime</span>
            <span class="health-value">{{ analyticsData?.system?.uptime || 'Unknown' }}</span>
          </div>
          <div class="health-item">
            <span class="health-label">Last Backup</span>
            <span class="health-value">{{ analyticsData?.system?.lastBackup || 'Unknown' }}</span>
          </div>
          <div class="health-item">
            <span class="health-label">Storage Used</span>
            <span class="health-value">{{ analyticsData?.system?.storageUsed || 'Unknown' }}</span>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <h3>Quick Actions</h3>
        <div class="actions-grid">
          <button class="action-btn" (click)="exportData()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7,10 12,15 17,10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Export Data
          </button>
          <button class="action-btn" (click)="runSystemCheck()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 11 12 14 22 4"></polyline>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
            </svg>
            System Check
          </button>
          <button class="action-btn" (click)="cleanupData()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3,6 5,6 21,6"></polyline>
              <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
            </svg>
            Cleanup Data
          </button>
          <button class="action-btn" (click)="backupSystem()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27,6.96 12,12.01 20.73,6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
            Backup System
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-overlay" *ngIf="isLoading">
        <div class="loading-content">
          <div class="spinner"></div>
          <p>Loading analytics data...</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .analytics-container {
      padding: 0;
      max-width: 1200px;
      margin: 0 auto;
    }

    .analytics-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #e9ecef;
    }

    .analytics-header h1 {
      margin: 0;
      color: #333;
      font-size: 2rem;
      font-weight: 700;
    }

    .refresh-controls {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .refresh-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: background-color 0.2s;
    }

    .refresh-btn:hover:not(:disabled) {
      background: #0056b3;
    }

    .refresh-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .auto-refresh {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      color: #666;
    }

    .auto-refresh input[type="checkbox"] {
      margin: 0;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .metric-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      gap: 1rem;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .metric-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    }

    .metric-card.users {
      border-left: 4px solid #007bff;
    }

    .metric-card.posts {
      border-left: 4px solid #28a745;
    }

    .metric-card.orders {
      border-left: 4px solid #ffc107;
    }

    .metric-card.revenue {
      border-left: 4px solid #dc3545;
    }

    .metric-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #f8f9fa;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #666;
      flex-shrink: 0;
    }

    .metric-card.users .metric-icon {
      background: #e3f2fd;
      color: #007bff;
    }

    .metric-card.posts .metric-icon {
      background: #e8f5e8;
      color: #28a745;
    }

    .metric-card.orders .metric-icon {
      background: #fff3cd;
      color: #ffc107;
    }

    .metric-card.revenue .metric-icon {
      background: #f8d7da;
      color: #dc3545;
    }

    .metric-content {
      flex: 1;
    }

    .metric-content h3 {
      margin: 0 0 0.5rem 0;
      color: #666;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .metric-value {
      font-size: 2rem;
      font-weight: 700;
      color: #333;
      margin-bottom: 0.5rem;
    }

    .metric-change {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.85rem;
      color: #666;
    }

    .metric-change.positive {
      color: #28a745;
    }

    .metric-change.warning {
      color: #ffc107;
    }

    .charts-section {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .chart-container {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    .chart-container h3 {
      margin: 0 0 1rem 0;
      color: #333;
      font-size: 1.2rem;
      font-weight: 600;
    }

    .chart-placeholder {
      height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .chart-mock {
      width: 100%;
      height: 100%;
    }

    .chart-bars {
      display: flex;
      align-items: end;
      justify-content: space-around;
      height: 150px;
      margin-bottom: 1rem;
    }

    .bar {
      width: 30px;
      background: linear-gradient(to top, #007bff, #0056b3);
      border-radius: 4px 4px 0 0;
      animation: growUp 1s ease-out;
    }

    @keyframes growUp {
      from { height: 0; }
      to { height: var(--target-height); }
    }

    .chart-labels {
      display: flex;
      justify-content: space-around;
      font-size: 0.8rem;
      color: #666;
    }

    .tags-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .tag-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem;
      background: #f8f9fa;
      border-radius: 6px;
    }

    .tag-name {
      font-weight: 500;
      color: #333;
    }

    .tag-count {
      background: #007bff;
      color: white;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .system-health {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      margin-bottom: 2rem;
    }

    .system-health h3 {
      margin: 0 0 1rem 0;
      color: #333;
      font-size: 1.2rem;
      font-weight: 600;
    }

    .health-metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .health-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      background: #f8f9fa;
      border-radius: 6px;
    }

    .health-label {
      font-weight: 500;
      color: #666;
    }

    .health-value {
      font-weight: 600;
      color: #333;
    }

    .health-status {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .health-status.excellent {
      background: #d4edda;
      color: #155724;
    }

    .health-status.good {
      background: #d1ecf1;
      color: #0c5460;
    }

    .health-status.fair {
      background: #fff3cd;
      color: #856404;
    }

    .health-status.poor {
      background: #f8d7da;
      color: #721c24;
    }

    .quick-actions {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    .quick-actions h3 {
      margin: 0 0 1rem 0;
      color: #333;
      font-size: 1.2rem;
      font-weight: 600;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.9rem;
      color: #333;
      transition: all 0.2s;
    }

    .action-btn:hover {
      background: #e9ecef;
      border-color: #007bff;
      color: #007bff;
    }

    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .loading-content {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      text-align: center;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #007bff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .analytics-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .refresh-controls {
        width: 100%;
        justify-content: space-between;
      }

      .metrics-grid {
        grid-template-columns: 1fr;
      }

      .charts-section {
        grid-template-columns: 1fr;
      }

      .health-metrics {
        grid-template-columns: 1fr;
      }

      .actions-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AdminAnalyticsComponent implements OnInit, OnDestroy {
  analyticsData: AnalyticsData | null = null;
  isLoading = false;
  autoRefresh = false;
  
  private destroy$ = new Subject<void>();
  private refreshInterval$ = interval(30000);

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private marketplaceService: MarketplaceService
  ) {}

  ngOnInit(): void {
    this.loadAnalyticsData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAnalyticsData(): void {
    this.isLoading = true;
    
    // Simulate loading analytics data
    setTimeout(() => {
      this.analyticsData = {
        users: {
          total: 1250,
          active: 890,
          newThisMonth: 45,
          growth: 12.5
        },
        posts: {
          total: 3420,
          thisMonth: 156,
          popularTags: [
            { tag: 'travel', count: 234 },
            { tag: 'bangladesh', count: 189 },
            { tag: 'adventure', count: 156 },
            { tag: 'food', count: 134 },
            { tag: 'culture', count: 98 }
          ]
        },
        marketplace: {
          totalProducts: 89,
          totalOrders: 234,
          revenue: 45600,
          pendingOrders: 12
        },
        chat: {
          totalConversations: 567,
          activeConversations: 89,
          messagesToday: 2340
        },
        system: {
          uptime: '99.9%',
          lastBackup: '2 hours ago',
          storageUsed: '2.3 GB / 10 GB',
          performance: 'excellent'
        }
      };
      this.isLoading = false;
    }, 1000);
  }

  refreshData(): void {
    this.loadAnalyticsData();
  }

  toggleAutoRefresh(): void {
    if (this.autoRefresh) {
      this.refreshInterval$
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.refreshData();
        });
    } else {
      this.destroy$.next();
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT'
    }).format(amount);
  }

  exportData(): void {
    // Implement data export functionality
    console.log('Exporting analytics data...');
  }

  runSystemCheck(): void {
    // Implement system check functionality
    console.log('Running system check...');
  }

  cleanupData(): void {
    // Implement data cleanup functionality
    console.log('Cleaning up old data...');
  }

  backupSystem(): void {
    // Implement system backup functionality
    console.log('Creating system backup...');
  }
}
