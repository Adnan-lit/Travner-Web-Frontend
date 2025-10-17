import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MediaService, MediaFile } from '../../../services/media.service';

export interface MediaUploadItem {
  file: File;
  preview?: string;
  uploading: boolean;
  uploaded?: boolean;
  error?: string;
  mediaId?: string;
  progress?: number;
}

@Component({
  selector: 'app-media-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="media-upload-container">
      <!-- Upload Area -->
      <div 
        class="upload-area"
        [class.drag-over]="isDragOver"
        [class.uploading]="isUploading"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
        (click)="fileInput.click()"
      >
        <div class="upload-content" *ngIf="!isUploading">
          <div class="upload-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7,10 12,15 17,10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </div>
          <h3>Upload Media</h3>
          <p>Drag and drop files here or click to browse</p>
          <div class="upload-formats">
            <span class="format-tag">JPG</span>
            <span class="format-tag">PNG</span>
            <span class="format-tag">GIF</span>
            <span class="format-tag">WebP</span>
            <span class="format-tag">MP4</span>
            <span class="format-tag">WebM</span>
          </div>
          <p class="upload-limit">Max file size: 10MB</p>
        </div>

        <div class="upload-progress" *ngIf="isUploading">
          <div class="progress-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 6v6l4 2"></path>
            </svg>
          </div>
          <h3>Uploading...</h3>
          <div class="progress-bar">
            <div class="progress-fill" [style.width.%]="overallProgress"></div>
          </div>
          <p>{{ uploadCount }} of {{ totalFiles }} files</p>
        </div>

        <input 
          #fileInput
          type="file"
          multiple
          accept="image/*,video/*"
          (change)="onFileSelect($event)"
          style="display: none;"
        />
      </div>

      <!-- Uploaded Files Preview -->
      <div class="uploaded-files" *ngIf="uploadedFiles.length > 0">
        <div class="files-header">
          <h4>Uploaded Files ({{ uploadedFiles.length }})</h4>
          <button 
            type="button" 
            class="clear-btn"
            (click)="clearAll()"
            *ngIf="uploadedFiles.length > 0"
          >
            Clear All
          </button>
        </div>
        
        <div class="files-grid">
          <div 
            class="file-item"
            *ngFor="let item of uploadedFiles; let i = index"
            [class.uploading]="item.uploading"
            [class.uploaded]="item.uploaded"
            [class.error]="item.error"
          >
            <!-- File Preview -->
            <div class="file-preview">
              <img 
                *ngIf="item.preview && isImage(item.file)"
                [src]="item.preview" 
                [alt]="item.file.name"
                class="preview-image"
              />
              <div 
                *ngIf="isVideo(item.file) && !item.preview"
                class="video-placeholder"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
              <div 
                *ngIf="!item.preview && !isVideo(item.file)"
                class="file-icon"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
              </div>
            </div>

            <!-- File Info -->
            <div class="file-info">
              <div class="file-name" [title]="item.file.name">
                {{ item.file.name }}
              </div>
              <div class="file-size">
                {{ formatFileSize(item.file.size) }}
              </div>
              <div class="file-type">
                {{ getFileType(item.file) }}
              </div>
            </div>

            <!-- Upload Progress -->
            <div class="upload-status" *ngIf="item.uploading">
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  [style.width.%]="item.progress || 0"
                ></div>
              </div>
              <span class="progress-text">{{ item.progress || 0 }}%</span>
            </div>

            <!-- Upload Success -->
            <div class="upload-success" *ngIf="item.uploaded">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20,6 9,17 4,12"></polyline>
              </svg>
              <span>Uploaded</span>
            </div>

            <!-- Upload Error -->
            <div class="upload-error" *ngIf="item.error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
              <span>{{ item.error }}</span>
            </div>

            <!-- Remove Button -->
            <button 
              type="button"
              class="remove-btn"
              (click)="removeFile(i)"
              [disabled]="item.uploading"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./media-upload.component.css']
})
export class MediaUploadComponent implements OnInit, OnDestroy {
  @Input() entityId?: string;
  @Input() entityType: string = 'post';
  @Input() maxFiles: number = 10;
  @Input() maxFileSize: number = 10 * 1024 * 1024; // 10MB
  
  @Output() filesUploaded = new EventEmitter<MediaFile[]>();
  @Output() uploadProgress = new EventEmitter<number>();
  @Output() uploadComplete = new EventEmitter<void>();
  @Output() uploadError = new EventEmitter<string>();

  uploadedFiles: MediaUploadItem[] = [];
  isDragOver = false;
  isUploading = false;
  overallProgress = 0;
  uploadCount = 0;
  totalFiles = 0;

  private destroy$ = new Subject<void>();

  constructor(private mediaService: MediaService) {}

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFiles(Array.from(files));
    }
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFiles(Array.from(input.files));
    }
  }

  private async handleFiles(files: File[]): Promise<void> {
    // Validate file count
    if (this.uploadedFiles.length + files.length > this.maxFiles) {
      this.uploadError.emit(`Maximum ${this.maxFiles} files allowed`);
      return;
    }

    // Validate and create previews
    const validFiles: MediaUploadItem[] = [];
    
    for (const file of files) {
      const validation = this.mediaService.validateFile(file);
      if (!validation.valid) {
        this.uploadError.emit(validation.error || 'Invalid file');
        continue;
      }

      const item: MediaUploadItem = {
        file,
        uploading: false,
        uploaded: false,
        progress: 0
      };

      // Create preview
      try {
        if (this.isImage(file)) {
          item.preview = await this.mediaService.createImagePreview(file);
        } else if (this.isVideo(file)) {
          item.preview = await this.mediaService.createVideoThumbnail(file);
        }
      } catch (error) {
        console.warn('Could not create preview for file:', file.name);
      }

      validFiles.push(item);
    }

    this.uploadedFiles.push(...validFiles);
    this.uploadFiles(validFiles);
  }

  private uploadFiles(files: MediaUploadItem[]): void {
    this.isUploading = true;
    this.totalFiles = files.length;
    this.uploadCount = 0;
    this.overallProgress = 0;

    const uploadedMedia: MediaFile[] = [];

    files.forEach((item, index) => {
      item.uploading = true;
      item.progress = 0;

      this.mediaService.uploadMedia(item.file, this.entityType, this.entityId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (media) => {
            item.uploading = false;
            item.uploaded = true;
            item.mediaId = media.id;
            item.progress = 100;
            
            uploadedMedia.push(media.data);
            this.uploadCount++;
            this.updateOverallProgress();
            
            if (this.uploadCount === this.totalFiles) {
              this.isUploading = false;
              this.filesUploaded.emit(uploadedMedia);
              this.uploadComplete.emit();
            }
          },
          error: (error) => {
            item.uploading = false;
            item.error = error.message || 'Upload failed';
            item.progress = 0;
            
            this.uploadCount++;
            this.updateOverallProgress();
            
            if (this.uploadCount === this.totalFiles) {
              this.isUploading = false;
              if (uploadedMedia.length > 0) {
                this.filesUploaded.emit(uploadedMedia);
              }
              this.uploadComplete.emit();
            }
          }
        });
    });
  }

  private updateOverallProgress(): void {
    const totalProgress = this.uploadedFiles.reduce((sum, item) => sum + (item.progress || 0), 0);
    this.overallProgress = Math.round(totalProgress / this.uploadedFiles.length);
    this.uploadProgress.emit(this.overallProgress);
  }

  removeFile(index: number): void {
    this.uploadedFiles.splice(index, 1);
  }

  clearAll(): void {
    this.uploadedFiles = [];
    this.overallProgress = 0;
    this.uploadCount = 0;
    this.totalFiles = 0;
  }

  isImage(file: File): boolean {
    return file.type.startsWith('image/');
  }

  isVideo(file: File): boolean {
    return file.type.startsWith('video/');
  }

  getFileType(file: File): string {
    return file.type.split('/')[1]?.toUpperCase() || 'FILE';
  }

  formatFileSize(bytes: number): string {
    return this.mediaService.formatFileSize(bytes);
  }
}

