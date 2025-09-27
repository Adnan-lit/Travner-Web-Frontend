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
        <input #tagInputRef type="text" [(ngModel)]="tagInput" name="tagInput" (keydown)="onTagKey($event)" placeholder="Add tag & Enter" />
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
            <img *ngIf="m.type==='IMAGE'" [src]="m.url" alt="media" />
            <video *ngIf="m.type==='VIDEO'" [src]="m.url" muted></video>
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
    .post-form-root { display:flex; flex-direction:column; gap:1.2rem; }
    .field label { font-weight:600; font-size:.85rem; letter-spacing:.5px; display:flex; gap:.35rem; align-items:center; }
    .field label span { color: var(--accent-400); }
    input[type=text], textarea { width:100%; padding:.85rem 1rem; border-radius:14px; border:1px solid rgba(255,255,255,0.15); background: rgba(15,23,42,0.55); color:#fff; font:inherit; }
    html[data-theme='light'] input[type=text], html[data-theme='light'] textarea { background: rgba(255,255,255,0.9); color:#0f172a; border-color: rgba(0,0,0,0.15); }
    textarea { resize:vertical; }
    .tags-box { display:flex; flex-wrap:wrap; gap:.5rem; padding:.5rem; border:1px dashed rgba(255,255,255,0.25); border-radius:14px; background:rgba(15,23,42,0.35); cursor:text; }
    html[data-theme='light'] .tags-box { background: rgba(255,255,255,0.6); }
    .tags-box input { flex:1; min-width:120px; border:none; background:transparent; padding:.4rem; color:inherit; font:inherit; }
    .tags-box input:focus { outline:none; }
    .chip { display:inline-flex; align-items:center; gap:.35rem; padding:.45rem .7rem; background:linear-gradient(135deg,var(--accent-500),var(--secondary-500)); color:#fff; border-radius:999px; font-size:.65rem; font-weight:600; letter-spacing:.5px; }
    .chip button { background:rgba(255,255,255,0.2); border:none; color:#fff; width:16px; height:16px; border-radius:50%; cursor:pointer; font-size:.65rem; display:flex; align-items:center; justify-content:center; }
    .chip button:hover { background:rgba(0,0,0,0.25); }
    .actions { display:flex; gap:1rem; }
    button.primary { background:linear-gradient(135deg,var(--accent-500),var(--secondary-500)); color:#fff; padding:.8rem 1.4rem; border:none; border-radius:14px; font-weight:600; cursor:pointer; box-shadow:0 8px 22px -6px rgba(0,0,0,0.65); }
    button.primary:disabled { opacity:.6; cursor:not-allowed; }
    .err { color:#ef4444; font-size:.7rem; font-weight:600; margin-top:.25rem; }
    .hint { opacity:.55; font-size:.65rem; margin-top:.3rem; }
    .media-uploader { margin-top:.35rem; border:2px dashed rgba(255,255,255,0.25); border-radius:16px; padding:1.2rem; text-align:center; font-size:.75rem; cursor:pointer; background:rgba(15,23,42,0.3); position:relative; }
    html[data-theme='light'] .media-uploader { background:rgba(255,255,255,0.65); border-color:rgba(0,0,0,0.2); }
    .media-uploader:hover { background:rgba(255,255,255,0.05); }
    .media-uploader input[type=file] { position:absolute; inset:0; width:100%; height:100%; opacity:0; cursor:pointer; }
    .media-previews { display:flex; flex-wrap:wrap; gap:.75rem; margin-top:.75rem; }
    .media-previews.existing { margin-top:.5rem; }
    .preview { width:110px; height:110px; position:relative; border-radius:14px; overflow:hidden; background:#0f172a; box-shadow:0 4px 14px -4px rgba(0,0,0,0.6); }
    .preview img, .preview video { width:100%; height:100%; object-fit:cover; display:block; }
    .preview button.remove { position:absolute; top:4px; right:4px; background:rgba(0,0,0,0.55); border:none; width:24px; height:24px; border-radius:8px; color:#fff; cursor:pointer; font-size:.85rem; display:flex; align-items:center; justify-content:center; }
    .preview button.remove:hover { background:rgba(0,0,0,0.8); }
    h4 { margin:.75rem 0 .35rem; font-size:.7rem; letter-spacing:1px; text-transform:uppercase; opacity:.7; }
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
