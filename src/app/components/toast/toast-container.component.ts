import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from '../../services/toast.service';

@Component({
    selector: 'app-toast-container',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="toast-container">
      <div
        *ngFor="let toast of toasts"
        class="toast toast-{{ toast.type }}"
        [class.show]="true"
        (click)="removeToast(toast.id)"
      >
        <div class="toast-content">
          <i class="toast-icon" [ngClass]="getIconClass(toast.type)"></i>
          <div class="toast-text">
            <div class="toast-title" *ngIf="toast.title">{{ toast.title }}</div>
            <div class="toast-message">{{ toast.message }}</div>
          </div>
          <button type="button" class="toast-close" (click)="removeToast(toast.id)">
            &times;
          </button>
        </div>
        <div class="toast-progress" [ngStyle]="getProgressStyle(toast)"></div>
      </div>
    </div>
  `,
    styles: [`
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      width: 350px;
    }

    .toast {
      margin-bottom: 10px;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s ease-in-out;
      cursor: pointer;
      overflow: hidden;
    }

    .toast.show {
      opacity: 1;
      transform: translateX(0);
    }

    .toast-content {
      display: flex;
      align-items: center;
      padding: 16px;
      color: white;
    }

    .toast-icon {
      margin-right: 12px;
      font-size: 20px;
    }

    .toast-text {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .toast-title {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 2px;
    }

    .toast-message {
      font-size: 13px;
      font-weight: 400;
      opacity: 0.9;
    }

    .toast-close {
      background: none;
      border: none;
      color: white;
      font-size: 20px;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: 12px;
    }

    .toast-close:hover {
      opacity: 0.8;
    }

    .toast-progress {
      height: 4px;
      background: rgba(255, 255, 255, 0.3);
      width: 100%;
      animation: progress linear;
    }

    .toast-success {
      background: #4caf50;
    }

    .toast-error {
      background: #f44336;
    }

    .toast-warning {
      background: #ff9800;
    }

    .toast-info {
      background: #2196f3;
    }

    @keyframes progress {
      from {
        width: 100%;
      }
      to {
        width: 0%;
      }
    }
  `]
})
export class ToastContainerComponent implements OnInit {
    toasts: ToastMessage[] = [];

    constructor(private toastService: ToastService) { }

    ngOnInit(): void {
        this.toastService.toasts$.subscribe(toasts => {
            this.toasts = toasts.map(toast => ({
                ...toast,
                show: true
            }));
        });
    }

    removeToast(id: string): void {
        this.toastService.removeToast(id);
    }

    getIconClass(type: string): string {
        switch (type) {
            case 'success':
                return 'fas fa-check-circle';
            case 'error':
                return 'fas fa-exclamation-circle';
            case 'warning':
                return 'fas fa-exclamation-triangle';
            case 'info':
                return 'fas fa-info-circle';
            default:
                return 'fas fa-info-circle';
        }
    }

    getProgressStyle(toast: ToastMessage): any {
        if (toast.duration && toast.duration > 0) {
            return {
                'animation-duration': `${toast.duration}ms`
            };
        }
        return {};
    }
}