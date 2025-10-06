import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { PostService } from '../../../services/post.service';
import { Post } from '../../../models/post.model';
import { Comment, CommentCreate, CommentsResponse } from '../../../models/comment.model';
import { Media, MediaType } from '../../../models/media.model';
import { AuthService } from '../../../services/auth.service';
import { CursorService } from '../../../services/cursor.service';
import { CommentComponent } from '../comment/comment.component';
import { isPostOwner } from '../../../utils/ownership.util';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-post-detail',
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, CommentComponent],
  template: `
    <div class="post-detail-container">
      <!-- Back Button -->
      <div class="back-nav">
  <button class="back-button" routerLink="/community">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          Back to Community
        </button>
      </div>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="loading">
        <div class="loader"></div>
        <p>Loading post...</p>
      </div>

      <!-- Error State -->
      <div class="error-state" *ngIf="error">
        <p>{{ error }}</p>
        <button class="retry-button" (click)="loadPost()">Try Again</button>
      </div>

      <!-- Post Content -->
      <div class="post-content" *ngIf="post && !loading && !error">
        <!-- Post Header -->
        <header class="post-header">
          <h1 class="post-title">{{ post.title }}</h1>
          
          <div class="post-meta">
            <div class="author-info">
              <div class="author-avatar">{{ getInitials(post.author.firstName + ' ' + post.author.lastName) }}</div>
              <div>
                <div class="author-name">{{ post.author.firstName }} {{ post.author.lastName }}</div>
                <div class="post-date">{{ formatDate(post.createdAt) }}</div>
              </div>
            </div>
            
            <div class="post-actions" *ngIf="canModifyPost()">
              <button class="edit-btn" (click)="onEdit()">Edit</button>
              <button class="delete-btn" (click)="onDelete()">Delete</button>
            </div>
          </div>
          
          <div class="post-location">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{{ post.location }}</span>
          </div>
        </header>

        <!-- Post Body -->
        <div class="post-body">
          <p class="post-text">{{ post.content }}</p>
          
          <!-- Media Gallery -->
          <div class="media-gallery" *ngIf="media && media.length > 0">
            <div class="gallery-container" [class.gallery-grid]="media.length > 1">
              <div *ngFor="let item of media" class="media-item">
                <img *ngIf="item.type === 'IMAGE'" [src]="item.url" [alt]="post.title" class="media-image">
                <video *ngIf="item.type === 'VIDEO'" controls class="media-video">
                  <source [src]="item.url" type="video/mp4">
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>
          
          <!-- Tags -->
          <div class="post-tags" *ngIf="post.tags && post.tags.length > 0">
            <span class="tag" *ngFor="let tag of post.tags">{{ tag }}</span>
          </div>
          
          <!-- Vote Actions -->
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
        </div>

        <!-- Comments Section -->
        <section class="comments-section">
          <h2 class="comments-title">Comments</h2>
          
          <!-- New Comment Form -->
          <div class="comment-form-container" *ngIf="isAuthenticated">
            <form [formGroup]="commentForm" (ngSubmit)="onSubmitComment()" class="comment-form">
              <div class="form-group">
                <textarea 
                  formControlName="content" 
                  placeholder="Share your thoughts on this travel post..."
                  rows="3" 
                  class="comment-textarea"
                ></textarea>
                <div class="error-message" *ngIf="commentSubmitted && commentForm.get('content')?.errors">
                  <span *ngIf="commentForm.get('content')?.errors?.['required']">Comment cannot be empty</span>
                </div>
              </div>
              <button type="submit" class="comment-submit-btn" [disabled]="commentLoading">
                {{ commentLoading ? 'Posting...' : 'Post Comment' }}
              </button>
            </form>
          </div>
          
          <div class="login-to-comment" *ngIf="!isAuthenticated">
            <p>Please <a routerLink="/signin">sign in</a> to leave a comment.</p>
          </div>
          
          <!-- Comments List -->
          <div class="comments-list">
            <ng-container *ngIf="comments && comments.length > 0; else noComments">
              <!-- Using the reusable Comment Component -->
              <app-comment
                *ngFor="let comment of topLevelComments"
                [comment]="comment"
                [postId]="postId!"
                [isReply]="false"
                (commentUpdated)="onCommentUpdated($event)"
                (commentDeleted)="onCommentDeleted($event)"
              ></app-comment>
              
              <!-- Pagination Controls -->
              <div class="pagination-controls" *ngIf="totalCommentPages > 1">
                <button 
                  [disabled]="currentCommentPage === 0" 
                  (click)="loadCommentPage(currentCommentPage - 1)" 
                  class="pagination-btn"
                >
                  Previous
                </button>
                <span class="page-info">Page {{ currentCommentPage + 1 }} of {{ totalCommentPages }}</span>
                <button 
                  [disabled]="currentCommentPage >= totalCommentPages - 1" 
                  (click)="loadCommentPage(currentCommentPage + 1)" 
                  class="pagination-btn"
                >
                  Next
                </button>
              </div>
            </ng-container>
            
            <ng-template #noComments>
              <div class="no-comments">
                <p>No comments yet. Be the first to share your thoughts!</p>
              </div>
            </ng-template>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .post-detail-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .back-nav {
      margin-bottom: 20px;
    }
    
    .back-button {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 8px 12px;
      background: none;
      border: 1px solid #ddd;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
    }
    
    .back-button:hover {
      background-color: #f5f5f5;
    }
    
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 50px 0;
    }
    
    .loader {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #4CAF50;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin-bottom: 15px;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .error-state {
      text-align: center;
      padding: 30px;
      color: #f44336;
    }
    
    .retry-button {
      padding: 8px 15px;
      background-color: #f44336;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      margin-top: 10px;
    }
    
    .post-content {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    
    .post-header {
      padding: 20px;
      border-bottom: 1px solid #eee;
    }
    
    .post-title {
      margin: 0 0 15px 0;
      font-size: 28px;
      color: #333;
    }
    
    .post-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }
    
    .author-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .author-avatar {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background-color: #4CAF50;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 18px;
    }
    
    .author-avatar-small {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background-color: #4CAF50;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 12px;
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
    
    .post-location {
      display: flex;
      align-items: center;
      gap: 5px;
      color: #666;
      font-size: 14px;
    }
    
    .post-body {
      padding: 20px;
    }
    
    .post-text {
      margin-bottom: 20px;
      color: #333;
      line-height: 1.6;
      font-size: 16px;
    }
    
    .media-gallery {
      margin-bottom: 20px;
    }
    
    .gallery-container {
      display: flex;
      overflow: hidden;
      border-radius: 8px;
    }
    
    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      grid-gap: 10px;
    }
    
    .media-item {
      position: relative;
      overflow: hidden;
    }
    
    .media-image, .media-video {
      width: 100%;
      height: auto;
      object-fit: cover;
      display: block;
    }
    
    .post-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      margin: 15px 0;
    }
    
    .tag {
      padding: 4px 10px;
      background-color: #e1f5fe;
      color: #0288d1;
      border-radius: 16px;
      font-size: 12px;
    }
    
    .vote-actions {
      display: flex;
      gap: 15px;
      margin-top: 20px;
    }
    
    .vote-btn {
      display: flex;
      align-items: center;
      gap: 5px;
      background: none;
      border: none;
      color: #666;
      cursor: pointer;
      padding: 5px 10px;
      border-radius: 4px;
      font-size: 16px;
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
    
    .comments-section {
      margin-top: 30px;
      padding: 20px;
    }
    
    .comments-title {
      margin: 0 0 20px 0;
      font-size: 20px;
      color: #333;
    }
    
    .comment-form-container {
      margin-bottom: 30px;
    }
    
    .comment-form {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    .comment-textarea, .reply-textarea {
      width: 100%;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      resize: vertical;
      font-size: 15px;
    }
    
    .comment-submit-btn {
      align-self: flex-end;
      padding: 8px 15px;
      background-color: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }
    
    .login-to-comment {
      margin-bottom: 30px;
      text-align: center;
      padding: 15px;
      background-color: #f8f9fa;
      border-radius: 4px;
      color: #666;
    }
    
    .login-to-comment a {
      color: #4CAF50;
      text-decoration: none;
      font-weight: bold;
    }
    
    .comments-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    
    .comment-thread {
      margin-bottom: 20px;
    }
    
    .comment {
      padding: 15px;
      background-color: #f9f9f9;
      border-radius: 8px;
    }
    
    .comment-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    
    .comment-author {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .comment-author-name {
      font-weight: bold;
      font-size: 14px;
      color: #333;
    }
    
    .comment-date {
      font-size: 12px;
      color: #888;
    }
    
    .comment-actions {
      display: flex;
      gap: 8px;
    }
    
    .btn-edit, .btn-delete {
      padding: 4px 8px;
      border: none;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
    }
    
    .btn-edit {
      background-color: #e3f2fd;
      color: #2196F3;
    }
    
    .btn-delete {
      background-color: #ffebee;
      color: #f44336;
    }
    
    .comment-text {
      margin: 0 0 10px 0;
      line-height: 1.5;
      font-size: 14px;
      color: #333;
    }
    
    .comment-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 10px;
    }
    
    .comment-votes {
      display: flex;
      gap: 10px;
    }
    
    .vote-btn-small {
      display: flex;
      align-items: center;
      gap: 3px;
      background: none;
      border: none;
      color: #666;
      cursor: pointer;
      padding: 3px 6px;
      border-radius: 4px;
      font-size: 12px;
    }
    
    .vote-btn-small:hover:not(:disabled) {
      background-color: #f0f0f0;
    }
    
    .vote-btn-small.active {
      color: #4CAF50;
      font-weight: bold;
    }
    
    .vote-btn-small:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
    
    .reply-btn {
      background: none;
      border: none;
      color: #2196F3;
      cursor: pointer;
      font-size: 12px;
      padding: 3px 6px;
    }
    
    .reply-btn:hover {
      text-decoration: underline;
    }
    
    .reply-form-container {
      margin-top: 10px;
      padding: 10px;
      background-color: #fff;
      border-radius: 4px;
      border: 1px solid #eee;
    }
    
    .reply-form {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .reply-form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
    
    .reply-submit-btn {
      padding: 6px 12px;
      background-color: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }
    
    .cancel-btn {
      padding: 6px 12px;
      background-color: #f1f1f1;
      color: #333;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }
    
    .replies {
      margin-top: 15px;
      padding-left: 20px;
      border-left: 2px solid #eee;
    }
    
    .reply {
      padding: 10px;
      background-color: #fff;
      border-radius: 4px;
      margin-bottom: 10px;
    }
    
    .no-comments {
      text-align: center;
      padding: 30px;
      color: #666;
      background-color: #f8f9fa;
      border-radius: 8px;
      border: 1px dashed #ddd;
    }
    
    .error-message {
      color: #f44336;
      font-size: 12px;
      margin-top: 4px;
    }
    
    .pagination-controls {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 15px;
      margin-top: 30px;
    }
    
    .pagination-btn {
      padding: 8px 15px;
      background-color: #2196F3;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    .pagination-btn:hover:not(:disabled) {
      background-color: #0b7dda;
    }
    
    .pagination-btn:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
    }
    
    .page-info {
      font-size: 14px;
      color: #555;
    }
  `]
})
export class PostDetailComponent implements OnInit {
  postId: string | null = null;
  post: Post | null = null;
  media: Media[] = [];
  comments: Comment[] = [];

  loading = true;
  error: string | null = null;
  isAuthenticated = false;
  currentUser: any = null;

  // Comment state
  commentForm!: FormGroup;
  commentSubmitted = false;
  commentLoading = false;

  // Reply state
  replyForm!: FormGroup;
  replySubmitted = false;
  replyLoading = false;
  activeReplyId: string | null = null;

  // Pagination for comments
  currentCommentPage = 0;
  commentPageSize = 10;
  totalCommentPages = 0;
  totalCommentElements = 0;

  constructor(
    private route: ActivatedRoute,
    private postService: PostService,
    private authService: AuthService,
    private formBuilder: FormBuilder,
    private router: Router,
    private toast: ToastService
  ) { }

  ngOnInit(): void {
    // Show feedback when redirected from guard
    const denied = this.route.snapshot.queryParamMap.get('denied');
    if (denied === 'not-owner') {
      this.toast.info('You are not allowed to edit that post.');
    }
    // Get post ID from route
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.postId = id;
        this.loadPost();
      } else {
        this.error = 'Post ID not provided';
        this.loading = false;
      }
    });

    // Check authentication status
    this.authService.isAuthenticated$.subscribe(isAuth => {
      this.isAuthenticated = isAuth;
    });

    // Get current user
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    // Initialize forms
    this.initForms();
  }

  initForms(): void {
    // Comment form
    this.commentForm = this.formBuilder.group({
      content: ['', [Validators.required]]
    });

    // Reply form
    this.replyForm = this.formBuilder.group({
      content: ['', [Validators.required]]
    });
  }

  loadPost(): void {
    if (!this.postId) return;

    this.loading = true;
    this.error = null;

    // Load post details
    this.postService.getPostById(this.postId).subscribe({
      next: (post) => {
        this.post = post;
        this.loading = false;

        // Load media for the post
        this.loadMedia();

        // Load comments for the post
        this.loadComments();
      },
      error: (error) => {
        console.error('Error loading post:', error);
        this.error = 'Failed to load post. Please try again.';
        this.loading = false;
      }
    });
  }

  loadMedia(): void {
    if (!this.postId) return;

    this.postService.getMedia(this.postId).subscribe({
      next: (mediaItems) => {
        this.media = mediaItems;
      },
      error: (error) => {
        console.error('Error loading media:', error);
      }
    });
  }

  loadComments(): void {
    if (!this.postId) return;

    this.postService.getComments(this.postId, this.currentCommentPage, this.commentPageSize).subscribe({
      next: (response: CommentsResponse) => {
        this.comments = response.content;
        this.totalCommentPages = response.totalPages;
        this.totalCommentElements = response.totalElements;
      },
      error: (error) => {
        console.error('Error loading comments:', error);
      }
    });
  }

  loadCommentPage(page: number): void {
    if (page < 0 || (this.totalCommentPages > 0 && page >= this.totalCommentPages)) {
      return;
    }

    this.currentCommentPage = page;
    this.loadComments();
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
    if (!this.post || !this.currentUser) return false;

    // Handle potential JSON string for current user
    let user = this.currentUser;
    if (typeof user === 'string') {
      try {
        const parsed = JSON.parse(user);
        user = parsed.data || parsed;
      } catch (e) {
        console.error('Failed to parse current user in post detail:', e);
        user = null;
      }
    }

    // Create a PostOwner-compatible object from the Post
    const postOwner = {
      authorId: this.post.author?.id,
      authorName: this.post.author?.userName // Use username instead of concatenated names
    };
    return isPostOwner(postOwner, user, 'PostDetail');
  }

  canModifyComment(comment: Comment): boolean {
    if (!comment || !this.currentUser) return false;

    // Handle complex ID structure from API
    let currentUserId: string | number | null = null;
    if (this.currentUser.id != null) {
      if (typeof this.currentUser.id === 'object' && 'timestamp' in this.currentUser.id) {
        currentUserId = this.currentUser.id.timestamp;
      } else {
        currentUserId = this.currentUser.id;
      }
    }

    const isAuthor = currentUserId === comment.authorId;
    const isAdmin = this.authService.hasRole('ADMIN');

    return isAuthor || isAdmin;
  }

  onUpvote(): void {
    if (!this.postId || !this.isAuthenticated) return;

    this.postService.upvotePost(this.postId).subscribe({
      next: (updatedPost) => {
        this.post = updatedPost;
      },
      error: (error) => {
        console.error('Error upvoting post:', error);
      }
    });
  }

  onDownvote(): void {
    if (!this.postId || !this.isAuthenticated) return;

    this.postService.downvotePost(this.postId).subscribe({
      next: (updatedPost) => {
        this.post = updatedPost;
      },
      error: (error) => {
        console.error('Error downvoting post:', error);
      }
    });
  }

  onEdit(): void {
    if (!this.postId) return;
    this.router.navigate(['/community', this.postId, 'edit']);
  }

  onDelete(): void {
    if (!this.postId) return;

    if (confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      this.postService.deletePost(this.postId).subscribe({
        next: () => {
          // Navigate back to community list after deletion
          this.router.navigate(['/community']);
        },
        error: (error) => {
          console.error('Error deleting post:', error);
          alert('Failed to delete post.');
        }
      });
    }
  }

  // Comment Functions
  onSubmitComment(): void {
    if (!this.postId || !this.isAuthenticated) return;

    this.commentSubmitted = true;

    if (this.commentForm.invalid) {
      return;
    }

    this.commentLoading = true;

    const commentData: CommentCreate = {
      content: this.commentForm.get('content')?.value
    };

    this.postService.createComment(this.postId, commentData).subscribe({
      next: (newComment) => {
        this.commentLoading = false;
        this.commentSubmitted = false;

        // Reset form
        this.commentForm.reset();

        // Refresh comments (go to first page)
        this.currentCommentPage = 0;
        this.loadComments();
      },
      error: (error) => {
        console.error('Error creating comment:', error);
        this.commentLoading = false;
      }
    });
  }

  get topLevelComments(): Comment[] {
    return this.comments.filter(comment => !comment.parentId);
  }

  onCommentUpdated(comment: Comment): void {
    // Find and update the comment in our array
    const index = this.comments.findIndex(c => c.id === comment.id);
    if (index !== -1) {
      this.comments[index] = comment;
    }
  }

  onCommentDeleted(commentId: string): void {
    // Refresh the comments list
    this.loadComments();
  }

  toggleReplyForm(commentId: string): void {
    if (this.activeReplyId === commentId) {
      this.cancelReply();
    } else {
      this.activeReplyId = commentId;
      this.replyForm.reset();
      this.replySubmitted = false;
    }
  }

  cancelReply(): void {
    this.activeReplyId = null;
    this.replyForm.reset();
  }

  onSubmitReply(parentId: string): void {
    if (!this.postId || !this.isAuthenticated) return;

    this.replySubmitted = true;

    if (this.replyForm.invalid) {
      return;
    }

    this.replyLoading = true;

    const replyData: CommentCreate = {
      content: this.replyForm.get('content')?.value,
      parentId: parentId
    };

    this.postService.createComment(this.postId, replyData).subscribe({
      next: (newReply) => {
        this.replyLoading = false;
        this.replySubmitted = false;
        this.activeReplyId = null;

        // Reset form
        this.replyForm.reset();

        // Refresh comments
        this.loadComments();
      },
      error: (error) => {
        console.error('Error creating reply:', error);
        this.replyLoading = false;
      }
    });
  }

  onEditComment(comment: Comment): void {
    // Implement comment editing functionality
    // This could be done inline or with a separate form
  }

  onDeleteComment(comment: Comment): void {
    if (!this.postId) return;

    if (confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
      this.postService.deleteComment(this.postId, comment.id).subscribe({
        next: () => {
          // Refresh comments
          this.loadComments();
        },
        error: (error) => {
          console.error('Error deleting comment:', error);
        }
      });
    }
  }

  onUpvoteComment(comment: Comment): void {
    if (!this.postId || !this.isAuthenticated) return;

    this.postService.upvoteComment(this.postId, comment.id).subscribe({
      next: (updatedComment) => {
        // Update comment in the list
        this.updateCommentInList(updatedComment);
      },
      error: (error) => {
        console.error('Error upvoting comment:', error);
      }
    });
  }

  onDownvoteComment(comment: Comment): void {
    if (!this.postId || !this.isAuthenticated) return;

    this.postService.downvoteComment(this.postId, comment.id).subscribe({
      next: (updatedComment) => {
        // Update comment in the list
        this.updateCommentInList(updatedComment);
      },
      error: (error) => {
        console.error('Error downvoting comment:', error);
      }
    });
  }

  private updateCommentInList(updatedComment: Comment): void {
    // Find and update the comment in the list (either top-level or reply)
    const updateComment = (comments: Comment[]) => {
      for (let i = 0; i < comments.length; i++) {
        if (comments[i].id === updatedComment.id) {
          comments[i] = updatedComment;
          return true;
        }

        if (comments[i].replies) {
          const found = updateComment(comments[i].replies!);
          if (found) return true;
        }
      }
      return false;
    };

    updateComment(this.comments);
  }
}
