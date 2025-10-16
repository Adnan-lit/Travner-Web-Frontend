import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Post, Media } from '../../../models/post.model';
import { CreatePostRequest, UpdatePostRequest } from '../../../models/common.model';

export type PostFormMode = 'create' | 'edit';

@Component({
  selector: 'app-post-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
  <form [formGroup]="form" (ngSubmit)="onSubmit()" class="post-form" novalidate>
    <!-- Title Field -->
    <div class="form-group">
      <label for="title" class="form-label">Title *</label>
      <input
        type="text"
        id="title"
        formControlName="title"
        class="form-input"
        placeholder="Enter a compelling title for your post"
        [class.error]="submitted && form.get('title')?.invalid"
      />
      <div class="form-error" *ngIf="submitted && form.get('title')?.invalid">
        <span *ngIf="form.get('title')?.errors?.['required']">Title is required</span>
        <span *ngIf="form.get('title')?.errors?.['minlength']">Title must be at least 3 characters</span>
        <span *ngIf="form.get('title')?.errors?.['maxlength']">Title must be less than 100 characters</span>
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
        [class.error]="submitted && form.get('content')?.invalid"
      ></textarea>
      <div class="form-error" *ngIf="submitted && form.get('content')?.invalid">
        <span *ngIf="form.get('content')?.errors?.['required']">Content is required</span>
        <span *ngIf="form.get('content')?.errors?.['minlength']">Content must be at least 10 characters</span>
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

    <!-- Form Actions -->
    <div class="form-actions">
      <button
        type="button"
        class="btn btn-secondary"
        (click)="cancel.emit()"
        [disabled]="saving"
      >
        Cancel
      </button>
      <button
        type="submit"
        class="btn btn-primary"
        [disabled]="form.invalid || saving"
      >
        <span *ngIf="!saving">{{ mode === 'create' ? 'Create Post' : 'Save Changes' }}</span>
        <span *ngIf="saving" class="loading">
          <svg class="spinner" width="16" height="16" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="4" fill="none"/>
          </svg>
          {{ mode === 'create' ? 'Creating...' : 'Saving...' }}
        </span>
      </button>
    </div>
  </form>
  `,
  styleUrls: ['../post-create/post-create.component.css']
})
export class PostFormComponent implements OnChanges {
  @Input() mode: PostFormMode = 'create';
  @Input() initial: Post | null = null;
  @Input() saving = false;
  @Input() existingMedia: Media[] = [];
  @Input() allowMedia = true;
  @Output() submitPost = new EventEmitter<{ data: CreatePostRequest | UpdatePostRequest; files: File[] }>();
  @Output() deleteMedia = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;
  submitted = false;
  tags: string[] = [];
  tagInput = '';
  selectedFiles: File[] = [];
  previews: { file: File; url: string; type: 'image' | 'video'; }[] = [];

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      content: ['', [Validators.required, Validators.minLength(10)]],
      location: [''],
      tags: ['']
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.initial) {
      this.form.patchValue({
        title: this.initial.title,
        content: this.initial.content,
        location: this.initial.location,
        tags: this.initial.tags ? this.initial.tags.join(', ') : ''
      });
    }
  }

  focusTagInput(): void { }

  onTagKey(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      const value = this.tagInput.trim().toLowerCase();
      if (value && !this.tags.includes(value) && this.tags.length < 10 && value.length <= 20) {
        this.tags.push(value);
      }
      this.tagInput = '';
    } else if (event.key === 'Backspace' && !this.tagInput) {
      this.tags.pop();
    }
  }

  removeTag(index: number): void { this.tags.splice(index, 1); }

  onSubmit(): void {
    this.submitted = true;
    if (this.form.invalid) return;

    // Parse tags from comma-separated string
    const tags = this.form.value.tags 
      ? this.form.value.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag)
      : [];

    const base = {
      title: this.form.value.title,
      content: this.form.value.content,
      location: this.form.value.location,
      tags: tags,
      mediaIds: [], // Initialize empty for now, will be updated after media upload
      published: true
    };
    this.submitPost.emit({ data: base as CreatePostRequest | UpdatePostRequest, files: this.selectedFiles });
  }

  onFileInput(e: Event): void {
    const input = e.target as HTMLInputElement;
    if (!input.files) return;
    this.addFiles(Array.from(input.files));
    input.value = '';
  }
  onDragOver(e: DragEvent): void { e.preventDefault(); }
  onFileDrop(e: DragEvent): void { e.preventDefault(); if (e.dataTransfer?.files) { this.addFiles(Array.from(e.dataTransfer.files)); } }
  private addFiles(files: File[]): void { for (const file of files) { if (!/^image\//.test(file.type) && !/^video\//.test(file.type)) continue; this.selectedFiles.push(file); const url = URL.createObjectURL(file); this.previews.push({ file, url, type: file.type.startsWith('image') ? 'image' : 'video' }); } }
  removeNewFile(i: number): void { const p = this.previews[i]; if (p) URL.revokeObjectURL(p.url); this.previews.splice(i, 1); this.selectedFiles.splice(i, 1); }
}
