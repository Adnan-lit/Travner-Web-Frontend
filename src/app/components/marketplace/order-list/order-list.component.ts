import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Order, OrderListResponse } from '../../../models/marketplace.model';
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
    statusFilter: Order['status'] | 'ALL' = 'ALL';

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

        this.marketplaceService.getUserOrders().subscribe({
            next: (response: any) => {
                if (response && response.success && response.data) {
                    this.orders = response.data || [];
                    // Filter by status if needed
                    if (this.statusFilter !== 'ALL') {
                        this.orders = this.orders.filter(order => order.status === this.statusFilter);
                    }
                } else {
                    this.orders = [];
                }
                this.loading = false;
            },
            error: (err: any) => {
                console.error('Error loading orders:', err);
                this.error = 'Failed to load orders. Please try again later.';
                this.loading = false;
                this.toastService.error('Failed to load orders', '');
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
            this.toastService.error('Only orders with PLACED status can be canceled', '');
            return;
        }

        if (!confirm('Are you sure you want to cancel this order?')) {
            return;
        }

        this.marketplaceService.cancelOrder(order.id).subscribe({
            next: (response: any) => {
                // Handle the ApiResponse structure
                const updatedOrder = response && response.success ? response.data : null;
                // Update the order in the list
                const index = this.orders.findIndex(o => o.id === order.id);
                if (index !== -1 && updatedOrder) {
                    this.orders[index] = updatedOrder;
                }
                this.toastService.success('Order canceled successfully', '');
            },
            error: (err: any) => {
                console.error('Error canceling order:', err);
                this.toastService.error('Failed to cancel order', '');
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
            month: 'short',
            day: 'numeric'
        });
    }
}