import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { PostService } from '../../../services/post.service';
import { AuthService } from '../../../services/auth.service';
import { MediaService, MediaFile } from '../../../services/media.service';
import { MediaUploadComponent } from '../../media/media-upload/media-upload.component';

@Component({
  selector: 'app-post-create',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MediaUploadComponent],
  template: `
    <div class="post-create-container">
      <div class="post-create-header">
        <h2>Create New Post</h2>
        <p>Share your travel experiences with the community</p>
      </div>

      <form [formGroup]="postForm" (ngSubmit)="onSubmit()" class="post-form">
        <!-- Title Field -->
        <div class="form-group">
          <label for="title" class="form-label">Title *</label>
          <input
            type="text"
            id="title"
            formControlName="title"
            class="form-input"
            placeholder="Enter a compelling title for your post"
            [class.error]="postForm.get('title')?.invalid && postForm.get('title')?.touched"
          />
          <div class="form-error" *ngIf="postForm.get('title')?.invalid && postForm.get('title')?.touched">
            <span *ngIf="postForm.get('title')?.errors?.['required']">Title is required</span>
            <span *ngIf="postForm.get('title')?.errors?.['minlength']">Title must be at least 3 characters</span>
            <span *ngIf="postForm.get('title')?.errors?.['maxlength']">Title must be less than 100 characters</span>
          </div>
        </div>

        <!-- Content Field -->
        <div class="form-group">
          <label for="content" class="form-label">Content *</label>
          <textarea
            id="content"
            formControlName="content"
            class="form-textarea"
            placeholder="Share your travel story, tips, or experiences..."
            rows="6"
            [class.error]="postForm.get('content')?.invalid && postForm.get('content')?.touched"
          ></textarea>
          <div class="form-error" *ngIf="postForm.get('content')?.invalid && postForm.get('content')?.touched">
            <span *ngIf="postForm.get('content')?.errors?.['required']">Content is required</span>
            <span *ngIf="postForm.get('content')?.errors?.['minlength']">Content must be at least 10 characters</span>
    </div>
  </div>

        <!-- Location Field -->
        <div class="form-group">
          <label for="location" class="form-label">Location</label>
          <input
            type="text"
            id="location"
            formControlName="location"
            class="form-input"
            placeholder="Where did this happen? (e.g., Paris, France)"
          />
        </div>

        <!-- Tags Field -->
        <div class="form-group">
          <label for="tags" class="form-label">Tags</label>
          <input
            type="text"
            id="tags"
            formControlName="tags"
            class="form-input"
            placeholder="Enter tags separated by commas (e.g., adventure, hiking, nature)"
          />
          <div class="form-hint">Separate multiple tags with commas</div>
        </div>

        <!-- Media Upload Section -->
        <div class="form-group">
          <label class="form-label">Media</label>
          <app-media-upload
            [entityType]="'post'"
            [maxFiles]="10"
            (filesUploaded)="onMediaUploaded($event)"
            (uploadComplete)="onMediaUploadComplete()"
            (uploadError)="onMediaUploadError($event)"
          ></app-media-upload>
        </div>

        <!-- Form Actions -->
        <div class="form-actions">
          <button
            type="button"
            class="btn btn-secondary"
            (click)="onCancel()"
            [disabled]="isSubmitting"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            [disabled]="postForm.invalid || isSubmitting"
          >
            <span *ngIf="!isSubmitting">Create Post</span>
            <span *ngIf="isSubmitting" class="loading">
              <svg class="spinner" width="16" height="16" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="4" fill="none"/>
              </svg>
              Creating...
            </span>
          </button>
        </div>
      </form>

      <!-- Error Message -->
      <div class="error-message" *ngIf="errorMessage">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
        {{ errorMessage }}
      </div>
    </div>
  `,
  styleUrls: ['./post-create.component.css']
})
export class PostCreateComponent implements OnInit, OnDestroy {
  postForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  uploadedMedia: MediaFile[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private postService: PostService,
    private authService: AuthService,
    private router: Router
  ) {
    this.postForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      content: ['', [Validators.required, Validators.minLength(10)]],
      location: [''],
      tags: ['']
    });
  }

  ngOnInit(): void {
    // Check if user is authenticated
    this.authService.isAuthenticated$.pipe(
      takeUntil(this.destroy$)
    ).subscribe((isAuthenticated: boolean) => {
      if (!isAuthenticated) {
        this.router.navigate(['/signin']);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit(): void {
    if (this.postForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      this.errorMessage = '';

      const formValue = this.postForm.value;
      
      // Process tags
      const tags = formValue.tags 
        ? formValue.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0)
        : [];

      const postData = {
        title: formValue.title,
        content: formValue.content,
        location: formValue.location || null,
        tags: tags,
        published: true
      };

      this.postService.createPost(postData).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (response: any) => {
          if (response.success && response.data) {
            const postId = response.data.id;
            
            // If there are uploaded media files, associate them with the post
            if (this.uploadedMedia.length > 0) {
              this.associateMediaWithPost(postId);
            } else {
              this.onPostCreated();
            }
          } else {
            this.errorMessage = response.message || 'Failed to create post';
            this.isSubmitting = false;
          }
        },
        error: (error: any) => {
          console.error('Error creating post:', error);
          this.errorMessage = error.error?.message || 'Failed to create post';
          this.isSubmitting = false;
        }
      });
    }
  }

  private associateMediaWithPost(postId: string): void {
    // Update media files to associate them with the post
    // This would typically be done by updating the media entities with the post ID
    // For now, we'll assume the media service handles this automatically
    this.onPostCreated();
  }

  private onPostCreated(): void {
    this.isSubmitting = false;
    this.router.navigate(['/posts']);
  }

  onMediaUploaded(mediaFiles: MediaFile[]): void {
    this.uploadedMedia = mediaFiles;
    console.log('Media uploaded:', mediaFiles);
  }

  onMediaUploadComplete(): void {
    console.log('Media upload complete');
  }

  onMediaUploadError(error: string): void {
    this.errorMessage = `Media upload error: ${error}`;
  }

  onCancel(): void {
    this.router.navigate(['/posts']);
  }
}