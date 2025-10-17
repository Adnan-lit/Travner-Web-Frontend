import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { EnvironmentConfig } from '../config/environment.config';

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
  success: boolean;
  message: string;
  data: MediaFile;
  id?: string; // For backward compatibility
}

export interface MediaListResponse {
  success: boolean;
  message: string;
  data: MediaFile[];
}

@Injectable({
  providedIn: 'root'
})
export class MediaService {
  private readonly API_BASE_URL = EnvironmentConfig.getApiBaseUrl();

  constructor(private http: HttpClient) { }

  /**
   * Upload a media file
   */
  uploadMedia(file: File, type: string = 'product', entityId?: string): Observable<MediaUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    
    if (entityId) {
      formData.append('entityId', entityId);
    }

    const endpoint = `${this.API_BASE_URL}/api/media/upload`;
    return this.http.post<MediaUploadResponse>(endpoint, formData).pipe(
      map(response => {
        // Add id property for backward compatibility
        if (response.data && !response.id) {
          response.id = response.data.id;
        }
        return response;
      }),
      catchError(error => {
        console.error('Error uploading media:', error);
        throw error;
      })
    );
  }

  /**
   * Upload multiple media files
   */
  uploadMultipleMedia(files: File[], type: string = 'product', entityId?: string): Observable<MediaUploadResponse[]> {
    const uploadObservables = files.map(file => this.uploadMedia(file, type, entityId));
    
    // Use forkJoin to upload all files in parallel
    return new Observable(observer => {
      const uploads = uploadObservables.map(obs => obs.toPromise());
      Promise.all(uploads).then(results => {
        observer.next(results as MediaUploadResponse[]);
        observer.complete();
      }).catch(error => {
        observer.error(error);
      });
    });
  }

  /**
   * Get media file by ID
   */
  getMedia(mediaId: string): Observable<MediaFile> {
    const endpoint = `${this.API_BASE_URL}/api/media/${mediaId}`;
    return this.http.get<MediaFile>(endpoint).pipe(
      catchError(error => {
        console.error('Error getting media:', error);
        throw error;
      })
    );
  }

  /**
   * Get media files for a specific entity
   */
  getMediaForEntity(entityId: string, type: string): Observable<MediaFile[]> {
    const endpoint = `${this.API_BASE_URL}/api/media/entity/${entityId}`;
    const params = new HttpParams().set('type', type);
    
    return this.http.get<MediaListResponse>(endpoint, { params }).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error getting media for entity:', error);
        throw error;
      })
    );
  }

  /**
   * Delete media file
   */
  deleteMedia(mediaId: string): Observable<any> {
    const endpoint = `${this.API_BASE_URL}/api/media/${mediaId}`;
    return this.http.delete(endpoint).pipe(
      catchError(error => {
        console.error('Error deleting media:', error);
        throw error;
      })
    );
  }

  /**
   * Get media file URL for display
   */
  getMediaUrl(filename: string): string {
    return `${this.API_BASE_URL}/api/media/files/${filename}`;
  }

  /**
   * Get media file URL by ID
   */
  getMediaUrlById(mediaId: string): string {
    return `${this.API_BASE_URL}/api/media/${mediaId}`;
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
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Only image files (JPEG, PNG, GIF, WebP) are allowed' };
    }

    return { valid: true };
  }

  /**
   * Create preview URL for file
   */
  createPreviewUrl(file: File): string {
    return URL.createObjectURL(file);
  }

  /**
   * Revoke preview URL to free memory
   */
  revokePreviewUrl(url: string): void {
    URL.revokeObjectURL(url);
  }

  /**
   * Get media files for a specific post (backward compatibility)
   */
  getMediaForPost(postId: string): Observable<MediaFile[]> {
    return this.getMediaForEntity(postId, 'post');
  }

  /**
   * Get media file URL (backward compatibility alias)
   */
  getMediaFileUrl(filename: string): string {
    return this.getMediaUrl(filename);
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
   * Create image preview (placeholder for backward compatibility)
   */
  createImagePreview(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }

  /**
   * Create video thumbnail (placeholder for backward compatibility)
   */
  createVideoThumbnail(file: File): Promise<string> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      video.onloadedmetadata = () => {
        video.currentTime = 1;
        video.onseeked = () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(video, 0, 0);
          resolve(canvas.toDataURL());
          URL.revokeObjectURL(video.src);
        };
      };
    });
  }

  /**
   * Get media blob (placeholder for backward compatibility)
   */
  getMediaBlob(mediaUrl: string): Observable<Blob> {
    return this.http.get(mediaUrl, { responseType: 'blob' });
  }
}