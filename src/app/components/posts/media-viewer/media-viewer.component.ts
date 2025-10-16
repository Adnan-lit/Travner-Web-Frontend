import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-media-viewer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="media-viewer-overlay" *ngIf="isOpen" (click)="close()">
      <div class="media-viewer-container" (click)="$event.stopPropagation()">
        <!-- Close Button -->
        <button class="close-btn" (click)="close()">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <!-- Navigation Arrows -->
        <button class="nav-btn prev-btn" (click)="previous()" *ngIf="mediaItems.length > 1">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15,18 9,12 15,6"></polyline>
          </svg>
        </button>
        
        <button class="nav-btn next-btn" (click)="next()" *ngIf="mediaItems.length > 1">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9,18 15,12 9,6"></polyline>
          </svg>
        </button>

        <!-- Media Content -->
        <div class="media-content">
          <img *ngIf="currentMedia?.type === 'image' || !currentMedia?.type" 
               [src]="currentMedia?.url" 
               [alt]="currentMedia?.caption || 'Media'"
               (error)="handleImageError($event)"
               class="media-image">
          
          <video *ngIf="currentMedia?.type === 'video'" 
                 [src]="currentMedia?.url" 
                 controls 
                 class="media-video">
            Your browser does not support the video tag.
          </video>
        </div>

        <!-- Media Info -->
        <div class="media-info" *ngIf="currentMedia">
          <h3 class="media-title">{{ currentMedia.caption || 'Untitled' }}</h3>
          <p class="media-counter" *ngIf="mediaItems.length > 1">
            {{ currentIndex + 1 }} of {{ mediaItems.length }}
          </p>
        </div>

        <!-- Thumbnail Navigation -->
        <div class="thumbnail-nav" *ngIf="mediaItems.length > 1">
          <div class="thumbnail-item" 
               *ngFor="let item of mediaItems; let i = index"
               [class.active]="i === currentIndex"
               (click)="goToMedia(i)">
            <img [src]="item.url" [alt]="item.caption || 'Media'">
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .media-viewer-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      backdrop-filter: blur(10px);
    }

    .media-viewer-container {
      position: relative;
      max-width: 90vw;
      max-height: 90vh;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
    }

    .close-btn {
      position: absolute;
      top: 16px;
      right: 16px;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      border: none;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 10001;
      transition: all 0.3s ease;
    }

    .close-btn:hover {
      background: rgba(0, 0, 0, 0.9);
      transform: scale(1.1);
    }

    .nav-btn {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(0, 0, 0, 0.7);
      color: white;
      border: none;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 10001;
      transition: all 0.3s ease;
    }

    .prev-btn {
      left: 16px;
    }

    .next-btn {
      right: 16px;
    }

    .nav-btn:hover {
      background: rgba(0, 0, 0, 0.9);
      transform: translateY(-50%) scale(1.1);
    }

    .media-content {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      max-height: 70vh;
    }

    .media-image,
    .media-video {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      border-radius: 8px;
    }

    .media-info {
      padding: 16px 20px;
      background: white;
      border-top: 1px solid #e0e0e0;
    }

    .media-title {
      margin: 0 0 8px 0;
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }

    .media-counter {
      margin: 0;
      font-size: 14px;
      color: #666;
    }

    .thumbnail-nav {
      display: flex;
      gap: 8px;
      padding: 16px 20px;
      background: #f8f9fa;
      border-top: 1px solid #e0e0e0;
      overflow-x: auto;
    }

    .thumbnail-item {
      flex-shrink: 0;
      width: 60px;
      height: 60px;
      border-radius: 8px;
      overflow: hidden;
      cursor: pointer;
      border: 2px solid transparent;
      transition: all 0.3s ease;
    }

    .thumbnail-item.active {
      border-color: #007bff;
    }

    .thumbnail-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .thumbnail-item:hover {
      transform: scale(1.05);
    }

    @media (max-width: 768px) {
      .media-viewer-container {
        max-width: 95vw;
        max-height: 95vh;
      }

      .nav-btn {
        width: 40px;
        height: 40px;
      }

      .prev-btn {
        left: 8px;
      }

      .next-btn {
        right: 8px;
      }

      .close-btn {
        top: 8px;
        right: 8px;
        width: 36px;
        height: 36px;
      }
    }
  `]
})
export class MediaViewerComponent implements OnInit, OnDestroy {
  @Input() isOpen = false;
  @Input() mediaItems: any[] = [];
  @Input() initialIndex = 0;
  @Output() closed = new EventEmitter<void>();

  currentIndex = 0;
  currentMedia: any = null;

  ngOnInit(): void {
    this.currentIndex = this.initialIndex;
    this.updateCurrentMedia();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  updateCurrentMedia(): void {
    if (this.mediaItems && this.mediaItems.length > 0) {
      this.currentMedia = this.mediaItems[this.currentIndex];
    }
  }

  next(): void {
    if (this.mediaItems.length > 1) {
      this.currentIndex = (this.currentIndex + 1) % this.mediaItems.length;
      this.updateCurrentMedia();
    }
  }

  previous(): void {
    if (this.mediaItems.length > 1) {
      this.currentIndex = this.currentIndex === 0 ? this.mediaItems.length - 1 : this.currentIndex - 1;
      this.updateCurrentMedia();
    }
  }

  goToMedia(index: number): void {
    this.currentIndex = index;
    this.updateCurrentMedia();
  }

  close(): void {
    this.closed.emit();
  }

  handleImageError(event: any): void {
    console.error('Failed to load media:', event);
    event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk1lZGlhIG5vdCBhdmFpbGFibGU8L3RleHQ+PC9zdmc+';
  }
}

