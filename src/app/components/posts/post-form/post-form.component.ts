import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Post, PostCreate, PostUpdate } from '../../../models/post.model';
import { Media } from '../../../models/media.model';

export type PostFormMode = 'create' | 'edit';

@Component({
  selector: 'app-post-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
  <form [formGroup]="form" (ngSubmit)="onSubmit()" class="post-form-root" novalidate>
    <div class="field">
      <label>Title <span>*</span></label>
      <input type="text" formControlName="title" />
  <div class="err" *ngIf="submitted && form.get('title')?.invalid">Title required (min 3)</div>
    </div>

    <div class="field">
      <label>Content <span>*</span></label>
      <textarea rows="6" formControlName="content"></textarea>
  <div class="err" *ngIf="submitted && form.get('content')?.invalid">Content required (min 10)</div>
    </div>

    <div class="field">
      <label>Location <span>*</span></label>
      <input type="text" formControlName="location" />
  <div class="err" *ngIf="submitted && form.get('location')?.invalid">Location required</div>
    </div>

    <div class="field">
      <label>Tags</label>
      <div class="tags-box" (click)="focusTagInput()">
        <span class="chip" *ngFor="let t of tags; let i = index">
          {{ t }}
          <button type="button" (click)="removeTag(i)" aria-label="Remove tag">×</button>
        </span>
        <input #tagInputRef type="text" [(ngModel)]="tagInput" [ngModelOptions]="{standalone: true}" name="tagInput" (keydown)="onTagKey($event)" placeholder="Add tag & Enter" />
      </div>
      <div class="hint">Press Enter to add. Max 10 tags. Lowercase only.</div>
    </div>

    <div class="field inline">
      <label><input type="checkbox" formControlName="published" /> Published</label>
    </div>

    <div class="field" *ngIf="allowMedia">
      <label>Media</label>
      <div class="media-uploader" (dragover)="onDragOver($event)" (drop)="onFileDrop($event)">
        <input type="file" multiple (change)="onFileInput($event)" accept="image/*,video/*" />
        <p>Drag & drop or click to select images/videos</p>
      </div>
      <div class="media-previews" *ngIf="previews.length > 0">
        <div class="preview" *ngFor="let p of previews; let i = index">
          <button type="button" class="remove" (click)="removeNewFile(i)" aria-label="Remove media">×</button>
          <img *ngIf="p.type==='image'" [src]="p.url" alt="preview" />
          <video *ngIf="p.type==='video'" [src]="p.url" muted></video>
        </div>
      </div>
  <div class="existing-media" *ngIf="existingMedia && existingMedia.length > 0">
        <h4>Existing Media</h4>
        <div class="media-previews existing">
          <div class="preview" *ngFor="let m of existingMedia">
            <button type="button" class="remove" (click)="deleteMedia.emit(m.id)" aria-label="Delete media">×</button>
            <img *ngIf="m.fileType?.startsWith('image/') || m.type==='IMAGE'" [src]="m.fileUrl || m.url" [alt]="m.fileName || 'media'" />
            <video *ngIf="m.fileType?.startsWith('video/') || m.type==='VIDEO'" [src]="m.fileUrl || m.url" muted></video>
          </div>
        </div>
      </div>
    </div>

    <div class="actions">
      <button type="submit" class="primary" [disabled]="saving">{{ saving ? (mode==='create' ? 'Creating...' : 'Saving...') : (mode==='create' ? 'Create Post' : 'Save Changes') }}</button>
      <button type="button" (click)="cancel.emit()" [disabled]="saving">Cancel</button>
    </div>
  </form>
  `,
  styles: [`
    .post-form-root { 
      display: flex; 
      flex-direction: column; 
      gap: 1.5rem; 
      max-width: 100%;
      background: rgba(255,255,255,0.02);
      padding: 2rem;
      border-radius: 20px;
      border: 1px solid rgba(255,255,255,0.08);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
    }
    
    html[data-theme='light'] .post-form-root { 
      background: rgba(255,255,255,0.85); 
      border-color: rgba(0,0,0,0.08);
    }
    
    .field { 
      display: flex; 
      flex-direction: column; 
      gap: 0.5rem; 
    }
    
    .field label { 
      font-weight: 600; 
      font-size: 0.9rem; 
      letter-spacing: 0.5px; 
      display: flex; 
      gap: 0.35rem; 
      align-items: center; 
      color: rgba(255,255,255,0.9);
      margin-bottom: 0.25rem;
    }
    
    html[data-theme='light'] .field label { 
      color: rgba(0,0,0,0.8); 
    }
    
    .field label span { 
      color: var(--accent-400); 
      font-weight: 700;
    }
    
    input[type=text], textarea { 
      width: 100%; 
      padding: 1rem 1.25rem; 
      border-radius: 16px; 
      border: 1px solid rgba(255,255,255,0.12); 
      background: rgba(15,23,42,0.6); 
      color: #fff; 
      font: inherit; 
      font-size: 0.95rem;
      transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    input[type=text]:focus, textarea:focus {
      outline: none;
      border-color: var(--primary-400);
      background: rgba(15,23,42,0.8);
      box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1), 0 4px 12px rgba(0,0,0,0.15);
    }
    
    html[data-theme='light'] input[type=text], 
    html[data-theme='light'] textarea { 
      background: rgba(255,255,255,0.95); 
      color: #0f172a; 
      border-color: rgba(0,0,0,0.12); 
    }
    
    html[data-theme='light'] input[type=text]:focus, 
    html[data-theme='light'] textarea:focus { 
      background: rgba(255,255,255,1); 
      border-color: var(--primary-500);
      box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1), 0 4px 12px rgba(0,0,0,0.08);
    }
    
    textarea { 
      resize: vertical; 
      min-height: 120px;
      line-height: 1.6;
    }
    
    .tags-box { 
      display: flex; 
      flex-wrap: wrap; 
      gap: 0.6rem; 
      padding: 0.8rem 1rem; 
      border: 1px solid rgba(255,255,255,0.12); 
      border-radius: 16px; 
      background: rgba(15,23,42,0.6); 
      cursor: text; 
      min-height: 56px;
      align-items: center;
      transition: all 0.3s ease;
    }
    
    .tags-box:focus-within {
      border-color: var(--primary-400);
      background: rgba(15,23,42,0.8);
      box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
    }
    
    html[data-theme='light'] .tags-box { 
      background: rgba(255,255,255,0.95); 
      border-color: rgba(0,0,0,0.12);
    }
    
    html[data-theme='light'] .tags-box:focus-within { 
      background: rgba(255,255,255,1); 
      border-color: var(--primary-500);
    }
    
    .tags-box input { 
      flex: 1; 
      min-width: 140px; 
      border: none; 
      background: transparent; 
      padding: 0.5rem; 
      color: inherit; 
      font: inherit; 
      font-size: 0.9rem;
    }
    
    .tags-box input:focus { 
      outline: none; 
    }
    
    .tags-box input::placeholder {
      color: rgba(255,255,255,0.5);
    }
    
    html[data-theme='light'] .tags-box input::placeholder {
      color: rgba(0,0,0,0.4);
    }
    
    .chip { 
      display: inline-flex; 
      align-items: center; 
      gap: 0.4rem; 
      padding: 0.5rem 0.8rem; 
      background: linear-gradient(135deg, var(--primary-500), var(--accent-500)); 
      color: #fff; 
      border-radius: 999px; 
      font-size: 0.75rem; 
      font-weight: 600; 
      letter-spacing: 0.5px; 
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      animation: chipSlideIn 0.2s ease-out;
    }
    
    @keyframes chipSlideIn {
      from { opacity: 0; transform: scale(0.8); }
      to { opacity: 1; transform: scale(1); }
    }
    
    .chip button { 
      background: rgba(255,255,255,0.25); 
      border: none; 
      color: #fff; 
      width: 18px; 
      height: 18px; 
      border-radius: 50%; 
      cursor: pointer; 
      font-size: 0.7rem; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      transition: all 0.2s ease;
    }
    
    .chip button:hover { 
      background: rgba(255,255,255,0.4); 
      transform: scale(1.1);
    }
    
    .actions { 
      display: flex; 
      gap: 1rem; 
      margin-top: 1rem;
      justify-content: flex-end;
    }
    
    button.primary { 
      background: linear-gradient(135deg, var(--primary-500), var(--accent-500)); 
      color: #fff; 
      padding: 1rem 2rem; 
      border: none; 
      border-radius: 16px; 
      font-weight: 600; 
      font-size: 0.9rem;
      cursor: pointer; 
      box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3); 
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }
    
    button.primary:hover:not(:disabled) { 
      transform: translateY(-2px); 
      box-shadow: 0 8px 25px rgba(14, 165, 233, 0.4); 
    }
    
    button.primary:active:not(:disabled) { 
      transform: translateY(0); 
      box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3); 
    }
    
    button.primary:disabled { 
      opacity: 0.6; 
      cursor: not-allowed; 
      transform: none;
      box-shadow: 0 4px 12px rgba(14, 165, 233, 0.2); 
    }
    
    button:not(.primary) {
      background: rgba(255,255,255,0.08);
      color: rgba(255,255,255,0.8);
      padding: 1rem 1.5rem;
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    button:not(.primary):hover:not(:disabled) {
      background: rgba(255,255,255,0.12);
      color: rgba(255,255,255,0.9);
    }
    
    html[data-theme='light'] button:not(.primary) {
      background: rgba(0,0,0,0.05);
      color: rgba(0,0,0,0.7);
      border-color: rgba(0,0,0,0.12);
    }
    
    html[data-theme='light'] button:not(.primary):hover:not(:disabled) {
      background: rgba(0,0,0,0.08);
      color: rgba(0,0,0,0.8);
    }
    
    .err { 
      color: #ef4444; 
      font-size: 0.8rem; 
      font-weight: 600; 
      margin-top: 0.25rem; 
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .err::before {
      content: "⚠";
      font-size: 0.9rem;
    }
    
    .hint { 
      opacity: 0.6; 
      font-size: 0.75rem; 
      margin-top: 0.4rem; 
      color: rgba(255,255,255,0.7);
    }
    
    html[data-theme='light'] .hint { 
      color: rgba(0,0,0,0.5); 
    }
    
    .media-uploader { 
      margin-top: 0.5rem; 
      border: 2px dashed rgba(255,255,255,0.2); 
      border-radius: 20px; 
      padding: 2rem; 
      text-align: center; 
      font-size: 0.85rem; 
      cursor: pointer; 
      background: rgba(15,23,42,0.3); 
      position: relative; 
      transition: all 0.3s ease;
      color: rgba(255,255,255,0.8);
    }
    
    .media-uploader:hover { 
      background: rgba(15,23,42,0.5); 
      border-color: rgba(255,255,255,0.3);
    }
    
    html[data-theme='light'] .media-uploader { 
      background: rgba(255,255,255,0.7); 
      border-color: rgba(0,0,0,0.15); 
      color: rgba(0,0,0,0.7);
    }
    
    html[data-theme='light'] .media-uploader:hover { 
      background: rgba(255,255,255,0.9); 
      border-color: rgba(0,0,0,0.2);
    }
    
    .media-uploader input[type=file] { 
      position: absolute; 
      inset: 0; 
      width: 100%; 
      height: 100%; 
      opacity: 0; 
      cursor: pointer; 
    }
    
    .media-previews { 
      display: flex; 
      flex-wrap: wrap; 
      gap: 1rem; 
      margin-top: 1rem; 
    }
    
    .media-previews.existing { 
      margin-top: 0.75rem; 
    }
    
    .preview { 
      width: 120px; 
      height: 120px; 
      position: relative; 
      border-radius: 16px; 
      overflow: hidden; 
      background: #0f172a; 
      box-shadow: 0 4px 12px rgba(0,0,0,0.3); 
      transition: all 0.3s ease;
    }
    
    .preview:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0,0,0,0.4);
    }
    
    .preview img, .preview video { 
      width: 100%; 
      height: 100%; 
      object-fit: cover; 
      display: block; 
    }
    
    .preview button.remove { 
      position: absolute; 
      top: 6px; 
      right: 6px; 
      background: rgba(239, 68, 68, 0.9); 
      border: none; 
      width: 28px; 
      height: 28px; 
      border-radius: 50%; 
      color: #fff; 
      cursor: pointer; 
      font-size: 1rem; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    
    .preview button.remove:hover { 
      background: rgba(239, 68, 68, 1); 
      transform: scale(1.1);
    }
    
    h4 { 
      margin: 1rem 0 0.5rem; 
      font-size: 0.8rem; 
      letter-spacing: 1px; 
      text-transform: uppercase; 
      opacity: 0.7; 
      font-weight: 600;
    }
    
    .field.inline {
      flex-direction: row;
      align-items: center;
      gap: 0.75rem;
    }
    
    .field.inline label {
      margin: 0;
      font-size: 0.9rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    input[type="checkbox"] {
      width: 18px;
      height: 18px;
      accent-color: var(--primary-500);
      cursor: pointer;
    }
  `]
})
export class PostFormComponent implements OnChanges {
  @Input() mode: PostFormMode = 'create';
  @Input() initial: Post | null = null;
  @Input() saving = false;
  @Input() existingMedia: Media[] = [];
  @Input() allowMedia = true;
  @Output() submitPost = new EventEmitter<{ data: PostCreate | PostUpdate; files: File[] }>();
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
      title: ['', [Validators.required, Validators.minLength(3)]],
      content: ['', [Validators.required, Validators.minLength(10)]],
      location: ['', [Validators.required]],
      published: [true]
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.initial) {
      this.form.patchValue({
        title: this.initial.title,
        content: this.initial.content,
        location: this.initial.location,
        published: this.initial.published ?? true
      });
      this.tags = [...(this.initial.tags || [])];
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

    const base = {
      title: this.form.value.title,
      content: this.form.value.content,
      location: this.form.value.location,
      tags: this.tags,
      mediaIds: [], // Initialize empty for now, will be updated after media upload
      published: this.form.value.published
    };
    this.submitPost.emit({ data: base as PostCreate | PostUpdate, files: this.selectedFiles });
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
