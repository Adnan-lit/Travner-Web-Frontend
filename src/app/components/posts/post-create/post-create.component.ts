import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { PostService } from '../../../services/post.service';
import { PostCreate, PostUpdate } from '../../../models/post.model';
import { CreatePostRequest } from '../../../models/common.model';
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
    .create-wrapper { 
      max-width: 900px; 
      margin: 2rem auto; 
      padding: 2.5rem; 
      background: rgba(255,255,255,0.06); 
      border: 1px solid rgba(255,255,255,0.12); 
      border-radius: 28px; 
      backdrop-filter: blur(20px); 
      -webkit-backdrop-filter: blur(20px); 
      box-shadow: 0 8px 32px rgba(0,0,0,0.12);
    }
    
    html[data-theme='light'] .create-wrapper { 
      background: rgba(255,255,255,0.85); 
      border-color: rgba(0,0,0,0.08);
      box-shadow: 0 8px 32px rgba(0,0,0,0.06);
    }
    
    .header { 
      display: flex; 
      align-items: center; 
      justify-content: space-between; 
      margin-bottom: 2rem; 
      padding-bottom: 1.5rem;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    
    html[data-theme='light'] .header { 
      border-bottom-color: rgba(0,0,0,0.06); 
    }
    
    h1 { 
      font-size: 2rem; 
      margin: 0; 
      background: linear-gradient(135deg, #fff 0%, var(--primary-300) 50%, var(--accent-400) 100%); 
      -webkit-background-clip: text; 
      -webkit-text-fill-color: transparent; 
      background-clip: text;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    
    html[data-theme='light'] h1 { 
      background: linear-gradient(135deg, var(--primary-700) 0%, var(--primary-500) 50%, var(--accent-600) 100%); 
      -webkit-background-clip: text; 
      -webkit-text-fill-color: transparent; 
    }
    
    button.secondary { 
      background: rgba(255,255,255,0.1); 
      color: rgba(255,255,255,0.9); 
      padding: 0.75rem 1.5rem; 
      border: 1px solid rgba(255,255,255,0.15); 
      border-radius: 16px; 
      cursor: pointer; 
      font-weight: 500;
      transition: all 0.3s ease;
      backdrop-filter: blur(10px);
    }
    
    button.secondary:hover { 
      background: rgba(255,255,255,0.15); 
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    
    html[data-theme='light'] button.secondary { 
      background: rgba(0,0,0,0.06); 
      color: rgba(0,0,0,0.8); 
      border-color: rgba(0,0,0,0.1);
    }
    
    html[data-theme='light'] button.secondary:hover { 
      background: rgba(0,0,0,0.1); 
      color: rgba(0,0,0,0.9);
    }
    
    .error { 
      margin-top: 1.5rem; 
      color: #ef4444; 
      font-weight: 600; 
      padding: 1rem 1.25rem;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.2);
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    
    .error::before {
      content: "⚠";
      font-size: 1.1rem;
      color: #ef4444;
    }
  `]
})
export class PostCreateComponent {
  saving = false;
  error: string | null = null;

  constructor(private postService: PostService, private router: Router, private auth: AuthService, private toast: ToastService) { }

  onCreate(event: { data: PostCreate | PostUpdate; files: File[] }): void {
    // Narrow type (create mode always supplies full required fields)
    const payload = { ...event.data, published: true } as CreatePostRequest;
    console.log('🚀 Starting post creation:', { payload, fileCount: event.files?.length || 0 });

    if (!this.auth.isAuthenticated()) {
      this.error = 'You must be signed in to create a post';
      this.toast.error('Sign in required');
      return;
    }
    this.saving = true;
    this.postService.createPost(payload).subscribe({
      next: (response: any) => {
        // Handle the ApiResponse structure
        if (response && response.success && response.data) {
          console.log('✅ Post created successfully:', response.data);
          const postId = response.data['id'];
          const files = event.files || [];
          console.log('📁 Files to upload:', files.map(f => ({ name: f.name, size: f.size, type: f.type })));

          if (files.length > 0) {
            console.log('📤 Starting media upload for post:', postId);
            this.postService.uploadMedia(postId, files).subscribe({
              next: (uploadResult) => {
                console.log('✅ Media upload completed:', uploadResult);
                this.saving = false;
                this.router.navigate(['/community', postId]);
                this.toast.success('Post created');
              },
              error: (err) => {
                console.error('❌ Media upload failed for post:', postId, err);
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
        } else {
          console.error('❌ Post creation failed: Invalid response structure');
          this.saving = false;
          this.error = 'Failed to create post. Invalid response from server.';
          this.toast.error('Failed to create post. Invalid response from server.');
        }
      },
      error: (err) => {
        console.error('❌ Post creation failed:', err);
        this.saving = false;
        this.error = 'Failed to create post. Please check your connection and try again.';
        this.toast.error('Failed to create post. Please check your connection and try again.');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/community']);
  }
}
