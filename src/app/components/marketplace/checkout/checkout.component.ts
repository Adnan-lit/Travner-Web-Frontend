import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Cart, CustomerInfo, Order, CartResponse } from '../../../models/marketplace.model';
import { MarketplaceService } from '../../../services/marketplace.service';
import { ToastService } from '../../../services/toast.service';
import { AuthService } from '../../../services/auth.service';
import { NgIf, NgFor } from '@angular/common';

@Component({
    selector: 'app-checkout',
    standalone: true,
    imports: [NgIf, NgFor, ReactiveFormsModule],
    templateUrl: './checkout.component.html',
    styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {
    cart: Cart | null = null;
    checkoutForm: FormGroup;
    loading = true;
    submitting = false;
    error: string | null = null;

    constructor(
        private marketplaceService: MarketplaceService,
        private toastService: ToastService,
        private authService: AuthService,
        private router: Router,
        private fb: FormBuilder
    ) {
        this.checkoutForm = this.fb.group({
            fullName: ['', [Validators.required, Validators.minLength(2)]],
            email: ['', [Validators.required, Validators.email]],
            phone: ['', [Validators.required, Validators.minLength(10)]],
            addressLine1: ['', [Validators.required, Validators.minLength(5)]],
            addressLine2: [''],
            city: ['', [Validators.required, Validators.minLength(2)]],
            state: ['', [Validators.required, Validators.minLength(2)]],
            postalCode: ['', [Validators.required, Validators.minLength(4)]],
            country: ['BD', [Validators.required]]
        });
    }

    ngOnInit(): void {
        this.loadCart();
    }

    loadCart(): void {
        if (!this.authService.isAuthenticated()) {
            this.router.navigate(['/signin'], {
                queryParams: { returnUrl: '/marketplace/checkout' }
            });
            return;
        }

        this.loading = true;
        this.error = null;

        this.marketplaceService.getCart().subscribe({
            next: (response: CartResponse) => {
                this.cart = response.data || null;
                this.loading = false;

                // Redirect to cart if empty
                if (this.cart && !this.cart.items.length) {
                    this.toastService.info('Your cart is empty', '');
                    this.router.navigate(['/marketplace/cart']);
                }
            },
            error: (err: any) => {
                console.error('Error loading cart:', err);
                this.error = err.message || 'Failed to load cart. Please try again later.';
                this.loading = false;
                this.toastService.error('Failed to load cart', this.error || '');
            }
        });
    }

    onSubmit(): void {
        if (!this.cart || !this.cart.items.length) {
            this.toastService.error('Your cart is empty', '');
            this.router.navigate(['/marketplace/cart']);
            return;
        }

        if (this.checkoutForm.invalid) {
            this.toastService.error('Please fill in all required fields', '');
            return;
        }

        this.submitting = true;
        this.error = null;

        const customerInfo: CustomerInfo = this.checkoutForm.value;

        this.marketplaceService.checkout().subscribe({
            next: (response: any) => {
                this.submitting = false;
                this.toastService.success('Order placed successfully!', '');
                // Navigate to order confirmation page
                // TODO: Extract order ID from response if available
                this.router.navigate(['/marketplace/orders']);
            },
            error: (err: any) => {
                console.error('Error during checkout:', err);
                this.submitting = false;
                this.error = err.message || 'Failed to process checkout. Please try again.';
                this.toastService.error('Failed to process checkout', this.error || '');
            }
        });
    }

    cancelCheckout(): void {
        this.router.navigate(['/marketplace/cart']);
    }

    getItemTotal(unitPrice: number, quantity: number): number {
        return unitPrice * quantity;
    }

    formatPrice(price: number): string {
        return new Intl.NumberFormat('bn-BD', {
            style: 'currency',
            currency: 'BDT'
        }).format(price);
    }
}