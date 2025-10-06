import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Order, OrderListResponse, OrderSearchParams, OrderStatus } from '../../../models/marketplace.model';
import { MarketplaceService } from '../../../services/marketplace.service';
import { ToastService } from '../../../services/toast.service';
import { AuthService } from '../../../services/auth.service';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-order-list',
    standalone: true,
    imports: [NgIf, NgFor, FormsModule],
    templateUrl: './order-list.component.html',
    styleUrls: ['./order-list.component.css']
})
export class OrderListComponent implements OnInit {
    orders: Order[] = [];
    loading = true;
    error: string | null = null;

    // Pagination
    currentPage = 0;
    pageSize = 10;
    totalPages = 0;
    totalElements = 0;

    // Status filter
    statusFilter: OrderStatus | 'ALL' = 'ALL';

    constructor(
        private marketplaceService: MarketplaceService,
        private toastService: ToastService,
        private authService: AuthService,
        public router: Router
    ) { }

    ngOnInit(): void {
        if (!this.authService.isAuthenticated()) {
            this.router.navigate(['/signin'], {
                queryParams: { returnUrl: '/marketplace/orders' }
            });
            return;
        }

        this.loadOrders();
    }

    loadOrders(): void {
        this.loading = true;
        this.error = null;

        const params: OrderSearchParams = {
            page: this.currentPage,
            size: this.pageSize
        };

        if (this.statusFilter !== 'ALL') {
            params.status = this.statusFilter;
        }

        this.marketplaceService.getOrders(params).subscribe({
            next: (response: OrderListResponse) => {
                this.orders = response.content;
                this.totalPages = response.totalPages;
                this.totalElements = response.totalElements;
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading orders:', err);
                this.error = 'Failed to load orders. Please try again later.';
                this.loading = false;
                this.toastService.error('Failed to load orders');
            }
        });
    }

    onPageChange(page: number): void {
        this.currentPage = page;
        this.loadOrders();
    }

    onStatusFilterChange(): void {
        this.currentPage = 0;
        this.loadOrders();
    }

    viewOrderDetails(orderId: string): void {
        this.router.navigate(['/marketplace/orders', orderId]);
    }

    cancelOrder(order: Order): void {
        if (order.status !== 'PLACED') {
            this.toastService.error('Only orders with PLACED status can be canceled');
            return;
        }

        if (!confirm('Are you sure you want to cancel this order?')) {
            return;
        }

        this.marketplaceService.cancelOrder(order.id).subscribe({
            next: (updatedOrder) => {
                // Update the order in the list
                const index = this.orders.findIndex(o => o.id === order.id);
                if (index !== -1) {
                    this.orders[index] = updatedOrder;
                }
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
            month: 'short',
            day: 'numeric'
        });
    }
}