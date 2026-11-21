import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs/operators';
import { AdminService } from '../../../services/admin.service';
import { ApiResponse } from '../../../models/api-response.model';

interface SystemHealth {
  status: string;
  database: boolean;
  storage: boolean;
  cache: boolean;
  uptime: number;
  version: string;
}

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-settings.component.html',
  styleUrls: ['./admin-settings.component.css'],
})
export class AdminSettingsComponent implements OnInit {
  health: SystemHealth | null = null;
  loadingHealth = false;
  clearingCache = false;
  errorMessage = '';
  successMessage = '';

  constructor(private readonly adminService: AdminService) {}

  ngOnInit(): void {
    this.loadHealth();
  }

  loadHealth(): void {
    this.loadingHealth = true;
    this.errorMessage = '';
    this.adminService
      .getSystemHealth()
      .pipe(
        finalize(() => {
          this.loadingHealth = false;
        }),
      )
      .subscribe({
        next: (response: ApiResponse<SystemHealth>) => {
          this.health = response.data ?? null;
          if (!response.data) {
            this.errorMessage = 'System health is currently unavailable.';
          }
        },
        error: () => {
          this.health = null;
          this.errorMessage = 'Could not load system health. Please try again.';
        },
      });
  }

  clearCache(): void {
    this.clearingCache = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.adminService
      .clearCache()
      .pipe(
        finalize(() => {
          this.clearingCache = false;
        }),
      )
      .subscribe({
        next: (response: ApiResponse<{ message: string }>) => {
          this.successMessage = 'Cache cleared';
          this.loadHealth();
        },
        error: () => {
          this.errorMessage = 'Could not clear the cache. Please try again.';
        },
      });
  }

  formatUptime(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds < 0) {
      return 'Unavailable';
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }
}
