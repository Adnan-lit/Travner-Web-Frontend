import { logger } from '../../core/logging/logger';
import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PostService } from '../../services/post.service';
import { MarketplaceService } from '../../services/marketplace.service';
import { User, Post } from '../../models/common.model';
import { ApiListResponse } from '../../models/api-response.model';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface UserStats {
  posts: number;
  followers: number;
  trips: number;
  likes: number;
  comments: number;
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterModule, NgOptimizedImage],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  isLoading = true;
  recentPosts: Post[] = [];
  userStats: UserStats = {
    posts: 0,
    followers: 0,
    trips: 0,
    likes: 0,
    comments: 0,
  };

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private authService: AuthService,
    private postService: PostService,
    private marketplaceService: MarketplaceService,
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((user) => {
      this.currentUser = user;
      if (user) {
        this.loadUserData();
      } else {
        this.isLoading = false;
      }
    });
  }

  loadUserData(): void {
    if (!this.currentUser) return;

    // Load recent community posts
    this.postService.getPosts(0, 5).subscribe({
      next: (response: ApiListResponse<Post>) => {
        this.recentPosts = response.data || [];
      },
      error: (error: any) => {
        logger.error('Error loading recent posts:', error);
        this.recentPosts = [];
      },
    });

    // Load user's posts for stats
    this.postService.getUserPosts(this.currentUser.userName, 0, 1).subscribe({
      next: (response: ApiListResponse<Post>) => {
        this.userStats.posts = response.pagination?.totalElements || 0;
      },
      error: (error: any) => {
        logger.error('Error loading user posts:', error);
        // Set fallback value on error
        this.userStats.posts = 0;
      },
    });

    // Mock data for demonstration - in real app, these would come from API
    // Only set mock data for stats not loaded from API
    this.userStats.followers = Math.floor(Math.random() * 200) + 20;
    this.userStats.trips = Math.floor(Math.random() * 15) + 2;
    this.userStats.likes = Math.floor(Math.random() * 500) + 50;
    this.userStats.comments = Math.floor(Math.random() * 100) + 10;

    this.isLoading = false;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  logout(): void {
    this.authService.logout();
  }
}
