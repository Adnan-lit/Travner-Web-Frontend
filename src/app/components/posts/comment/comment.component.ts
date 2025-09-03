import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Comment, CommentCreate } from '../../../models/comment.model';
import { AuthService } from '../../../services/auth.service';
import { PostService } from '../../../services/post.service';

@Component({
    selector: 'app-comment',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    template: `
    <div class="comment" [class.reply]="isReply" [class.has-replies]="hasReplies">
      <div class="comment-header">
        <div class="comment-author">
          <div class="author-avatar">{{ getInitials(comment?.authorName || '') }}</div>
          <div class="author-info">
            <span class="author-name">{{ comment?.authorName }}</span>
            <span class="comment-date">{{ formatDate(comment?.createdAt || '') }}</span>
          </div>
        </div>
        
        <div class="comment-actions" *ngIf="canModifyComment()">
          <button class="edit-btn" (click)="startEditing()">Edit</button>
          <button class="delete-btn" (click)="deleteComment()">Delete</button>
        </div>
      </div>
      
      <div class="comment-content">
        <!-- Edit Mode -->
        <form *ngIf="isEditing" [formGroup]="commentForm" (ngSubmit)="updateComment()" class="edit-form">
          <textarea 
            formControlName="content" 
            rows="3"
            class="form-control"
          ></textarea>
          
          <div class="form-actions">
            <button type="button" class="cancel-btn" (click)="cancelEdit()">Cancel</button>
            <button type="submit" class="save-btn" [disabled]="commentForm.invalid || updating">
              {{ updating ? 'Updating...' : 'Update' }}
            </button>
          </div>
        </form>
        
        <!-- View Mode -->
        <p *ngIf="!isEditing">{{ comment?.content }}</p>
      </div>
      
      <div class="comment-footer">
        <div class="vote-actions">
          <button 
            class="vote-btn upvote" 
            [class.active]="comment?.hasUserUpvoted" 
            (click)="upvoteComment()"
            [disabled]="comment?.hasUserUpvoted"
          >
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
            </svg>
            <span>{{ comment?.upvotes || 0 }}</span>
          </button>
          
          <button 
            class="vote-btn downvote" 
            [class.active]="comment?.hasUserDownvoted" 
            (click)="downvoteComment()"
            [disabled]="comment?.hasUserDownvoted"
          >
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
            <span>{{ comment?.downvotes || 0 }}</span>
          </button>
        </div>
        
        <button class="reply-btn" (click)="toggleReplyForm()" *ngIf="!isReply">
          {{ showReplyForm ? 'Cancel' : 'Reply' }}
        </button>
      </div>
      
      <!-- Reply Form -->
      <div class="reply-form-container" *ngIf="showReplyForm && !isReply">
        <form [formGroup]="replyForm" (ngSubmit)="submitReply()" class="reply-form">
          <textarea 
            formControlName="content" 
            placeholder="Write a reply..."
            rows="2"
            class="form-control"
          ></textarea>
          
          <div class="form-actions">
            <button type="submit" class="submit-btn" [disabled]="replyForm.invalid || submittingReply">
              {{ submittingReply ? 'Posting...' : 'Post Reply' }}
            </button>
          </div>
        </form>
      </div>
      
      <!-- Nested Replies -->
      <div class="replies" *ngIf="hasReplies">
        <app-comment 
          *ngFor="let reply of replies" 
          [comment]="reply"
          [postId]="postId"
          [isReply]="true"
          (commentUpdated)="onCommentUpdated($event)"
          (commentDeleted)="onCommentDeleted($event)"
        ></app-comment>
      </div>
    </div>
  `,
    styles: [`
    .comment {
      background-color: white;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 15px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .comment.reply {
      margin-left: 40px;
      margin-top: 10px;
      border-left: 3px solid #e1e1e1;
    }
    
    .comment-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    
    .comment-author {
      display: flex;
      align-items: center;
    }
    
    .author-avatar {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background-color: var(--primary-600);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 12px;
      margin-right: 10px;
    }
    
    .author-info {
      display: flex;
      flex-direction: column;
    }
    
    .author-name {
      font-weight: 600;
      font-size: 14px;
    }
    
    .comment-date {
      font-size: 12px;
      color: #777;
    }
    
    .comment-actions {
      display: flex;
    }
    
    .edit-btn, .delete-btn {
      background: none;
      border: none;
      padding: 0;
      font-size: 12px;
      color: #666;
      cursor: pointer;
      margin-left: 10px;
    }
    
    .edit-btn:hover, .delete-btn:hover {
      text-decoration: underline;
    }
    
    .comment-content {
      margin-bottom: 10px;
      font-size: 14px;
      line-height: 1.5;
    }
    
    .edit-form {
      margin-top: 10px;
    }
    
    .form-control {
      width: 100%;
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 8px;
      font-size: 14px;
      font-family: inherit;
      resize: vertical;
    }
    
    .form-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 10px;
    }
    
    .cancel-btn, .save-btn, .submit-btn {
      padding: 6px 12px;
      border-radius: 4px;
      border: none;
      font-size: 12px;
      cursor: pointer;
    }
    
    .cancel-btn {
      background-color: #f1f1f1;
      color: #333;
      margin-right: 10px;
    }
    
    .save-btn, .submit-btn {
      background-color: var(--primary-600);
      color: white;
    }
    
    .comment-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .vote-actions {
      display: flex;
    }
    
    .vote-btn {
      display: flex;
      align-items: center;
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px 8px;
      margin-right: 10px;
      border-radius: 4px;
    }
    
    .vote-btn svg {
      margin-right: 4px;
    }
    
    .vote-btn.active {
      background-color: #f1f1f1;
    }
    
    .vote-btn.upvote.active {
      color: var(--accent-600);
    }
    
    .vote-btn.downvote.active {
      color: var(--error-600);
    }
    
    .reply-btn {
      background: none;
      border: none;
      padding: 4px 8px;
      font-size: 12px;
      color: var(--primary-600);
      cursor: pointer;
    }
    
    .reply-btn:hover {
      text-decoration: underline;
    }
    
    .reply-form-container {
      margin-top: 15px;
      padding-top: 10px;
      border-top: 1px solid #eee;
    }
    
    .replies {
      margin-top: 15px;
      padding-top: 10px;
    }
  `]
})
export class CommentComponent {
    @Input() comment: Comment | null = null;
    @Input() postId: string = '';
    @Input() isReply: boolean = false;

    get hasReplies(): boolean {
        return !!this.comment?.replies && this.comment.replies.length > 0;
    }

    get replies(): Comment[] {
        return this.comment?.replies || [];
    }

    @Output() commentUpdated = new EventEmitter<Comment>();
    @Output() commentDeleted = new EventEmitter<string>();
    @Output() replyAdded = new EventEmitter<Comment>();

    commentForm: FormGroup;
    replyForm: FormGroup;
    isEditing: boolean = false;
    updating: boolean = false;
    showReplyForm: boolean = false;
    submittingReply: boolean = false;

    constructor(
        private formBuilder: FormBuilder,
        private postService: PostService,
        private authService: AuthService
    ) {
        this.commentForm = this.formBuilder.group({
            content: ['', [Validators.required, Validators.minLength(3)]]
        });

        this.replyForm = this.formBuilder.group({
            content: ['', [Validators.required, Validators.minLength(3)]]
        });
    }

    // Utility functions
    getInitials(name: string): string {
        return name
            .split(' ')
            .map(part => part.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }

    formatDate(dateString: string): string {
        if (!dateString) return '';

        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
            if (diffHours === 0) {
                const diffMinutes = Math.floor(diffTime / (1000 * 60));
                return diffMinutes === 0 ? 'just now' : `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
            }
            return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
        } else if (diffDays < 7) {
            return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    // Permission checks
    canModifyComment(): boolean {
        if (!this.comment) return false;

        const currentUser = this.authService.getCurrentUser();
        if (!currentUser) return false;

        return currentUser.id === this.comment.authorId || this.authService.isAdmin();
    }

    // Comment actions
    startEditing(): void {
        if (!this.comment) return;

        this.commentForm.patchValue({
            content: this.comment.content
        });

        this.isEditing = true;
    }

    cancelEdit(): void {
        this.isEditing = false;
    }

    updateComment(): void {
        if (!this.comment || this.commentForm.invalid) return;

        this.updating = true;
        const commentUpdate = {
            content: this.commentForm.value.content
        };

        this.postService.updateComment(this.postId, this.comment.id, commentUpdate)
            .subscribe({
                next: (updatedComment) => {
                    this.isEditing = false;
                    this.updating = false;

                    // Update the local comment with new data
                    Object.assign(this.comment as Comment, updatedComment);

                    // Emit event to notify parent
                    this.commentUpdated.emit(updatedComment);
                },
                error: (error) => {
                    console.error('Error updating comment:', error);
                    this.updating = false;
                }
            });
    }

    deleteComment(): void {
        if (!this.comment || !confirm('Are you sure you want to delete this comment?')) return;

        this.postService.deleteComment(this.postId, this.comment.id)
            .subscribe({
                next: () => {
                    // Emit event to notify parent
                    this.commentDeleted.emit(this.comment?.id);
                },
                error: (error) => {
                    console.error('Error deleting comment:', error);
                }
            });
    }

    // Voting
    upvoteComment(): void {
        if (!this.comment) return;

        this.postService.upvoteComment(this.postId, this.comment.id)
            .subscribe({
                next: (updatedComment) => {
                    // Update the local comment with new data
                    Object.assign(this.comment as Comment, updatedComment);

                    // Emit event to notify parent
                    this.commentUpdated.emit(updatedComment);
                },
                error: (error) => {
                    console.error('Error upvoting comment:', error);
                }
            });
    }

    downvoteComment(): void {
        if (!this.comment) return;

        this.postService.downvoteComment(this.postId, this.comment.id)
            .subscribe({
                next: (updatedComment) => {
                    // Update the local comment with new data
                    Object.assign(this.comment as Comment, updatedComment);

                    // Emit event to notify parent
                    this.commentUpdated.emit(updatedComment);
                },
                error: (error) => {
                    console.error('Error downvoting comment:', error);
                }
            });
    }

    // Reply handling
    toggleReplyForm(): void {
        this.showReplyForm = !this.showReplyForm;

        if (this.showReplyForm) {
            this.replyForm.reset();
        }
    }

    submitReply(): void {
        if (!this.comment || this.replyForm.invalid) return;

        this.submittingReply = true;
        const replyData: CommentCreate = {
            content: this.replyForm.value.content,
            parentId: this.comment.id
        };

        this.postService.createComment(this.postId, replyData)
            .subscribe({
                next: (newReply) => {
                    this.submittingReply = false;
                    this.showReplyForm = false;
                    this.replyForm.reset();

                    // Initialize replies array if it doesn't exist
                    if (!this.comment!.replies) {
                        this.comment!.replies = [];
                    }

                    // Add the new reply to the local comment
                    this.comment!.replies!.push(newReply);

                    // Emit event to notify parent
                    this.replyAdded.emit(newReply);
                },
                error: (error) => {
                    console.error('Error posting reply:', error);
                    this.submittingReply = false;
                }
            });
    }

    // Event handlers from child comments
    onCommentUpdated(updatedComment: Comment): void {
        // Pass the event up to the parent
        this.commentUpdated.emit(updatedComment);
    }

    onCommentDeleted(commentId: string): void {
        // Remove the deleted comment from the replies
        if (this.comment?.replies) {
            const index = this.comment.replies.findIndex(reply => reply.id === commentId);
            if (index !== -1) {
                this.comment.replies.splice(index, 1);
            }
        }

        // Pass the event up to the parent
        this.commentDeleted.emit(commentId);
    }
}
