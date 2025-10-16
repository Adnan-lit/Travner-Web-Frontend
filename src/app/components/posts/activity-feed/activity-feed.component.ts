import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, interval, takeUntil } from 'rxjs';

export interface Activity {
  id: string;
  type: 'post_created' | 'post_liked' | 'comment_added' | 'user_joined';
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  timestamp: string;
  postId?: string;
  postTitle?: string;
}

@Component({
  selector: 'app-activity-feed',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="activity-feed">
      <div class="activity-header">
        <h3 class="activity-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
          </svg>
          Live Activity
        </h3>
        <div class="activity-indicator" [class.active]="isLive">
          <div class="pulse-dot"></div>
          <span>{{ isLive ? 'Live' : 'Offline' }}</span>
        </div>
      </div>

      <div class="activity-list" *ngIf="activities.length > 0; else emptyState">
        <div class="activity-item" 
             *ngFor="let activity of activities; trackBy: trackByActivity"
             [class.new]="isNewActivity(activity)"
             [@slideIn]>
          <div class="activity-avatar">
            <img *ngIf="activity.user.avatar" 
                 [src]="activity.user.avatar" 
                 [alt]="activity.user.name"
                 (error)="handleAvatarError($event)">
            <div *ngIf="!activity.user.avatar" class="avatar-placeholder">
              {{ getInitials(activity.user.name) }}
            </div>
          </div>

          <div class="activity-content">
            <div class="activity-text">
              <span class="user-name">{{ activity.user.name }}</span>
              <span class="activity-action">{{ getActivityText(activity) }}</span>
              <span class="activity-target" *ngIf="activity.postTitle">
                "{{ activity.postTitle }}"
              </span>
            </div>
            <div class="activity-meta">
              <span class="activity-time">{{ formatTime(activity.timestamp) }}</span>
              <span class="activity-type">{{ getActivityTypeLabel(activity.type) }}</span>
            </div>
          </div>

          <div class="activity-actions" *ngIf="activity.postId">
            <a [routerLink]="['/community', activity.postId]" 
               class="view-post-btn"
               title="View Post">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </a>
          </div>
        </div>
      </div>

      <ng-template #emptyState>
        <div class="empty-activity">
          <div class="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
            </svg>
          </div>
          <p>No recent activity</p>
          <small>Activity will appear here as users interact with the community</small>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .activity-feed {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .activity-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .activity-title {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .activity-indicator {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      opacity: 0.8;
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      background: #ff6b6b;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }

    .activity-indicator.active .pulse-dot {
      background: #51cf66;
    }

    @keyframes pulse {
      0% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.1); }
      100% { opacity: 1; transform: scale(1); }
    }

    .activity-list {
      max-height: 400px;
      overflow-y: auto;
    }

    .activity-item {
      display: flex;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #f0f0f0;
      transition: all 0.3s ease;
      animation: slideIn 0.5s ease-out;
    }

    .activity-item:hover {
      background: #f8f9fa;
    }

    .activity-item.new {
      background: #e3f2fd;
      border-left: 4px solid #2196f3;
    }

    .activity-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      overflow: hidden;
      margin-right: 12px;
      flex-shrink: 0;
    }

    .activity-avatar img {
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
      font-size: 14px;
    }

    .activity-content {
      flex: 1;
      min-width: 0;
    }

    .activity-text {
      margin-bottom: 4px;
      line-height: 1.4;
    }

    .user-name {
      font-weight: 600;
      color: #333;
    }

    .activity-action {
      color: #666;
      margin: 0 4px;
    }

    .activity-target {
      color: #2196f3;
      font-style: italic;
    }

    .activity-meta {
      display: flex;
      gap: 12px;
      font-size: 12px;
      color: #999;
    }

    .activity-actions {
      margin-left: 12px;
    }

    .view-post-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #f0f0f0;
      color: #666;
      text-decoration: none;
      transition: all 0.3s ease;
    }

    .view-post-btn:hover {
      background: #2196f3;
      color: white;
      transform: scale(1.1);
    }

    .empty-activity {
      text-align: center;
      padding: 40px 20px;
      color: #666;
    }

    .empty-icon {
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .empty-activity p {
      margin: 0 0 8px 0;
      font-weight: 500;
    }

    .empty-activity small {
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
    .activity-list::-webkit-scrollbar {
      width: 4px;
    }

    .activity-list::-webkit-scrollbar-track {
      background: #f1f1f1;
    }

    .activity-list::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 2px;
    }

    .activity-list::-webkit-scrollbar-thumb:hover {
      background: #a8a8a8;
    }
  `]
})
export class ActivityFeedComponent implements OnInit, OnDestroy {
  @Input() maxActivities = 10;
  @Input() refreshInterval = 30000; // 30 seconds

  activities: Activity[] = [];
  isLive = false;
  private destroy$ = new Subject<void>();

  constructor() {}

  ngOnInit(): void {
    this.loadInitialActivities();
    this.startLiveUpdates();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadInitialActivities(): void {
    // Mock initial activities - in real app, this would come from API
    this.activities = [
      {
        id: '1',
        type: 'post_created',
        user: { id: '1', name: 'John Doe', avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=random' },
        content: 'created a new post',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        postId: 'post-1',
        postTitle: 'Amazing sunset in Santorini'
      },
      {
        id: '2',
        type: 'post_liked',
        user: { id: '2', name: 'Jane Smith', avatar: 'https://ui-avatars.com/api/?name=Jane+Smith&background=random' },
        content: 'liked a post',
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        postId: 'post-2',
        postTitle: 'Hidden gems in Tokyo'
      },
      {
        id: '3',
        type: 'comment_added',
        user: { id: '3', name: 'Mike Johnson', avatar: 'https://ui-avatars.com/api/?name=Mike+Johnson&background=random' },
        content: 'commented on a post',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        postId: 'post-3',
        postTitle: 'Best restaurants in Paris'
      }
    ];
    this.isLive = true;
  }

  private startLiveUpdates(): void {
    interval(this.refreshInterval)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.simulateNewActivity();
      });
  }

  private simulateNewActivity(): void {
    // In a real app, this would fetch from API
    const newActivity: Activity = {
      id: Date.now().toString(),
      type: this.getRandomActivityType(),
      user: {
        id: Math.random().toString(),
        name: this.getRandomName(),
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(this.getRandomName())}&background=random`
      },
      content: this.getActivityContent(this.getRandomActivityType()),
      timestamp: new Date().toISOString(),
      postId: `post-${Math.floor(Math.random() * 100)}`,
      postTitle: this.getRandomPostTitle()
    };

    this.activities.unshift(newActivity);
    if (this.activities.length > this.maxActivities) {
      this.activities = this.activities.slice(0, this.maxActivities);
    }
  }

  private getRandomActivityType(): Activity['type'] {
    const types: Activity['type'][] = ['post_created', 'post_liked', 'comment_added', 'user_joined'];
    return types[Math.floor(Math.random() * types.length)];
  }

  private getRandomName(): string {
    const names = ['Alex Chen', 'Sarah Wilson', 'David Brown', 'Emma Davis', 'Chris Taylor', 'Lisa Anderson'];
    return names[Math.floor(Math.random() * names.length)];
  }

  private getRandomPostTitle(): string {
    const titles = [
      'Beautiful sunrise in Bali',
      'Street food adventure in Bangkok',
      'Mountain hiking in Switzerland',
      'Beach day in Maldives',
      'Cultural tour in Rome'
    ];
    return titles[Math.floor(Math.random() * titles.length)];
  }

  private getActivityContent(type: Activity['type']): string {
    switch (type) {
      case 'post_created': return 'created a new post';
      case 'post_liked': return 'liked a post';
      case 'comment_added': return 'commented on a post';
      case 'user_joined': return 'joined the community';
      default: return 'performed an action';
    }
  }

  trackByActivity(index: number, activity: Activity): string {
    return activity.id;
  }

  isNewActivity(activity: Activity): boolean {
    const now = new Date();
    const activityTime = new Date(activity.timestamp);
    const diffMinutes = (now.getTime() - activityTime.getTime()) / (1000 * 60);
    return diffMinutes < 5; // Consider activities newer than 5 minutes as "new"
  }

  getActivityText(activity: Activity): string {
    return this.getActivityContent(activity.type);
  }

  getActivityTypeLabel(type: Activity['type']): string {
    switch (type) {
      case 'post_created': return 'New Post';
      case 'post_liked': return 'Like';
      case 'comment_added': return 'Comment';
      case 'user_joined': return 'Join';
      default: return 'Activity';
    }
  }

  formatTime(timestamp: string): string {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  handleAvatarError(event: any): void {
    event.target.style.display = 'none';
    event.target.nextElementSibling.style.display = 'flex';
  }
}

