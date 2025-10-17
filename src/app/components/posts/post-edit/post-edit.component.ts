import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Observable, forkJoin, map } from 'rxjs';
import { PostService } from '../../../services/post.service';
import { ToastService } from '../../../services/toast.service';
import { Post, PostCreate, PostUpdate } from '../../../models/post.model';
import { AuthService } from '../../../services/auth.service';
import { MediaService } from '../../../services/media.service';
import { isPostOwner } from '../../../utils/ownership.util';
import { PostFormComponent } from '../post-form/post-form.component';

@Component({
    selector: 'app-post-edit',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, PostFormComponent],
    template: `
    <div class="post-create-container" *ngIf="loaded; else loadingTpl">
      <!-- Modern Header -->
      <div class="post-create-header">
        <h2>Edit Post</h2>
        <p>Update your travel experiences and share with the community</p>
      </div>

      <app-post-form *ngIf="post" [mode]="'edit'" [initial]="post" [saving]="saving" [existingMedia]="getExistingMedia()" (submitPost)="onSubmit($event)" (deleteMedia)="onDeleteMedia($event)" (cancel)="goBack()" />

      <!-- Error Message -->
      <div class="error-message" *ngIf="error">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
        {{ error }}
      </div>
    </div>
    
    <ng-template #loadingTpl>
      <div class="post-create-container">
        <div class="post-create-header">
          <div class="loading">
            <svg class="spinner" width="24" height="24" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"/>
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="4" fill="none"/>
            </svg>
            Loading post...
          </div>
        </div>
      </div>
    </ng-template>
  `,
    styleUrls: ['../post-create/post-create.component.css']
})
export class PostEditComponent implements OnInit {
    postId: string | null = null;
    post: Post | null = null;
    loaded = false;
    saving = false;
    error: string | null = null;

    constructor(private route: ActivatedRoute, private postService: PostService, private router: Router, private auth: AuthService, private toast: ToastService, private mediaService: MediaService) { }

    ngOnInit(): void {
        this.postId = this.route.snapshot.paramMap.get('id');
        if (!this.postId) {
            this.error = 'Missing post id';
            return;
        }
        this.load();
    }

    private load(): void {
        this.postService.getPostById(this.postId!).subscribe({
            next: (response: any) => {
                const post = response.data;
                let current = this.auth.getCurrentUser?.();

                // Handle potential JSON string
                if (typeof current === 'string') {
                    try {
                        const parsed = JSON.parse(current);
                        current = parsed.data || parsed; // Handle API response format
                    } catch (e) {
                        console.error('Failed to parse current user:', e);
                        current = null;
                    }
                }

                // Create a PostOwner-compatible object from the Post
                const postOwner = {
                    authorId: post?.author?.id,
                    authorName: post?.author?.userName // Use username instead of concatenated names
                };

                const ownershipResult = isPostOwner(postOwner, current);

                if (!ownershipResult) {
                    console.error('🚫 PostEdit ownership check failed:', {
                        postId: post?.['id'],
                        postOwner,
                        currentUser: current,
                        rawCurrentUser: this.auth.getCurrentUser?.(),
                        enableDebugMode: 'localStorage.setItem("travner_debug", "true")'
                    });
                    this.error = 'You are not allowed to edit this post.';
                    return;
                }
                this.post = post || null;
                this.loaded = true;
            },
            error: (err: any) => {
                console.error('Failed to load post', err);
                this.error = 'Failed to load post';
            }
        });
    }

    onSubmit(event: { data: PostCreate | PostUpdate; files: File[]; uploadedMediaIds: string[] }): void {
        if (!this.postId) return;
        const payload = event.data as PostUpdate;
        this.saving = true;

        // Combine uploaded media IDs with any new files that need to be uploaded
        const allMediaIds = [...event.uploadedMediaIds];
        const files = event.files || [];
        
        if (files.length > 0) {
            this.uploadMediaFiles(files).subscribe({
                next: (newMediaIds) => {
                    // Include all media IDs in the update payload
                    payload.mediaIds = [...allMediaIds, ...newMediaIds];
                    this.updatePost(payload);
                },
                error: (error) => {
                    console.error('Error uploading media:', error);
                    this.error = 'Failed to upload media files';
                    this.saving = false;
                }
            });
        } else {
            // No new files to upload, just use the uploaded media IDs
            payload.mediaIds = allMediaIds;
            this.updatePost(payload);
        }
    }

    private uploadMediaFiles(files: File[]): Observable<string[]> {
        const uploadObservables = files.map(file => 
            this.mediaService.uploadMedia(file, 'post')
        );
        
        return forkJoin(uploadObservables).pipe(
            map(responses => responses.map(response => response.data.id).filter(id => id !== undefined))
        );
    }

    private updatePost(payload: PostUpdate): void {
        this.postService.updatePost(this.postId!, payload).subscribe({
            next: (updated: any) => {
                this.saving = false;
                // Use the original postId for navigation since updated['id'] might be undefined
                this.router.navigate(['/community', this.postId]);
                this.toast.success('Post updated', 'Your changes have been saved successfully.');
            },
            error: (err: any) => {
                console.error('Failed to save post', err);
                this.saving = false;
                this.error = 'Failed to save changes';
                this.toast.error('Failed to save changes', '');
            }
        });
    }

    onDeleteMedia(mediaId: string) {
        if (!this.postId) return;
        this.postService.deleteMedia(this.postId, mediaId).subscribe({
            next: () => {
                if (this.post) {
                    // Optimistically remove from local list if present
                    if (this.post.mediaUrls) {
                        this.post.mediaUrls = this.post.mediaUrls.filter((u: string) => !u.includes(mediaId));
                    }
                }
                this.toast.success('Media deleted', '');
            },
            error: (err: any) => {
                console.error('Failed to delete media', err);
                this.toast.error('Failed to delete media', '');
            }
        });
    }

    goBack(): void {
        if (this.postId) {
            this.router.navigate(['/community', this.postId]);
        } else {
            this.router.navigate(['/community']);
        }
    }

    debugOwnership(): void {
        let current = this.auth.getCurrentUser?.();

        // Handle potential JSON string
        if (typeof current === 'string') {
            try {
                const parsed = JSON.parse(current);
                current = parsed.data || parsed;
            } catch (e) {
                console.error('Failed to parse current user:', e);
                current = null;
            }
        }

        const postOwner = {
            authorId: this.post?.author?.id,
            authorName: this.post?.author?.userName
        };

        console.log('🔍 PostEdit Ownership Debug:', {
            postId: this.postId,
            postOwner,
            currentUser: current,
            rawCurrentUser: this.auth.getCurrentUser?.(),
            isOwner: this.post ? isPostOwner(postOwner, current) : 'No post loaded',
            enableDebugMode: 'Run: localStorage.setItem("travner_debug", "true"); then refresh'
        });
    }

    getExistingMedia(): any[] {
        if (!this.post?.media) return [];
        
        // Convert MediaFile[] to Media[] format for the form component
        return this.post.media.map((media: any) => ({
            id: media.id,
            filename: media.filename,
            originalFilename: media.originalFilename,
            contentType: media.contentType,
            size: media.size,
            uploadedBy: media.uploadedBy,
            type: media.type,
            entityId: media.entityId,
            uploadedAt: media.uploadedAt,
            downloadUrl: media.downloadUrl,
            gridFsId: media.gridFsId,
            url: media.downloadUrl, // Use downloadUrl as url for display
            createdAt: media.uploadedAt // Use uploadedAt as createdAt for display
        }));
    }
}
