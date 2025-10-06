import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Order, OrderStatus } from '../../../models/marketplace.model';
import { MarketplaceService } from '../../../services/marketplace.service';
import { ToastService } from '../../../services/toast.service';
import { AuthService } from '../../../services/auth.service';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-order-detail',
    standalone: true,
    imports: [NgIf, NgFor, FormsModule],
    templateUrl: './order-detail.component.html',
    styleUrls: ['./order-detail.component.css']
})
export class OrderDetailComponent implements OnInit {
    order: Order | null = null;
    loading = true;
    error: string | null = null;

    constructor(
        private route: ActivatedRoute,
        public router: Router,
        private marketplaceService: MarketplaceService,
        private toastService: ToastService,
        private authService: AuthService
    ) { }

    ngOnInit(): void {
        if (!this.authService.isAuthenticated()) {
            this.router.navigate(['/signin'], {
                queryParams: { returnUrl: this.router.url }
            });
            return;
        }

        const orderId = this.route.snapshot.paramMap.get('id');
        if (orderId) {
            this.loadOrder(orderId);
        } else {
            this.error = 'Order ID not provided';
            this.loading = false;
        }
    }

    loadOrder(id: string): void {
        this.loading = true;
        this.error = null;

        this.marketplaceService.getOrderById(id).subscribe({
            next: (order) => {
                this.order = order;
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading order:', err);
                this.error = 'Failed to load order details. Please try again later.';
                this.loading = false;
                this.toastService.error('Failed to load order details');
            }
        });
    }

    cancelOrder(): void {
        if (!this.order) return;

        if (this.order.status !== 'PLACED') {
            this.toastService.error('Only orders with PLACED status can be canceled');
            return;
        }

        if (!confirm('Are you sure you want to cancel this order?')) {
            return;
        }

        this.marketplaceService.cancelOrder(this.order.id).subscribe({
            next: (updatedOrder) => {
                this.order = updatedOrder;
                this.toastService.success('Order canceled successfully');
            },
            error: (err) => {
                console.error('Error canceling order:', err);
                this.toastService.error('Failed to cancel order');
            }
        });
    }

    getStatusClass(status: OrderStatus): string {
        switch (status) {
            case 'PLACED': return 'status-placed';
            case 'PAID': return 'status-paid';
            case 'FULFILLED': return 'status-fulfilled';
            case 'CANCELED': return 'status-canceled';
            default: return '';
        }
    }

    getStatusText(status: OrderStatus): string {
        switch (status) {
            case 'PLACED': return 'Placed';
            case 'PAID': return 'Paid';
            case 'FULFILLED': return 'Fulfilled';
            case 'CANCELED': return 'Canceled';
            default: return status;
        }
    }

    formatPrice(price: number): string {
        return new Intl.NumberFormat('bn-BD', {
            style: 'currency',
            currency: 'BDT'
        }).format(price);
    }

    formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}