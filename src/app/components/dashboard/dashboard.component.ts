import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PostService } from '../../services/post.service';
import { MarketplaceService } from '../../services/marketplace.service';
import { User, Post } from '../../models/common.model';
import { ApiListResponse } from '../../models/api-response.model';
import { Subject, takeUntil } from 'rxjs';

interface UserStats {
  posts: number;
  followers: number;
  trips: number;
  likes: number;
  comments: number;
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  isLoading = true;
  recentPosts: Post[] = [];
  userStats: UserStats = {
    posts: 0,
    followers: 0,
    trips: 0,
    likes: 0,
    comments: 0
  };

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private postService: PostService,
    private marketplaceService: MarketplaceService
  ) { }

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        if (user) {
          this.loadUserData();
        } else {
          this.isLoading = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUserData(): void {
    if (!this.currentUser) return;

    // Load recent community posts
    this.postService.getPosts(0, 5).subscribe({
      next: (response: ApiListResponse<Post>) => {
        this.recentPosts = response.data || [];
      },
      error: (error: any) => {
        console.error('Error loading recent posts:', error);
        this.recentPosts = [];
      }
    });

    // Load user's posts for stats
    this.postService.getUserPosts(this.currentUser.userName, 0, 1).subscribe({
      next: (response: ApiListResponse<Post>) => {
        this.userStats.posts = response.pagination?.totalElements || 0;
      },
      error: (error: any) => {
        console.error('Error loading user posts:', error);
      }
    });

    // Mock data for demonstration - in real app, these would come from API
    this.userStats = {
      posts: Math.floor(Math.random() * 50) + 5,
      followers: Math.floor(Math.random() * 200) + 20,
      trips: Math.floor(Math.random() * 15) + 2,
      likes: Math.floor(Math.random() * 500) + 50,
      comments: Math.floor(Math.random() * 100) + 10
    };

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