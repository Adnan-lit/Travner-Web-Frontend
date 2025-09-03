import { Component, EventEmitter, Input, OnInit, OnDestroy, AfterViewInit, ElementRef, Renderer2, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Post, PostCreate, PostUpdate } from '../../../models/post.model';
import { PostService } from '../../../services/post.service';
import { CursorService } from '../../../services/cursor.service';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-post-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="post-form-container">
      <h3 class="form-title">{{ isEditMode ? 'Edit Travel Post' : 'Create New Travel Post' }}</h3>
      
      <form [formGroup]="postForm" (ngSubmit)="onSubmit()" class="post-form">
        <div class="form-group">
          <label for="title">Title</label>
          <input 
            type="text" 
            id="title" 
            formControlName="title" 
            placeholder="Give your travel experience a title"
            class="form-control"
          >
          <div class="error-message" *ngIf="submitted && f['title'].errors">
            <span *ngIf="f['title'].errors['required']">Title is required</span>
            <span *ngIf="f['title'].errors['minlength']">Title must be at least 3 characters</span>
          </div>
        </div>
        
        <div class="form-group">
          <label for="content">Content</label>
          <textarea 
            id="content" 
            formControlName="content" 
            placeholder="Describe your travel experience..."
            rows="5" 
            class="form-control textarea"
          ></textarea>
          <div class="error-message" *ngIf="submitted && f['content'].errors">
            <span *ngIf="f['content'].errors['required']">Content is required</span>
            <span *ngIf="f['content'].errors['minlength']">Content must be at least 10 characters</span>
          </div>
        </div>
        
        <div class="form-group">
          <label for="location">Location</label>
          <input 
            type="text" 
            id="location" 
            formControlName="location" 
            placeholder="Where did you travel to?"
            class="form-control"
          >
          <div class="error-message" *ngIf="submitted && f['location'].errors">
            <span *ngIf="f['location'].errors['required']">Location is required</span>
          </div>
        </div>
        
        <div class="form-group">
          <label for="tags">Tags (comma-separated)</label>
          <input 
            type="text" 
            id="tags" 
            formControlName="tags" 
            placeholder="beach, mountain, food, adventure..."
            class="form-control"
          >
          <div class="tags-preview" *ngIf="tagsArray.length > 0">
            <span class="tag" *ngFor="let tag of tagsArray">{{ tag }}</span>
          </div>
        </div>
        
        <div class="form-group" *ngIf="!isEditMode">
          <label for="media">Media (Images/Videos)</label>
          <input 
            type="file" 
            id="media" 
            multiple
            accept="image/jpeg,image/png,image/gif,video/mp4,video/quicktime"
            (change)="onFileSelect($event)"
            class="form-control file-input"
          >
          <div class="file-info" *ngIf="selectedFiles.length > 0">
            {{ selectedFiles.length }} file(s) selected
          </div>
          <div class="media-previews" *ngIf="selectedFiles.length > 0">
            <div *ngFor="let file of selectedFiles" class="media-preview">
              <img *ngIf="isImage(file)" [src]="getFilePreviewUrl(file)" alt="Preview" class="preview-image">
              <div *ngIf="isVideo(file)" class="video-preview">
                <span class="file-name">{{ file.name }}</span>
                <span class="file-type">{{ getFileSize(file) }}</span>
              </div>
            </div>
          </div>
          <div class="error-message" *ngIf="fileError">
            {{ fileError }}
          </div>
          <div class="media-size-info">
            Max file size: 20MB, supported formats: JPG, PNG, GIF, MP4, MOV
          </div>
        </div>
        
        <div class="form-group">
          <label for="published" class="checkbox-label">
            <input 
              type="checkbox" 
              id="published" 
              formControlName="published"
              class="checkbox-input"
            >
            <span class="checkbox-text">Publish immediately</span>
          </label>
        </div>
        
        <div class="form-actions">
          <button type="button" class="cancel-btn" (click)="onCancel()">Cancel</button>
          <button type="submit" class="submit-btn">{{ isEditMode ? 'Update Post' : 'Share Post' }}</button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .post-form-container {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      padding: 20px;
      margin-bottom: 30px;
    }
    
    .form-title {
      margin-top: 0;
      margin-bottom: 20px;
      color: #333;
      font-size: 18px;
      text-align: center;
    }
    
    .post-form {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }
    
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    
    label {
      font-weight: 500;
      color: #555;
      font-size: 14px;
    }
    
    .form-control {
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 15px;
    }
    
    .textarea {
      resize: vertical;
      min-height: 80px;
    }
    
    .file-input {
      padding: 8px;
    }
    
    .file-info {
      font-size: 12px;
      color: #666;
      margin-top: 5px;
    }
    
    .media-size-info {
      font-size: 12px;
      color: #888;
      margin-top: 5px;
    }
    
    .error-message {
      color: #f44336;
      font-size: 12px;
      margin-top: 4px;
    }
    
    .tags-preview {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      margin-top: 8px;
    }
    
    .tag {
      background-color: #eaf4eb;
      color: #4caf50;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      border: 1px solid #d7e7d8;
    }
    
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 10px;
    }
    
    .submit-btn, .cancel-btn {
      padding: 10px 15px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
    }
    
    .submit-btn {
      background-color: #4CAF50;
      color: white;
    }
    
    .cancel-btn {
      background-color: #f1f1f1;
      color: #333;
    }
    
    .submit-btn:hover {
      background-color: #45a049;
    }
    
    .cancel-btn:hover {
      background-color: #e1e1e1;
    }
    
    .checkbox-label {
      display: flex;
      align-items: center;
      cursor: pointer;
    }
    
    .checkbox-input {
      margin-right: 8px;
    }
    
    .checkbox-text {
      font-size: 14px;
    }
    
    .media-previews {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 10px;
    }
    
    .media-preview {
      width: 100px;
      height: 100px;
      border: 1px solid #ddd;
      border-radius: 4px;
      overflow: hidden;
      position: relative;
    }
    
    .preview-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .video-preview {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background-color: #f5f5f5;
      padding: 10px;
    }
    
    .file-name {
      font-size: 11px;
      font-weight: 500;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
      max-width: 90px;
      text-align: center;
    }
    
    .file-type {
      font-size: 10px;
      color: #666;
      margin-top: 5px;
    }
  `]
})
export class PostFormComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() postId: string | null = null;
  @Input() isEditMode: boolean = false;

  @Output() postSubmitted = new EventEmitter<Post>();
  @Output() cancelled = new EventEmitter<void>();

  postForm!: FormGroup;
  submitted = false;
  loading = false;
  selectedFiles: File[] = [];
  fileError: string | null = null;
  private destroy$ = new Subject<void>();
  private filePreviewUrls: string[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private postService: PostService,
    private el: ElementRef,
    private renderer: Renderer2,
    private cursorService: CursorService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.cursorService.initializeCursor(this.renderer, this.el);

    if (this.isEditMode && this.postId) {
      this.loadPostData();
    }
  }

  ngAfterViewInit(): void {
    // Add any additional initialization that needs to happen after the view is initialized
  }

  ngOnDestroy(): void {
    this.cursorService.cleanup(this.renderer);

    // Clean up any created object URLs
    this.filePreviewUrls.forEach(url => {
      URL.revokeObjectURL(url);
    });

    this.destroy$.next();
    this.destroy$.complete();
  }

  get f() { return this.postForm.controls; }

  get tagsArray(): string[] {
    const tagsValue = this.postForm.get('tags')?.value || '';
    if (!tagsValue) return [];

    return tagsValue
      .split(',')
      .map((tag: string) => tag.trim())
      .filter((tag: string) => tag.length > 0);
  }

  initForm(): void {
    this.postForm = this.formBuilder.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      content: ['', [Validators.required, Validators.minLength(5)]], // Reduced from 10 to 5 characters
      location: ['', [Validators.required]],
      tags: [''],
      published: [true] // Default to true - published immediately
    });
  }

  loadPostData(): void {
    if (!this.postId) return;

    this.postService.getPostById(this.postId).subscribe({
      next: (post) => {
        this.postForm.patchValue({
          title: post.title,
          content: post.content,
          location: post.location,
          tags: post.tags.join(', '),
          published: post.published !== undefined ? post.published : true
        });
      },
      error: (error) => {
        console.error('Error loading post data:', error);
      }
    });
  }

  onFileSelect(event: Event): void {
    console.log('File selection event triggered');
    const inputElement = event.target as HTMLInputElement;
    if (inputElement.files) {
      const files = Array.from(inputElement.files);
      console.log('Files selected:', files.map(f => ({
        name: f.name,
        size: f.size,
        type: f.type
      })));
      this.validateFiles(files);
    } else {
      console.log('No files found in input element');
    }
  }

  validateFiles(files: File[]): void {
    console.log('Validating files:', files.map(f => f.name));
    this.fileError = null;

    // Clean up previous preview URLs
    this.filePreviewUrls.forEach(url => {
      URL.revokeObjectURL(url);
    });
    this.filePreviewUrls = [];
    this.selectedFiles = [];

    // Check file size limit (20MB)
    const MAX_SIZE = 20 * 1024 * 1024; // 20MB
    const oversizedFiles = files.filter(file => file.size > MAX_SIZE);

    if (oversizedFiles.length > 0) {
      this.fileError = `Some files exceed the 20MB size limit: ${oversizedFiles.map(f => f.name).join(', ')}`;
      console.error('File validation failed - oversized files:', oversizedFiles);
      return;
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime'];
    const invalidFiles = files.filter(file => !allowedTypes.includes(file.type));

    if (invalidFiles.length > 0) {
      this.fileError = `Some files have unsupported formats: ${invalidFiles.map(f => f.name).join(', ')}. Supported formats: JPG, PNG, GIF, MP4, MOV.`;
      console.error('File validation failed - invalid file types:', invalidFiles);
      return;
    }

    // If all validations pass, add files and create preview URLs
    this.selectedFiles = files;
    console.log('File validation passed. Selected files count:', this.selectedFiles.length);
    files.forEach(file => {
      if (this.isImage(file)) {
        const previewUrl = URL.createObjectURL(file);
        this.filePreviewUrls.push(previewUrl);
        console.log('Created preview URL for image:', file.name);
      }
    });
  }

  onSubmit(): void {
    console.log('onSubmit() called');
    this.submitted = true;
    console.log('Form valid:', this.postForm.valid);
    console.log('Form errors:', this.postForm.errors);
    console.log('Form values:', this.postForm.value);

    // Check each field for errors
    Object.keys(this.postForm.controls).forEach(key => {
      const control = this.postForm.get(key);
      if (control && control.errors) {
        console.log(`${key} errors:`, control.errors);
      }
    });

    // Stop if form is invalid
    if (this.postForm.invalid) {
      console.log('Form is invalid, stopping submission');
      return;
    }

    console.log('Form is valid, proceeding with submission');
    this.loading = true;

    // Process tags
    const tags = this.tagsArray;

    if (this.isEditMode && this.postId) {
      const updateData: PostUpdate = {
        title: this.f['title'].value,
        content: this.f['content'].value,
        location: this.f['location'].value,
        tags: tags,
        published: this.f['published'].value
      };

      this.postService.updatePost(this.postId, updateData).subscribe({
        next: (updatedPost) => {
          this.loading = false;
          this.postSubmitted.emit(updatedPost);
        },
        error: (error) => {
          console.error('Error updating post:', error);
          this.loading = false;
        }
      });
    } else {
      const createData: PostCreate = {
        title: this.f['title'].value,
        content: this.f['content'].value,
        location: this.f['location'].value,
        tags: tags,
        published: this.f['published'].value
      };

      this.postService.createPost(createData).subscribe({
        next: (newPost) => {
          console.log('Post created successfully:', newPost);

          // If we have files to upload, upload them one by one
          if (this.selectedFiles.length > 0) {
            console.log(`Starting file uploads for post ${newPost.id}. Files to upload:`,
              this.selectedFiles.map(f => ({
                name: f.name,
                size: f.size,
                type: f.type
              }))
            );

            // Upload files one by one since the API expects single file uploads
            const uploadPromises = this.selectedFiles.map((file, index) => {
              console.log(`Uploading file ${index + 1}/${this.selectedFiles.length}: ${file.name}`);
              return this.postService.uploadMedia(newPost.id, [file]).toPromise();
            });

            Promise.all(uploadPromises).then((results) => {
              console.log('All files uploaded successfully:', results);
              this.loading = false;
              this.postSubmitted.emit(newPost);
            }).catch((error) => {
              console.error('Error uploading media:', error);
              this.loading = false;
              // Still emit the post as it was created successfully
              this.postSubmitted.emit(newPost);
            });
          } else {
            console.log('No files to upload, completing post creation');
            this.loading = false;
            this.postSubmitted.emit(newPost);
          }
        },
        error: (error) => {
          console.error('Error creating post:', error);
          this.loading = false;
        }
      });
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  // File handling methods
  isImage(file: File): boolean {
    return file.type.startsWith('image/');
  }

  isVideo(file: File): boolean {
    return file.type.startsWith('video/');
  }

  getFilePreviewUrl(file: File): string {
    const index = this.selectedFiles.indexOf(file);
    if (index >= 0 && index < this.filePreviewUrls.length) {
      return this.filePreviewUrls[index];
    }
    // Fallback to creating a new URL (should not happen with proper management)
    return URL.createObjectURL(file);
  }

  getFileSize(file: File): string {
    const sizeInMB = file.size / (1024 * 1024);
    return `${sizeInMB.toFixed(2)} MB`;
  }
}
