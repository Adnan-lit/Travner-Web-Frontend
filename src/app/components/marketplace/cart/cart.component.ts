import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Cart, CartItem } from '../../../models/marketplace.model';
import { MarketplaceService } from '../../../services/marketplace.service';
import { ToastService } from '../../../services/toast.service';
import { AuthService } from '../../../services/auth.service';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ImageUtil } from '../../../utils/image.util';

@Component({
    selector: 'app-cart',
    standalone: true,
    imports: [NgIf, NgFor, FormsModule],
    templateUrl: './cart.component.html',
    styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {
    cart: Cart | null = null;
    loading = true;
    error: string | null = null;
    updatingItemIds: Set<string> = new Set();

    constructor(
        private marketplaceService: MarketplaceService,
        private toastService: ToastService,
        private authService: AuthService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadCart();
    }

    loadCart(): void {
        if (!this.authService.isAuthenticated()) {
            this.router.navigate(['/signin'], {
                queryParams: { returnUrl: '/marketplace/cart' }
            });
            return;
        }

        this.loading = true;
        this.error = null;

        this.marketplaceService.getCart().subscribe({
            next: (cart) => {
                this.cart = cart;
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading cart:', err);
                this.error = err.message || 'Failed to load cart. Please try again later.';
                this.loading = false;
                this.toastService.error(this.error || 'Failed to load cart');
            }
        });
    }

    updateQuantity(item: CartItem, newQuantity: number): void {
        if (!this.cart) return;

        // Validate quantity
        if (newQuantity < 0 || newQuantity > 10) {
            this.toastService.error('Quantity must be between 0 and 10');
            return;
        }

        // If quantity is 0, remove the item
        if (newQuantity === 0) {
            this.removeItem(item.lineId);
            return;
        }

        // Add to updating set to show loading state
        this.updatingItemIds.add(item.lineId);

        this.marketplaceService.updateCartItem(item.lineId, { quantity: newQuantity }).subscribe({
            next: (updatedCart) => {
                this.cart = updatedCart;
                this.updatingItemIds.delete(item.lineId);
                this.toastService.success('Cart updated');
            },
            error: (err) => {
                console.error('Error updating cart item:', err);
                this.updatingItemIds.delete(item.lineId);
                const errorMessage = err.message || 'Failed to update item quantity';
                this.toastService.error(errorMessage);
            }
        });
    }

    // New method to handle quantity change from input
    onQuantityChange(item: CartItem, event: Event): void {
        const inputElement = event.target as HTMLInputElement;
        const newQuantity = parseInt(inputElement.value, 10);
        if (!isNaN(newQuantity)) {
            this.updateQuantity(item, newQuantity);
        }
    }

    removeItem(lineId: string): void {
        if (!this.cart) return;

        // Add to updating set to show loading state
        this.updatingItemIds.add(lineId);

        this.marketplaceService.removeCartItem(lineId).subscribe({
            next: (updatedCart) => {
                this.cart = updatedCart;
                this.updatingItemIds.delete(lineId);
                this.toastService.success('Item removed from cart');
            },
            error: (err) => {
                console.error('Error removing cart item:', err);
                this.updatingItemIds.delete(lineId);
                this.toastService.error('Failed to remove item from cart');
            }
        });
    }

    clearCart(): void {
        if (!this.cart || !this.cart.items.length) return;

        if (!confirm('Are you sure you want to clear your cart?')) {
            return;
        }

        this.marketplaceService.clearCart().subscribe({
            next: () => {
                if (this.cart) {
                    this.cart.items = [];
                    this.cart.subtotal = 0;
                }
                this.toastService.success('Cart cleared');
            },
            error: (err) => {
                console.error('Error clearing cart:', err);
                this.toastService.error('Failed to clear cart');
            }
        });
    }

    proceedToCheckout(): void {
        if (!this.cart || !this.cart.items.length) {
            this.toastService.error('Your cart is empty');
            return;
        }

        this.router.navigate(['/marketplace/checkout']);
    }

    continueShopping(): void {
        this.router.navigate(['/marketplace']);
    }

    getItemTotal(item: CartItem): number {
        return item.unitPrice * item.quantity;
    }

    formatPrice(price: number): string {
        return new Intl.NumberFormat('bn-BD', {
            style: 'currency',
            currency: 'BDT'
        }).format(price);
    }

    handleImageError(event: Event): void {
        ImageUtil.handleImageError(event, 'NO_IMAGE');
    }

    getCartItemImage(): string {
        return ImageUtil.getPlaceholder('cart');
    }
}