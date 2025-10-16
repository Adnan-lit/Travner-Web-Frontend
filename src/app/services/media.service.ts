import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiResponse } from '../models/api-response.model';

export interface MediaFile {
  id: string;
  filename: string;
  originalFilename: string;
  contentType: string;
  size: number;
  uploadedBy: string;
  type: string;
  entityId?: string;
  uploadedAt: string;
  downloadUrl: string;
  gridFsId: string;
}

export interface MediaUploadResponse {
  id: string;
  filename: string;
  originalFilename: string;
  contentType: string;
  size: number;
  uploadedBy: string;
  type: string;
  entityId?: string;
  uploadedAt: string;
  downloadUrl: string;
  gridFsId: string;
}

@Injectable({
  providedIn: 'root'
})
export class MediaService {
  private readonly API_BASE_URL = '/api/media';

  constructor(private http: HttpClient) {}

  /**
   * Upload a media file to the backend
   */
  uploadMedia(file: File, type: string = 'post', entityId?: string): Observable<MediaUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    if (entityId) {
      formData.append('entityId', entityId);
    }

    return this.http.post<ApiResponse<MediaUploadResponse>>(`${this.API_BASE_URL}/upload`, formData).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Upload failed');
      }),
      catchError(error => {
        console.error('Media upload error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get media files for a specific post
   */
  getMediaForPost(postId: string): Observable<MediaFile[]> {
    return this.http.get<ApiResponse<MediaFile[]>>(`${this.API_BASE_URL}/posts/${postId}`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        return [];
      }),
      catchError(error => {
        console.error('Error fetching media for post:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get media file by ID
   */
  getMediaById(mediaId: string): Observable<MediaFile> {
    return this.http.get<ApiResponse<MediaFile>>(`${this.API_BASE_URL}/${mediaId}`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Media not found');
      }),
      catchError(error => {
        console.error('Error fetching media:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete a media file
   */
  deleteMedia(mediaId: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.API_BASE_URL}/${mediaId}`).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Delete failed');
        }
      }),
      catchError(error => {
        console.error('Error deleting media:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get media file URL for display
   */
  getMediaUrl(mediaId: string): string {
    return `${this.API_BASE_URL}/${mediaId}`;
  }

  /**
   * Get media file URL by filename
   */
  getMediaFileUrl(filename: string): string {
    return `${this.API_BASE_URL}/files/${filename}`;
  }

  /**
   * Get media blob for display
   */
  getMediaBlob(mediaUrl: string): Observable<Blob> {
    return this.http.get(mediaUrl, { responseType: 'blob' }).pipe(
      catchError(error => {
        console.error(`Error fetching media blob from ${mediaUrl}:`, error);
        throw error;
      })
    );
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { valid: false, error: 'File size must be less than 10MB' };
    }

    // Check file type
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'video/quicktime'
    ];

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'File type not supported. Allowed types: JPG, PNG, GIF, WebP, MP4, WebM, MOV' };
    }

    return { valid: true };
  }

  /**
   * Get file type category
   */
  getFileTypeCategory(contentType: string): 'image' | 'video' | 'other' {
    if (contentType.startsWith('image/')) {
      return 'image';
    } else if (contentType.startsWith('video/')) {
      return 'video';
    }
    return 'other';
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Create thumbnail for video files
   */
  createVideoThumbnail(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      video.addEventListener('loadedmetadata', () => {
        canvas.width = 300;
        canvas.height = 200;
        
        // Seek to 1 second or 10% of duration
        video.currentTime = Math.min(1, video.duration * 0.1);
      });

      video.addEventListener('seeked', () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
        resolve(thumbnail);
      });

      video.addEventListener('error', (e) => {
        reject(new Error('Error loading video: ' + e));
      });

      video.src = URL.createObjectURL(file);
      video.load();
    });
  }

  /**
   * Create preview for image files
   */
  createImagePreview(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
      
      reader.readAsDataURL(file);
    });
  }
}