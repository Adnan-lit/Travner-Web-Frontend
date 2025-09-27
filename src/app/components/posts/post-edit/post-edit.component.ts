import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PostService } from '../../../services/post.service';
import { ToastService } from '../../../services/toast.service';
import { Post, PostCreate, PostUpdate } from '../../../models/post.model';
import { AuthService } from '../../../services/auth.service';
import { isPostOwner } from '../../../utils/ownership.util';
import { PostFormComponent } from '../post-form/post-form.component';

@Component({
    selector: 'app-post-edit',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, PostFormComponent],
    template: `
  <div class="edit-wrapper" *ngIf="loaded; else loadingTpl">
    <div class="header">
      <h1>Edit Post</h1>
      <div class="actions">
        <button class="secondary" (click)="goBack()">Back</button>
      </div>
    </div>

    <app-post-form *ngIf="post" [mode]="'edit'" [initial]="post" [saving]="saving" (submitPost)="onSubmit($event)" (deleteMedia)="onDeleteMedia($event)" (cancel)="goBack()" />

    <div class="error" *ngIf="error">{{ error }}</div>
  </div>
  <ng-template #loadingTpl>
    <div class="loading-state"><div class="loader"></div> Loading post...</div>
  </ng-template>
  `,
    styles: [`
    .edit-wrapper { max-width: 820px; margin: 2rem auto; padding: 2rem; background: rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius: 24px; backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); }
    html[data-theme='light'] .edit-wrapper { background: rgba(255,255,255,0.75); }
    .header { display:flex; align-items:center; justify-content: space-between; margin-bottom:1.5rem; }
    h1 { font-size:1.6rem; margin:0; background:linear-gradient(120deg,#fff,var(--primary-200)); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
    form.edit-form { display:flex; flex-direction:column; gap:1.25rem; }
    .field label { display:block; font-weight:600; margin-bottom:.4rem; font-size:.9rem; letter-spacing:.5px; }
    .field input[type=text], .field textarea { width:100%; padding:.85rem 1rem; border-radius:14px; border:1px solid rgba(255,255,255,0.15); background: rgba(15,23,42,0.55); color:#fff; font:inherit; resize:vertical; box-shadow:0 3px 10px -3px rgba(0,0,0,0.5) inset; }
    html[data-theme='light'] .field input[type=text], html[data-theme='light'] .field textarea { background: rgba(255,255,255,0.9); color:#0f172a; border-color: rgba(0,0,0,0.15); }
    .tags-input { display:flex; flex-wrap:wrap; gap:.5rem; padding:.5rem; border:1px dashed rgba(255,255,255,0.2); border-radius:14px; background:rgba(15,23,42,0.35); }
    html[data-theme='light'] .tags-input { background: rgba(255,255,255,0.55); }
    .tags-input input { flex:1; min-width:120px; border:none; background:transparent; padding:.4rem; color:inherit; font:inherit; }
    .tags-input input:focus { outline:none; }
    .tag-chip { display:inline-flex; align-items:center; gap:.4rem; padding:.45rem .7rem; background:linear-gradient(135deg,var(--accent-500),var(--secondary-500)); color:#fff; border-radius:999px; font-size:.7rem; font-weight:600; letter-spacing:.5px; box-shadow:0 4px 14px -4px rgba(0,0,0,0.55); }
    .tag-chip button { background:rgba(255,255,255,0.2); border:none; color:#fff; width:18px; height:18px; border-radius:50%; cursor:pointer; font-size:.75rem; display:flex; align-items:center; justify-content:center; }
    .tag-chip button:hover { background:rgba(0,0,0,0.2); }
    .form-actions { display:flex; gap:1rem; }
    button.primary { background:linear-gradient(135deg,var(--accent-500),var(--secondary-500)); color:#fff; padding:.8rem 1.4rem; border:none; border-radius:14px; font-weight:600; cursor:pointer; box-shadow:0 8px 22px -6px rgba(0,0,0,0.65); }
    button.primary:disabled { opacity:.6; cursor:not-allowed; }
    button.secondary, .actions button { background:rgba(255,255,255,0.08); color:#fff; padding:.65rem 1.2rem; border:none; border-radius:14px; cursor:pointer; }
    html[data-theme='light'] button.secondary { background:rgba(0,0,0,0.06); color:#0f172a; }
    button.secondary:hover { background:rgba(255,255,255,0.14); }
    html[data-theme='light'] button.secondary:hover { background:rgba(0,0,0,0.12); }
    .error { margin-top:1rem; color:#ef4444; font-weight:600; }
    .loading-state { padding:3rem; text-align:center; }
  `]
})
export class PostEditComponent implements OnInit {
    postId: string | null = null;
    post: Post | null = null;
    loaded = false;
    saving = false;
    error: string | null = null;

    constructor(private route: ActivatedRoute, private postService: PostService, private router: Router, private auth: AuthService, private toast: ToastService) { }

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
            next: (post) => {
                const current = this.auth.getCurrentUser?.();
                if (!isPostOwner(post, current, 'PostEdit')) {
                    this.error = 'You are not allowed to edit this post.';
                    return;
                }
                this.post = post;
                this.loaded = true;
            },
            error: (err) => {
                console.error('Failed to load post', err);
                this.error = 'Failed to load post';
            }
        });
    }

    onSubmit(event: { data: PostCreate | PostUpdate; files: File[] }): void {
        if (!this.postId) return;
        const payload = event.data as PostUpdate; // edit mode partial allowed
        this.saving = true;
        this.postService.updatePost(this.postId, payload).subscribe({
            next: (updated) => {
                const files = event.files || [];
                if (files.length > 0) {
                    this.postService.uploadMedia(this.postId!, files).subscribe({
                        next: () => {
                            this.saving = false;
                            this.router.navigate(['/community', updated.id]);
                            this.toast.success('Post updated');
                        },
                        error: (err) => {
                            console.error('Post updated but media upload failed', err);
                            this.saving = false;
                            this.router.navigate(['/community', updated.id]);
                            this.toast.warning('Updated but some media failed');
                        }
                    });
                } else {
                    this.saving = false;
                    this.router.navigate(['/community', updated.id]);
                    this.toast.success('Post updated');
                }
            },
            error: (err) => {
                console.error('Failed to save post', err);
                this.saving = false;
                this.error = 'Failed to save changes';
                this.toast.error('Failed to save changes');
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
                        this.post.mediaUrls = this.post.mediaUrls.filter(u => !u.includes(mediaId));
                    }
                }
                this.toast.success('Media deleted');
            },
            error: err => {
                console.error('Failed to delete media', err);
                this.toast.error('Failed to delete media');
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
}
