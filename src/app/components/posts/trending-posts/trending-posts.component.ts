import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, interval, takeUntil } from 'rxjs';

export interface TrendingPost {
  id: string;
  title: string;
  author: string;
  authorAvatar?: string;
  likes: number;
  comments: number;
  views: number;
  trendingScore: number;
  tags: string[];
  thumbnail?: string;
  createdAt: string;
}

@Component({
  selector: 'app-trending-posts',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="trending-posts">
      <div class="trending-header">
        <h3 class="trending-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
          </svg>
          Trending Now
        </h3>
        <div class="trending-badge">
          <span class="fire-icon">🔥</span>
          <span>Hot</span>
        </div>
      </div>

      <div class="trending-list" *ngIf="trendingPosts.length > 0; else emptyState">
        <div class="trending-item" 
             *ngFor="let post of trendingPosts; let i = index; trackBy: trackByPost"
             [class.top-trending]="i < 3"
             [@slideIn]>
          <div class="trending-rank">
            <span class="rank-number" [class.top-three]="i < 3">{{ i + 1 }}</span>
            <div class="trending-indicator" [class.hot]="post.trendingScore > 80">
              <div class="trending-bar" [style.width.%]="post.trendingScore"></div>
            </div>
          </div>

          <div class="trending-content">
            <div class="trending-thumbnail" *ngIf="post.thumbnail">
              <img [src]="post.thumbnail" 
                   [alt]="post.title"
                   (error)="handleImageError($event)"
                   loading="lazy">
            </div>

            <div class="trending-info">
              <h4 class="trending-post-title">
                <a [routerLink]="['/community', post.id]">{{ post.title }}</a>
              </h4>
              
              <div class="trending-author">
                <div class="author-avatar">
                  <img *ngIf="post.authorAvatar" 
                       [src]="post.authorAvatar" 
                       [alt]="post.author"
                       (error)="handleAvatarError($event)">
                  <div *ngIf="!post.authorAvatar" class="avatar-placeholder">
                    {{ getInitials(post.author) }}
                  </div>
                </div>
                <span class="author-name">{{ post.author }}</span>
              </div>

              <div class="trending-stats">
                <div class="stat-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                  <span>{{ post.likes }}</span>
                </div>
                <div class="stat-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                  <span>{{ post.comments }}</span>
                </div>
                <div class="stat-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  <span>{{ formatViews(post.views) }}</span>
                </div>
              </div>

              <div class="trending-tags">
                <span class="tag" *ngFor="let tag of post.tags.slice(0, 2)">
                  #{{ tag }}
                </span>
                <span class="more-tags" *ngIf="post.tags.length > 2">
                  +{{ post.tags.length - 2 }}
                </span>
              </div>
            </div>
          </div>

          <div class="trending-score">
            <div class="score-circle" [class.hot]="post.trendingScore > 80">
              <span class="score-value">{{ post.trendingScore }}</span>
            </div>
          </div>
        </div>
      </div>

      <ng-template #emptyState>
        <div class="empty-trending">
          <div class="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
            </svg>
          </div>
          <p>No trending posts yet</p>
          <small>Posts will appear here as they gain popularity</small>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .trending-posts {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .trending-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
      color: white;
    }

    .trending-title {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .trending-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      background: rgba(255, 255, 255, 0.2);
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }

    .fire-icon {
      animation: flicker 1.5s infinite alternate;
    }

    @keyframes flicker {
      0% { opacity: 1; }
      100% { opacity: 0.7; }
    }

    .trending-list {
      max-height: 500px;
      overflow-y: auto;
    }

    .trending-item {
      display: flex;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #f0f0f0;
      transition: all 0.3s ease;
      animation: slideIn 0.5s ease-out;
    }

    .trending-item:hover {
      background: #f8f9fa;
    }

    .trending-item.top-trending {
      background: linear-gradient(135deg, #fff5f5 0%, #ffe8e8 100%);
      border-left: 4px solid #ff6b6b;
    }

    .trending-rank {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-right: 16px;
      min-width: 40px;
    }

    .rank-number {
      font-size: 18px;
      font-weight: 700;
      color: #666;
      margin-bottom: 4px;
    }

    .rank-number.top-three {
      color: #ff6b6b;
    }

    .trending-indicator {
      width: 30px;
      height: 4px;
      background: #e0e0e0;
      border-radius: 2px;
      overflow: hidden;
    }

    .trending-indicator.hot {
      background: #ff6b6b;
    }

    .trending-bar {
      height: 100%;
      background: linear-gradient(90deg, #ff6b6b 0%, #ee5a24 100%);
      border-radius: 2px;
      transition: width 0.3s ease;
    }

    .trending-content {
      display: flex;
      flex: 1;
      gap: 12px;
    }

    .trending-thumbnail {
      width: 60px;
      height: 60px;
      border-radius: 8px;
      overflow: hidden;
      flex-shrink: 0;
    }

    .trending-thumbnail img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .trending-info {
      flex: 1;
      min-width: 0;
    }

    .trending-post-title {
      margin: 0 0 8px 0;
      font-size: 14px;
      font-weight: 600;
      line-height: 1.4;
    }

    .trending-post-title a {
      color: #333;
      text-decoration: none;
      transition: color 0.3s ease;
    }

    .trending-post-title a:hover {
      color: #ff6b6b;
    }

    .trending-author {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .author-avatar {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      overflow: hidden;
      flex-shrink: 0;
    }

    .author-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-placeholder {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 10px;
    }

    .author-name {
      font-size: 12px;
      color: #666;
      font-weight: 500;
    }

    .trending-stats {
      display: flex;
      gap: 12px;
      margin-bottom: 8px;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      color: #666;
    }

    .stat-item svg {
      opacity: 0.7;
    }

    .trending-tags {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }

    .tag {
      font-size: 10px;
      color: #ff6b6b;
      background: rgba(255, 107, 107, 0.1);
      padding: 2px 6px;
      border-radius: 8px;
      font-weight: 500;
    }

    .more-tags {
      font-size: 10px;
      color: #999;
      font-style: italic;
    }

    .trending-score {
      margin-left: 12px;
    }

    .score-circle {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #f0f0f0;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    }

    .score-circle.hot {
      background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
    }

    .score-value {
      font-size: 12px;
      font-weight: 700;
    }

    .empty-trending {
      text-align: center;
      padding: 40px 20px;
      color: #666;
    }

    .empty-icon {
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .empty-trending p {
      margin: 0 0 8px 0;
      font-weight: 500;
    }

    .empty-trending small {
      font-size: 12px;
      opacity: 0.7;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(-20px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    /* Scrollbar styling */
    .trending-list::-webkit-scrollbar {
      width: 4px;
    }

    .trending-list::-webkit-scrollbar-track {
      background: #f1f1f1;
    }

    .trending-list::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 2px;
    }

    .trending-list::-webkit-scrollbar-thumb:hover {
      background: #a8a8a8;
    }
  `]
})
export class TrendingPostsComponent implements OnInit, OnDestroy {
  @Input() maxPosts = 10;
  @Input() refreshInterval = 60000; // 1 minute

  trendingPosts: TrendingPost[] = [];
  private destroy$ = new Subject<void>();

  constructor() {}

  ngOnInit(): void {
    this.loadTrendingPosts();
    this.startPeriodicUpdate();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadTrendingPosts(): void {
    // Mock trending posts - in real app, this would come from API
    this.trendingPosts = [
      {
        id: '1',
        title: 'Hidden gems in Tokyo that locals don\'t want you to know',
        author: 'Yuki Tanaka',
        authorAvatar: 'https://ui-avatars.com/api/?name=Yuki+Tanaka&background=random',
        likes: 1247,
        comments: 89,
        views: 15420,
        trendingScore: 95,
        tags: ['Tokyo', 'Japan', 'Hidden Gems'],
        thumbnail: 'https://picsum.photos/300/200?random=1',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        title: 'Best street food in Bangkok - Complete guide',
        author: 'Somchai Wong',
        authorAvatar: 'https://ui-avatars.com/api/?name=Somchai+Wong&background=random',
        likes: 892,
        comments: 156,
        views: 12300,
        trendingScore: 88,
        tags: ['Bangkok', 'Street Food', 'Thailand'],
        thumbnail: 'https://picsum.photos/300/200?random=2',
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '3',
        title: 'Santorini sunset spots that will blow your mind',
        author: 'Maria Papadopoulos',
        authorAvatar: 'https://ui-avatars.com/api/?name=Maria+Papadopoulos&background=random',
        likes: 2156,
        comments: 234,
        views: 28900,
        trendingScore: 92,
        tags: ['Santorini', 'Greece', 'Sunset'],
        thumbnail: 'https://picsum.photos/300/200?random=3',
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
      }
    ];
  }

  private startPeriodicUpdate(): void {
    interval(this.refreshInterval)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateTrendingScores();
      });
  }

  private updateTrendingScores(): void {
    // Simulate trending score updates
    this.trendingPosts.forEach(post => {
      const change = (Math.random() - 0.5) * 10;
      post.trendingScore = Math.max(0, Math.min(100, post.trendingScore + change));
      post.likes += Math.floor(Math.random() * 5);
      post.views += Math.floor(Math.random() * 20);
    });

    // Re-sort by trending score
    this.trendingPosts.sort((a, b) => b.trendingScore - a.trendingScore);
  }

  trackByPost(index: number, post: TrendingPost): string {
    return post.id;
  }

  formatViews(views: number): string {
    if (views >= 1000000) {
      return (views / 1000000).toFixed(1) + 'M';
    } else if (views >= 1000) {
      return (views / 1000).toFixed(1) + 'K';
    }
    return views.toString();
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  handleImageError(event: any): void {
    event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+PC9zdmc+';
  }

  handleAvatarError(event: any): void {
    event.target.style.display = 'none';
    event.target.nextElementSibling.style.display = 'flex';
  }
}

