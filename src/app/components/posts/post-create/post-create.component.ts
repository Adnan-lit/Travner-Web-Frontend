import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { PostService } from '../../../services/post.service';
import { PostCreate, PostUpdate } from '../../../models/post.model';
import { PostFormComponent } from '../post-form/post-form.component';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';

@Component({
    selector: 'app-post-create',
    standalone: true,
    imports: [CommonModule, RouterModule, PostFormComponent],
    template: `
  <div class="create-wrapper">
    <div class="header">
      <h1>Create Community Post</h1>
      <button class="secondary" (click)="goBack()">Back</button>
    </div>
  <app-post-form [mode]="'create'" [saving]="saving" (submitPost)="onCreate($event)" (cancel)="goBack()" />
    <div class="error" *ngIf="error">{{ error }}</div>
  </div>
  `,
    styles: [`
    .create-wrapper { max-width:820px; margin:2rem auto; padding:2rem; background: rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:24px; backdrop-filter:blur(18px); -webkit-backdrop-filter:blur(18px); }
    html[data-theme='light'] .create-wrapper { background: rgba(255,255,255,0.75); }
    .header { display:flex; align-items:center; justify-content:space-between; margin-bottom:1.5rem; }
    h1 { font-size:1.6rem; margin:0; background:linear-gradient(120deg,#fff,var(--primary-200)); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
    button.secondary { background:rgba(255,255,255,0.08); color:#fff; padding:.65rem 1.2rem; border:none; border-radius:14px; cursor:pointer; }
    html[data-theme='light'] button.secondary { background:rgba(0,0,0,0.06); color:#0f172a; }
    button.secondary:hover { background:rgba(255,255,255,0.14); }
    .error { margin-top:1rem; color:#ef4444; font-weight:600; }
  `]
})
export class PostCreateComponent {
    saving = false;
    error: string | null = null;

    constructor(private postService: PostService, private router: Router, private auth: AuthService, private toast: ToastService) { }

    onCreate(event: { data: PostCreate | PostUpdate; files: File[] }): void {
        // Narrow type (create mode always supplies full required fields)
        const payload = event.data as PostCreate;
        if (!this.auth.isAuthenticated()) {
            this.error = 'You must be signed in to create a post';
            this.toast.error('Sign in required');
            return;
        }
        this.saving = true;
        this.postService.createPost(payload).subscribe({
            next: (created) => {
                const postId = created.id;
                const files = event.files || [];
                if (files.length > 0) {
                    this.postService.uploadMedia(postId, files).subscribe({
                        next: () => {
                            this.saving = false;
                            this.router.navigate(['/community', postId]);
                            this.toast.success('Post created');
                        },
                        error: (err) => {
                            console.error('Post created but media upload failed', err);
                            this.saving = false;
                            // Proceed to post anyway; could add toast later
                            this.router.navigate(['/community', postId]);
                            this.toast.warning('Created, some media failed');
                        }
                    });
                } else {
                    this.saving = false;
                    this.router.navigate(['/community', postId]);
                    this.toast.success('Post created');
                }
            },
            error: (err) => {
                console.error('Failed to create post', err);
                this.saving = false;
                this.error = 'Failed to create post';
                this.toast.error('Failed to create post');
            }
        });
    }

    goBack(): void {
        this.router.navigate(['/community']);
    }
}
