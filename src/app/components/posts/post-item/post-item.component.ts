import { Component, Input, Output, EventEmitter, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Post } from '../../../models/post.model';
import { isPostOwner } from '../../../utils/ownership.util';
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
          <div class="author-avatar">{{ getInitials(post.author.firstName + ' ' + post.author.lastName) }}</div>
          <div class="author-info">
            <span class="author-name">{{ post.author.firstName }} {{ post.author.lastName }}</span>
            <span class="post-date">{{ formatDate(post.createdAt) }}</span>
          </div>
        </div>
        
  <div class="ownership-debug" *ngIf="debugMode">
    UID: {{ currentUserId() || '—' }} | AID: {{ post.author.id.timestamp || post.author.id || '—' }}
    <button style="margin-left: 10px; font-size: 12px;" (click)="debugOwnership()">🔍 Debug</button>
  </div>
        <div class="post-actions" *ngIf="canModifyPost()">
          <button class="edit-btn" (click)="onEdit()">Edit</button>
          <button class="delete-btn" (click)="onDelete()">Delete</button>
        </div>
      </div>
      
      <div class="post-content">
        <h2 class="post-title">
          <a [routerLink]="['/community', post.id]">{{ post.title }}</a>
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
          <!-- Single large image -->
          <div 
            class="media-main" 
            *ngIf="post.mediaUrls.length === 1"
            [ngStyle]="getMediaStyle(post.mediaUrls[0])"
          >
            <div class="media-loading" *ngIf="isMediaLoading(post.mediaUrls[0])">
              <div class="loading-spinner"></div>
            </div>
          </div>
          
          <!-- Multiple images grid -->
          <div class="media-grid" *ngIf="post.mediaUrls.length > 1">
            <div 
              class="media-grid-item" 
              *ngFor="let mediaUrl of post.mediaUrls.slice(0, 4); trackBy: trackByMediaUrl; let i = index"
              [class.media-grid-main]="i === 0"
              [class.media-grid-small]="i > 0"
              [ngStyle]="getMediaStyle(mediaUrl)"
            >
              <div class="media-loading" *ngIf="isMediaLoading(mediaUrl)">
                <div class="loading-spinner"></div>
              </div>
              
              <!-- Show "more" overlay on last visible image if there are more than 4 -->
              <div class="media-more-overlay" *ngIf="i === 3 && post.mediaUrls.length > 4">
                <span>+{{ post.mediaUrls.length - 4 }}</span>
              </div>
            </div>
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
              [class.active]="false"
              (click)="onUpvote()"
              [disabled]="false"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
              </svg>
              <span>{{ post.upvotes }}</span>
            </button>
            
            <button
              class="vote-btn downvote"
              [class.active]="false"
              (click)="onDownvote()"
              [disabled]="false"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
              <span>{{ post.downvotes }}</span>
            </button>
          </div>
          
          <a [routerLink]="['/community', post.id]" class="comments-link">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>Comments</span>
          </a>
          
          <div class="share-container">
            <button class="share-btn" (click)="toggleShareMenu($event)" [class.active]="showShareMenu">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              <span>Share</span>
            </button>
            
            <div class="share-menu" [class.show]="showShareMenu">
              <button class="share-option" (click)="shareToSocial('facebook')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </button>
              
              <button class="share-option" (click)="shareToSocial('twitter')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#1DA1F2">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
                Twitter
              </button>
              
              <button class="share-option" (click)="shareToSocial('linkedin')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#0077B5">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn
              </button>
              
              <button class="share-option" (click)="shareToSocial('whatsapp')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.531 3.488"/>
                </svg>
                WhatsApp
              </button>
              
              <button class="share-option" (click)="copyPostLink()">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
                </svg>
                Copy Link
              </button>
            </div>
          </div>
          
          <!-- Toast notification for copy feedback -->
          <div class="copy-toast" [class.show]="showCopyToast">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            Link copied to clipboard!
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .post-item {
      background-color: white;
      border-radius: 16px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.08);
      overflow: hidden;
      transition: all 0.3s ease;
      border: 1px solid rgba(0,0,0,0.05);
    }
    
    .post-item:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 32px rgba(0,0,0,0.12);
    }
    
    .post-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 20px 16px 20px;
      border-bottom: 1px solid #f0f0f0;
    }
    
    .post-author {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .author-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 16px;
    }
    
    .author-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    
    .author-name {
      font-weight: 600;
      color: #1a1a1a;
      font-size: 15px;
    }
    
    .post-date {
      font-size: 13px;
      color: #666;
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
      padding: 0 20px 20px 20px;
    }
    
    .post-title {
      margin: 0 0 12px 0;
      font-size: 20px;
      font-weight: 700;
      line-height: 1.4;
    }
    
    .post-title a {
      color: #1a1a1a;
      text-decoration: none;
      transition: color 0.2s ease;
    }
    
    .post-title a:hover {
      color: #007bff;
    }
    
    .post-location {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #666;
      font-size: 14px;
      margin-bottom: 12px;
    }
    
    .post-text {
      margin-bottom: 20px;
      color: #444;
      line-height: 1.6;
      font-size: 15px;
    }
    
    .media-preview {
      margin-bottom: 15px;
      border-radius: 12px;
      overflow: hidden;
    }
    
    /* Single image - large and prominent */
    .media-main {
      width: 100%;
      height: 300px;
      border-radius: 12px;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      position: relative;
      cursor: pointer;
      transition: transform 0.2s ease;
    }
    
    .media-main:hover {
      transform: scale(1.02);
    }
    
    /* Multiple images - modern grid layout */
    .media-grid {
      display: grid;
      gap: 8px;
      grid-template-columns: 2fr 1fr 1fr;
      grid-template-rows: 1fr 1fr;
      height: 300px;
      border-radius: 12px;
      overflow: hidden;
    }
    
    .media-grid-item {
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      position: relative;
      cursor: pointer;
      transition: transform 0.2s ease, filter 0.2s ease;
    }
    
    .media-grid-item:hover {
      transform: scale(1.05);
      filter: brightness(1.1);
    }
    
    .media-grid-main {
      grid-row: 1 / 3;
      grid-column: 1;
    }
    
    .media-grid-small {
      min-height: 140px;
    }
    
    .media-grid-small:nth-child(2) {
      grid-row: 1;
      grid-column: 2;
    }
    
    .media-grid-small:nth-child(3) {
      grid-row: 2;
      grid-column: 2;
    }
    
    .media-grid-small:nth-child(4) {
      grid-row: 1;
      grid-column: 3;
    }
    
    .media-grid-small:nth-child(5) {
      grid-row: 2;
      grid-column: 3;
    }
    
    /* Loading spinner */
    .media-loading {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(255, 255, 255, 0.9);
      padding: 12px;
      border-radius: 8px;
      backdrop-filter: blur(4px);
    }
    
    .loading-spinner {
      width: 24px;
      height: 24px;
      border: 2px solid #f3f3f3;
      border-top: 2px solid #007bff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    /* More images overlay */
    .media-more-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 24px;
      font-weight: 600;
      backdrop-filter: blur(2px);
    }
    
    .post-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 16px;
    }
    
    .tag {
      padding: 6px 12px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
    }
    
    .post-footer {
      padding: 16px 20px;
      border-top: 1px solid #f0f0f0;
      background: #fafafa;
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
    
    /* Share functionality styles */
    .share-container {
      position: relative;
      display: inline-block;
    }
    
    .share-btn {
      display: flex;
      align-items: center;
      gap: 5px;
      background: none;
      border: none;
      color: #666;
      cursor: pointer;
      padding: 8px 12px;
      border-radius: 8px;
      transition: all 0.2s ease;
      font-size: 14px;
    }
    
    .share-btn:hover {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      transform: translateY(-1px);
    }
    
    .share-btn.active {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    
    .share-menu {
      position: absolute;
      bottom: 100%;
      right: 0;
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.15);
      padding: 8px 0;
      min-width: 180px;
      opacity: 0;
      visibility: hidden;
      transform: translateY(10px);
      transition: all 0.3s ease;
      z-index: 1000;
      backdrop-filter: blur(10px);
    }
    
    .share-menu.show {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }
    
    .share-option {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 12px 16px;
      background: none;
      border: none;
      color: #333;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s ease;
      text-align: left;
    }
    
    .share-option:hover {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
      transform: translateX(4px);
    }
    
    .share-option svg {
      flex-shrink: 0;
      transition: transform 0.2s ease;
    }
    
    .share-option:hover svg {
      transform: scale(1.1);
    }
    
    /* Modern post footer with better spacing */
    .post-footer {
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      border-top: 1px solid rgba(0,0,0,0.05);
    }
    
    .post-stats {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
    }
    
    /* Responsive improvements */
    @media (max-width: 768px) {
      .share-menu {
        right: auto;
        left: 0;
        min-width: 160px;
      }
      
      .post-stats {
        flex-wrap: wrap;
        gap: 12px;
      }
      
      .vote-actions {
        gap: 10px;
      }
    }
    
    /* Toast notification */
    .copy-toast {
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      gap: 8px;
      opacity: 0;
      visibility: hidden;
      transform: translateX(100%);
      transition: all 0.3s ease;
      z-index: 10000;
      font-size: 14px;
      font-weight: 500;
    }
    
    .copy-toast.show {
      opacity: 1;
      visibility: visible;
      transform: translateX(0);
    }
    .ownership-debug { font-size:10px; opacity:0.6; margin-right:8px; }
  `]
})
export class PostItemComponent implements OnDestroy {
  @Input() post!: Post;
  @Output() upvoted = new EventEmitter<string>();
  @Output() downvoted = new EventEmitter<string>();
  @Output() deleted = new EventEmitter<string>();
  @Output() edited = new EventEmitter<string>();

  // Track blob URLs for media images
  mediaBlobUrls: { [key: string]: string } = {};
  mediaLoadingStates: { [key: string]: boolean } = {};

  // Share menu state
  showShareMenu: boolean = false;
  showCopyToast: boolean = false;

  constructor(
    private authService: AuthService,
    private postService: PostService
  ) { }

  get debugMode(): boolean { try { return localStorage.getItem('travner_debug') === 'true'; } catch { return false; } }
  currentUserId(): string | null {
    const user = this.authService.getCurrentUser?.();
    if (!user || !user.id) return null;

    if (typeof user.id === 'object' && 'timestamp' in user.id) {
      return String(user.id.timestamp);
    }
    return String(user.id);
  }

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
    if (!mediaUrl) {
      return {};
    }

    const blobUrl = this.getMediaBlobUrl(mediaUrl);
    if (blobUrl && blobUrl.startsWith('blob:')) {
      return { 'background-image': `url(${blobUrl})` };
    }
    return {};
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

  /**
   * Clean up blob URLs to prevent memory leaks
   */
  ngOnDestroy(): void {
    // Revoke all blob URLs to free up memory
    Object.values(this.mediaBlobUrls).forEach(blobUrl => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    });
    this.mediaBlobUrls = {};
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
    // Create a PostOwner-compatible object from the Post
    const postOwner = {
      authorId: this.post.author?.id,
      authorName: this.post.author?.userName // Use username instead of concatenated names
    };

    // Get current user and handle potential JSON string
    let currentUser = this.authService.getCurrentUser();
    if (typeof currentUser === 'string') {
      try {
        const parsed = JSON.parse(currentUser);
        currentUser = parsed.data || parsed; // Handle API response format
      } catch (e) {
        console.error('Failed to parse current user:', e);
        currentUser = null;
      }
    }

    return isPostOwner(postOwner, currentUser, 'PostItem');
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

  /**
   * Toggle share menu visibility
   */
  toggleShareMenu(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.showShareMenu = !this.showShareMenu;
  }

  /**
   * Close share menu when clicking outside
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const shareContainer = target.closest('.share-container');
    if (!shareContainer) {
      this.showShareMenu = false;
    }
  }

  /**
   * Share post to social media
   */
  shareToSocial(platform: string): void {
    const postUrl = `${window.location.origin}/community/${this.post.id}`;
    const postTitle = encodeURIComponent(this.post.title);
    const postDescription = encodeURIComponent(this.post.content.substring(0, 200) + '...');

    let shareUrl = '';

    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=${postTitle}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${postTitle}%20${encodeURIComponent(postUrl)}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400,resizable=yes,scrollbars=yes');
    }

    this.showShareMenu = false;
  }

  /**
   * Copy post link to clipboard
   */
  async copyPostLink(): Promise<void> {
    const postUrl = `${window.location.origin}/community/${this.post.id}`;

    try {
      await navigator.clipboard.writeText(postUrl);
      this.showToast();
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = postUrl;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        this.showToast();
      } catch (err) {
        console.error('Failed to copy link:', err);
        alert('Failed to copy link');
      }
      document.body.removeChild(textArea);
    }

    this.showShareMenu = false;
  }

  /**
   * Show copy success toast
   */
  private showToast(): void {
    this.showCopyToast = true;
    setTimeout(() => {
      this.showCopyToast = false;
    }, 3000);
  }

  /**
   * Debug ownership information (available in browser console)
   */
  debugOwnership(): void {
    let currentUser = this.authService.getCurrentUser();

    // Handle potential JSON string
    if (typeof currentUser === 'string') {
      try {
        const parsed = JSON.parse(currentUser);
        currentUser = parsed.data || parsed; // Handle API response format
      } catch (e) {
        console.error('Failed to parse current user:', e);
        currentUser = null;
      }
    }

    const postOwner = {
      authorId: this.post.author?.id,
      authorName: this.post.author?.userName
    };

    console.log('🔍 Ownership Debug Information:', {
      postId: this.post.id,
      postOwner,
      currentUser,
      rawCurrentUser: this.authService.getCurrentUser(), // Show raw data too
      canModify: this.canModifyPost(),
      enableDebugMode: 'Run: localStorage.setItem("travner_debug", "true"); then refresh'
    });
  }
}
