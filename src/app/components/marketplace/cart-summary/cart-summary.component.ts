import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { MarketplaceService } from '@services/marketplace.service';
import { AuthService } from '@services/auth.service';
import { Cart } from '@app/models/marketplace.model';

@Component({
  selector: 'app-cart-summary',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="cart-summary-widget" *ngIf="isAuthenticated && cart && cart.items && cart.items.length > 0">
      <div class="cart-header">
        <h4>Cart ({{ itemCount }})</h4>
        <button class="close-btn" (click)="toggleVisibility()" aria-label="Toggle cart">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      
      <div class="cart-items" *ngIf="isVisible">
        <div class="cart-item" *ngFor="let item of cart.items | slice:0:3">
          <div class="item-info">
            <div class="item-title">{{ item.titleSnapshot }}</div>
            <div class="item-details">{{ item.quantity }}x {{ formatPrice(item.unitPrice) }}</div>
          </div>
        </div>
        
        <div class="more-items" *ngIf="cart.items.length > 3">
          +{{ cart.items.length - 3 }} more items
        </div>
        
        <div class="cart-total">
          <strong>Total: {{ formatPrice(cart.totalAmount) }}</strong>
        </div>
        
        <div class="cart-actions">
          <a routerLink="/marketplace/cart" class="btn btn-primary">View Cart</a>
          <a routerLink="/marketplace/checkout" class="btn btn-secondary">Checkout</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cart-summary-widget {
      position: fixed;
      top: 90px;
      right: 20px;
      background: var(--surface-primary, #ffffff);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: 12px;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
      min-width: 280px;
      max-width: 320px;
      z-index: 999;
      animation: slideInRight 0.3s ease-out;
    }

    @media (max-width: 768px) {
      .cart-summary-widget {
        right: 10px;
        left: 10px;
        min-width: auto;
      }
    }

    .cart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      border-bottom: 1px solid var(--border-color, #e2e8f0);
    }

    .cart-header h4 {
      margin: 0;
      color: var(--text-primary, #1a202c);
      font-size: 1.1rem;
      font-weight: 600;
    }

    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      color: var(--text-secondary, #64748b);
      border-radius: 4px;
      transition: background-color 0.2s;
    }

    .close-btn:hover {
      background-color: var(--hover-bg, #f1f5f9);
    }

    .cart-items {
      padding: 16px;
    }

    .cart-item {
      display: flex;
      align-items: flex-start;
      margin-bottom: 12px;
      padding-bottom: 8px;
    }

    .cart-item:not(:last-child) {
      border-bottom: 1px solid var(--border-light, #f1f5f9);
    }

    .item-info {
      flex: 1;
    }

    .item-title {
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--text-primary, #1a202c);
      margin-bottom: 4px;
      line-height: 1.3;
    }

    .item-details {
      font-size: 0.8rem;
      color: var(--text-secondary, #64748b);
    }

    .more-items {
      text-align: center;
      color: var(--text-secondary, #64748b);
      font-size: 0.85rem;
      margin: 8px 0;
      font-style: italic;
    }

    .cart-total {
      text-align: center;
      margin: 16px 0;
      padding-top: 16px;
      border-top: 1px solid var(--border-color, #e2e8f0);
      color: var(--text-primary, #1a202c);
    }

    .cart-actions {
      display: flex;
      gap: 8px;
    }

    .btn {
      flex: 1;
      padding: 8px 12px;
      text-align: center;
      border-radius: 6px;
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 500;
      transition: all 0.2s;
    }

    .btn-primary {
      background: var(--primary-500, #3b82f6);
      color: white;
      border: 1px solid var(--primary-500, #3b82f6);
    }

    .btn-primary:hover {
      background: var(--primary-600, #2563eb);
      border-color: var(--primary-600, #2563eb);
    }

    .btn-secondary {
      background: transparent;
      color: var(--primary-500, #3b82f6);
      border: 1px solid var(--primary-500, #3b82f6);
    }

    .btn-secondary:hover {
      background: var(--primary-50, #eff6ff);
    }

    @keyframes slideInRight {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `]
})
export class CartSummaryComponent implements OnInit, OnDestroy {
  cart: Cart | null = null;
  isAuthenticated = false;
  isVisible = true;
  itemCount = 0;
  private subscriptions: Subscription[] = [];

  constructor(
    private marketplaceService: MarketplaceService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    // Subscribe to authentication status
    this.subscriptions.push(
      this.authService.currentUser$.subscribe((user: any) => {
        this.isAuthenticated = !!user;
        if (this.isAuthenticated) {
          this.loadCart();
        } else {
          this.cart = null;
          this.itemCount = 0;
        }
      })
    );

    // Subscribe to cart item count changes
    this.subscriptions.push(
      this.marketplaceService.getCartItemCount().subscribe((count: number) => {
        this.itemCount = count;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadCart(): void {
    if (!this.isAuthenticated) return;

    this.marketplaceService.getCart().subscribe({
      next: (response: any) => {
        // Handle the ApiResponse structure
        if (response && response.success && response.data) {
          this.cart = response.data;
          // Calculate item count from cart items
          if (this.cart && this.cart.items) {
            this.itemCount = this.cart.items.reduce((total: number, item: any) => total + item.quantity, 0);
          } else {
            this.itemCount = 0;
          }
        } else {
          this.cart = null;
          this.itemCount = 0;
        }
      },
      error: (err: any) => {
        console.warn('Failed to load cart for summary:', err);
        this.cart = null;
        this.itemCount = 0;
      }
    });
  }

  toggleVisibility(): void {
    this.isVisible = !this.isVisible;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('bn-BD', {
      style: 'currency',
      currency: 'BDT'
    }).format(price);
  }
}