import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-toast-container',
    standalone: true,
    imports: [CommonModule],
    template: `
  <div class="toast-stack" *ngIf="messages().length > 0">
    <div class="toast" *ngFor="let m of messages()" [class.success]="m.type==='success'" [class.error]="m.type==='error'" [class.info]="m.type==='info'" [class.warning]="m.type==='warning'" (mouseenter)="pause(m.id)" (mouseleave)="resume(m.id)">
      <div class="icon">{{ iconFor(m.type) }}</div>
      <div class="body">{{ m.text }}</div>
      <button class="close" (click)="dismiss(m.id)" aria-label="Dismiss">×</button>
      <div class="bar" [style.animation-play-state]="isPaused(m.id) ? 'paused' : 'running'"></div>
    </div>
  </div>
  `,
    styles: [`
  :host { position: fixed; top: 0; left: 0; width:100%; pointer-events:none; z-index: 1000; }
  .toast-stack { display:flex; flex-direction:column; gap:.65rem; padding:1rem; max-width:480px; margin:0 auto; }
  .toast { position:relative; display:flex; align-items:flex-start; gap:.75rem; background:rgba(15,23,42,0.75); backdrop-filter:blur(18px); -webkit-backdrop-filter:blur(18px); border:1px solid rgba(255,255,255,0.08); padding:.9rem 1rem .95rem; border-radius:18px; box-shadow:0 10px 30px -12px rgba(0,0,0,0.6); font-size:.8rem; line-height:1.25rem; pointer-events:auto; overflow:hidden; }
  html[data-theme='light'] .toast { background:rgba(255,255,255,0.85); border-color:rgba(0,0,0,0.08); }
  .toast.success { border-color:#10b98133; }
  .toast.error { border-color:#ef444433; }
  .toast.info { border-color:#3b82f633; }
  .toast.warning { border-color:#f59e0b33; }
  .icon { font-size:1rem; line-height:1rem; }
  .body { flex:1; font-weight:500; }
  button.close { background:rgba(255,255,255,0.15); border:none; color:inherit; width:26px; height:26px; border-radius:9px; font-size:.9rem; cursor:pointer; display:flex; align-items:center; justify-content:center; }
  button.close:hover { background:rgba(255,255,255,0.28); }
  html[data-theme='light'] button.close { background:rgba(0,0,0,0.08); }
  html[data-theme='light'] button.close:hover { background:rgba(0,0,0,0.15); }
  .bar { position:absolute; left:0; bottom:0; height:3px; background:linear-gradient(90deg,var(--accent-500),var(--secondary-500)); width:100%; animation: shrink linear forwards; animation-duration: 4s; }
  .toast.success .bar { background:linear-gradient(90deg,#059669,#10b981); }
  .toast.error .bar { background:linear-gradient(90deg,#dc2626,#ef4444); }
  .toast.info .bar { background:linear-gradient(90deg,#2563eb,#3b82f6); }
  .toast.warning .bar { background:linear-gradient(90deg,#d97706,#f59e0b); }
  @keyframes shrink { from { transform:translateX(0); } to { transform:translateX(-100%); } }
  `]
})
export class ToastContainerComponent {
    private paused = new Map<string, boolean>();
    messages = signal<any[]>([]);

    constructor(private toast: ToastService) {
        this.toast.messages$.pipe(takeUntilDestroyed()).subscribe(list => this.messages.set(list));
    }

    iconFor(type: string): string {
        switch (type) {
            case 'success': return '✓';
            case 'error': return '⚠';
            case 'info': return 'ℹ';
            case 'warning': return '!';
            default: return '•';
        }
    }
    dismiss(id: string) { this.toast.dismiss(id); }
    pause(id: string) { this.paused.set(id, true); }
    resume(id: string) { this.paused.delete(id); }
    isPaused(id: string) { return this.paused.has(id); }
}
