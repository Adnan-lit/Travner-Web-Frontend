import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Post } from '../../../models/post.model';
import { AuthService } from '../../../services/auth.service';
import { PostService } from '../../../services/post.service';

@Component({
    selector: 'app-post-item',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="post-item" *ngIf="post">
      <div class="post-header">
        <div class="post-author">
          <div class="author-avatar">{{ getInitials(post.authorName) }}</div>
          <div class="author-info">
            <span class="author-name">{{ post.authorName }}</span>
            <span class="post-date">{{ formatDate(post.createdAt) }}</span>
          </div>
        </div>
        
        <div class="post-actions" *ngIf="canModifyPost()">
          <button class="edit-btn" (click)="onEdit()">Edit</button>
          <button class="delete-btn" (click)="onDelete()">Delete</button>
        </div>
      </div>
      
      <div class="post-content">
        <h2 class="post-title">
          <a [routerLink]="['/posts', post.id]">{{ post.title }}</a>
        </h2>
        
        <div class="post-location">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{{ post.location }}</span>
        </div>
        
        <p class="post-text">{{ post.content }}</p>
        
        <!-- Media Preview -->
        <div class="media-preview" *ngIf="post.mediaUrls && post.mediaUrls.length > 0">
          <div 
            class="media-item" 
            *ngFor="let mediaUrl of post.mediaUrls.slice(0, 3); trackBy: trackByMediaUrl"
          >
            <div 
              class="media-image"
              [ngStyle]="getMediaStyle(mediaUrl)"
            ></div>
            <div class="media-loading" *ngIf="isMediaLoading(mediaUrl)">
              Loading...
            </div>
          </div>
          <div class="media-more" *ngIf="post.mediaUrls.length > 3">
            +{{ post.mediaUrls.length - 3 }} more
          </div>
        </div>
        
        <div class="post-tags">
          <span class="tag" *ngFor="let tag of post.tags">{{ tag }}</span>
        </div>
      </div>
      
      <div class="post-footer">
        <div class="post-stats">
          <div class="vote-actions">
            <button 
              class="vote-btn upvote" 
              [class.active]="post.hasUserUpvoted" 
              (click)="onUpvote()"
              [disabled]="post.hasUserUpvoted"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
              </svg>
              <span>{{ post.upvotes }}</span>
            </button>
            
            <button 
              class="vote-btn downvote" 
              [class.active]="post.hasUserDownvoted" 
              (click)="onDownvote()"
              [disabled]="post.hasUserDownvoted"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
              <span>{{ post.downvotes }}</span>
            </button>
          </div>
          
          <a [routerLink]="['/posts', post.id]" class="comments-link">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>Comments</span>
          </a>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .post-item {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
      transition: transform 0.2s ease;
    }
    
    .post-item:hover {
      transform: translateY(-3px);
    }
    
    .post-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px;
      border-bottom: 1px solid #eee;
    }
    
    .post-author {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .author-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: #4CAF50;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
    }
    
    .author-info {
      display: flex;
      flex-direction: column;
    }
    
    .author-name {
      font-weight: bold;
      color: #333;
    }
    
    .post-date {
      font-size: 12px;
      color: #888;
    }
    
    .post-actions {
      display: flex;
      gap: 10px;
    }
    
    .edit-btn, .delete-btn {
      padding: 6px 12px;
      border: none;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
    }
    
    .edit-btn {
      background-color: #2196F3;
      color: white;
    }
    
    .delete-btn {
      background-color: #f44336;
      color: white;
    }
    
    .post-content {
      padding: 15px;
    }
    
    .post-title {
      margin: 0 0 10px 0;
      font-size: 20px;
    }
    
    .post-title a {
      color: #333;
      text-decoration: none;
      transition: color 0.2s;
    }
    
    .post-title a:hover {
      color: #4CAF50;
    }
    
    .post-location {
      display: flex;
      align-items: center;
      gap: 5px;
      color: #666;
      font-size: 14px;
      margin-bottom: 10px;
    }
    
    .post-text {
      margin-bottom: 15px;
      color: #333;
      line-height: 1.5;
    }
    
    .media-preview {
      display: flex;
      gap: 5px;
      margin-bottom: 15px;
      position: relative;
    }
    
    .media-item {
      width: 100px;
      height: 100px;
      border-radius: 4px;
      position: relative;
      overflow: hidden;
    }
    
    .media-image {
      width: 100%;
      height: 100%;
      border-radius: 4px;
    }
    
    .media-loading {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 12px;
      color: #666;
      background: rgba(255, 255, 255, 0.8);
      padding: 4px 8px;
      border-radius: 4px;
    }
    
    .media-more {
      position: absolute;
      right: 10px;
      bottom: 10px;
      background-color: rgba(0,0,0,0.7);
      color: white;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 12px;
    }
    
    .post-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      margin-top: 10px;
    }
    
    .tag {
      padding: 4px 10px;
      background-color: #e1f5fe;
      color: #0288d1;
      border-radius: 16px;
      font-size: 12px;
    }
    
    .post-footer {
      padding: 10px 15px;
      border-top: 1px solid #eee;
    }
    
    .post-stats {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .vote-actions {
      display: flex;
      gap: 15px;
    }
    
    .vote-btn {
      display: flex;
      align-items: center;
      gap: 5px;
      background: none;
      border: none;
      color: #666;
      cursor: pointer;
      padding: 5px;
      border-radius: 4px;
    }
    
    .vote-btn:hover:not(:disabled) {
      background-color: #f0f0f0;
    }
    
    .vote-btn.active {
      color: #4CAF50;
      font-weight: bold;
    }
    
    .vote-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
    
    .comments-link {
      display: flex;
      align-items: center;
      gap: 5px;
      color: #666;
      text-decoration: none;
    }
    
    .comments-link:hover {
      color: #4CAF50;
    }
  `]
})
export class PostItemComponent {
    @Input() post!: Post;
    @Output() upvoted = new EventEmitter<string>();
    @Output() downvoted = new EventEmitter<string>();
    @Output() deleted = new EventEmitter<string>();
    @Output() edited = new EventEmitter<string>();

    // Track blob URLs for media images
    mediaBlobUrls: { [key: string]: string } = {};
    mediaLoadingStates: { [key: string]: boolean } = {};

    constructor(
        private authService: AuthService,
        private postService: PostService
    ) { }

    /**
     * Track by function for ngFor optimization
     */
    trackByMediaUrl(index: number, mediaUrl: string): string {
        return mediaUrl;
    }

    /**
     * Check if media is currently loading
     */
    isMediaLoading(mediaUrl: string): boolean {
        return this.mediaLoadingStates[mediaUrl] || false;
    }

    /**
     * Get style object for media item
     */
    getMediaStyle(mediaUrl: string): any {
        const blobUrl = this.getMediaBlobUrl(mediaUrl);
        return {
            'background-image': blobUrl ? `url(${blobUrl})` : 'none',
            'background-size': 'cover',
            'background-position': 'center',
            'background-repeat': 'no-repeat',
            'width': '100%',
            'height': '100%'
        };
    }

    /**
     * Get blob URL for media, creating it if it doesn't exist
     */
    getMediaBlobUrl(mediaUrl: string): string {
        if (!mediaUrl) return '';
        
        // Check if we already have a blob URL for this media
        if (this.mediaBlobUrls[mediaUrl]) {
            return this.mediaBlobUrls[mediaUrl];
        }

        // Check if we're already loading this media
        if (this.mediaLoadingStates[mediaUrl]) {
            return '';
        }

        // Start loading the media
        this.mediaLoadingStates[mediaUrl] = true;
        
        this.postService.getMediaBlob(mediaUrl).subscribe({
            next: (blobUrl) => {
                this.mediaLoadingStates[mediaUrl] = false;
                if (blobUrl) {
                    this.mediaBlobUrls[mediaUrl] = blobUrl;
                }
            },
            error: (error) => {
                this.mediaLoadingStates[mediaUrl] = false;
                console.error('Failed to load media blob:', error);
            }
        });

        // Return empty string while loading
        return '';
    }

    getInitials(name: string): string {
        if (!name) return '?';
        return name.split(' ')
            .map(part => part.charAt(0))
            .join('')
            .substring(0, 2)
            .toUpperCase();
    }

    formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    canModifyPost(): boolean {
        if (!this.post) return false;

        // Get the current user
        let currentUser: any = null;
        this.authService.currentUser$.subscribe(user => {
            currentUser = user;
        });

        // Check if the user is the author or an admin
        if (!currentUser) return false;

        const isAuthor = currentUser.id === this.post.authorId;
        const isAdmin = this.authService.isAdmin();

        return isAuthor || isAdmin;
    }

    onUpvote(): void {
        this.upvoted.emit(this.post.id);
    }

    onDownvote(): void {
        this.downvoted.emit(this.post.id);
    }

    onEdit(): void {
        this.edited.emit(this.post.id);
    }

    onDelete(): void {
        if (confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
            this.deleted.emit(this.post.id);
        }
    }
}
