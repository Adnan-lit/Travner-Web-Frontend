import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Product } from '../../../models/marketplace.model';
import { MarketplaceService } from '../../../services/marketplace.service';
import { ToastService } from '../../../services/toast.service';
import { AuthService } from '../../../services/auth.service';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartSummaryComponent } from '../cart-summary/cart-summary.component';
import { ImageUtil } from '../../../utils/image.util';

@Component({
    selector: 'app-product-detail',
    standalone: true,
    imports: [NgIf, NgFor, FormsModule, CartSummaryComponent],
    templateUrl: './product-detail.component.html',
    styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnInit {
    product: Product | null = null;
    loading = true;
    error: string | null = null;
    selectedImageIndex = 0;
    quantity = 1;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private marketplaceService: MarketplaceService,
        private toastService: ToastService,
        private authService: AuthService
    ) { }

    ngOnInit(): void {
        const productId = this.route.snapshot.paramMap.get('id');
        if (productId) {
            this.loadProduct(productId);
        } else {
            this.error = 'Product ID not provided';
            this.loading = false;
        }
    }

    loadProduct(id: string): void {
        this.loading = true;
        this.error = null;

        this.marketplaceService.getProductById(id).subscribe({
            next: (product) => {
                this.product = product;
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading product:', err);
                this.error = err.message || 'Failed to load product details. Please try again later.';
                this.loading = false;
                this.toastService.error(this.error || 'Failed to load product details');
            }
        });
    }

    selectImage(index: number): void {
        this.selectedImageIndex = index;
    }

    increaseQuantity(): void {
        if (this.product && this.quantity < 10) {
            this.quantity++;
        }
    }

    decreaseQuantity(): void {
        if (this.quantity > 1) {
            this.quantity--;
        }
    }

    async addToCart(): Promise<void> {
        if (!this.product) return;

        // Check if user is authenticated
        if (!this.authService.isAuthenticated()) {
            this.toastService.error('Please sign in to add items to cart');
            this.router.navigate(['/signin'], {
                queryParams: { returnUrl: this.router.url }
            });
            return;
        }

        if (this.product.stock === 0) {
            this.toastService.error('This product is out of stock');
            return;
        }

        if (this.quantity > this.product.stock) {
            this.toastService.error(`Only ${this.product.stock} items available in stock`);
            return;
        }

        try {
            await this.marketplaceService.addToCart({
                productId: this.product.id,
                quantity: this.quantity
            }).toPromise();

            this.toastService.success(`${this.product.title} added to cart`);
            this.quantity = 1; // Reset quantity after adding to cart
        } catch (error: any) {
            console.error('Error adding to cart:', error);
            const errorMessage = error.message || 'Failed to add item to cart';
            this.toastService.error(errorMessage);
        }
    }

    buyNow(): void {
        // Add to cart and redirect to checkout
        this.addToCart().then(() => {
            this.router.navigate(['/marketplace/cart']);
        }).catch(() => {
            // Error already handled in addToCart
        });
    }

    getStockStatus(stock: number): string {
        if (stock === 0) return 'Out of Stock';
        if (stock < 5) return `Only ${stock} left`;
        return 'In Stock';
    }

    getStockClass(stock: number): string {
        if (stock === 0) return 'out-of-stock';
        if (stock < 5) return 'low-stock';
        return 'in-stock';
    }

    formatPrice(price: number): string {
        return new Intl.NumberFormat('bn-BD', {
            style: 'currency',
            currency: 'BDT'
        }).format(price);
    }

    handleImageError(event: Event): void {
        ImageUtil.handleImageError(event, 'IMAGE_NOT_AVAILABLE');
    }

    getPlaceholderImage(): string {
        return ImageUtil.getPlaceholder('product-detail');
    }
}