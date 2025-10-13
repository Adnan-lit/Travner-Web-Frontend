import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Order } from '../../../models/marketplace.model';
import { ApiResponse } from '../../../models/api-response.model';
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
            next: (response: ApiResponse<Order>) => {
                this.order = response.data || null;
                this.loading = false;
            },
            error: (err: any) => {
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
            next: (response: ApiResponse<Order>) => {
                this.order = response.data || null;
                this.toastService.success('Order canceled successfully');
            },
            error: (err: any) => {
                console.error('Error canceling order:', err);
                this.toastService.error('Failed to cancel order');
            }
        });
    }

    getStatusClass(status: Order['status']): string {
        switch (status) {
            case 'PLACED': return 'status-placed';
            case 'CONFIRMED': return 'status-confirmed';
            case 'SHIPPED': return 'status-shipped';
            case 'DELIVERED': return 'status-delivered';
            case 'CANCELLED': return 'status-canceled';
            default: return '';
        }
    }

    getStatusText(status: Order['status']): string {
        switch (status) {
            case 'PLACED': return 'Placed';
            case 'CONFIRMED': return 'Confirmed';
            case 'SHIPPED': return 'Shipped';
            case 'DELIVERED': return 'Delivered';
            case 'CANCELLED': return 'Canceled';
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