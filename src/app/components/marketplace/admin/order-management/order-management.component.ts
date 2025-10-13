import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Order, OrderListResponse } from '../../../../models/marketplace.model';
import { ApiResponse } from '../../../../models/api-response.model';
import { MarketplaceService } from '../../../../services/marketplace.service';
import { ToastService } from '../../../../services/toast.service';
import { AuthService } from '../../../../services/auth.service';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MarketplaceErrorHandler } from '../../../../utils/marketplace-error-handler';

@Component({
    selector: 'app-order-management',
    standalone: true,
    imports: [NgIf, NgFor, ReactiveFormsModule, FormsModule],
    templateUrl: './order-management.component.html',
    styleUrls: ['./order-management.component.css']
})
export class OrderManagementComponent implements OnInit {
    orders: Order[] = [];
    loading = true;
    error: string | null = null;
    showNotesForm = false;
    selectedOrder: Order | null = null;
    notesForm: FormGroup;
    actionType: 'mark-paid' | 'fulfill' | 'cancel' | null = null;

    // Pagination
    currentPage = 0;
    pageSize = 10;
    totalPages = 0;
    totalElements = 0;

    // Filters
    statusFilter: Order['status'] | 'ALL' = 'ALL';
    buyerIdFilter = '';

    constructor(
        private marketplaceService: MarketplaceService,
        private toastService: ToastService,
        private authService: AuthService,
        private router: Router,
        private fb: FormBuilder
    ) {
        this.notesForm = this.fb.group({
            notes: ['']
        });
    }

    ngOnInit(): void {
        // Check if user is admin
        if (!this.authService.isAdmin()) {
            this.router.navigate(['/']);
            this.toastService.error('Access denied. Admin privileges required.');
            return;
        }

        this.loadOrders();
    }

    loadOrders(): void {
        this.loading = true;
        this.error = null;

        const params: any = {
            page: this.currentPage,
            size: this.pageSize
        };

        if (this.statusFilter !== 'ALL') {
            params.status = this.statusFilter;
        }

        if (this.buyerIdFilter) {
            params.buyerId = this.buyerIdFilter;
        }

        this.marketplaceService.getAdminOrders(params).subscribe({
            next: (response: OrderListResponse) => {
                this.orders = response['content'];
                this.totalPages = response['totalPages'];
                this.totalElements = response['totalElements'];
                this.loading = false;
            },
            error: (err: any) => {
                console.error('Error loading orders:', err);
                const errorMessage = MarketplaceErrorHandler.getErrorMessage(err);
                this.error = errorMessage;
                this.loading = false;
                this.toastService.error(errorMessage);
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

    onBuyerIdFilterChange(): void {
        this.currentPage = 0;
        this.loadOrders();
    }

    clearFilters(): void {
        this.statusFilter = 'ALL';
        this.buyerIdFilter = '';
        this.currentPage = 0;
        this.loadOrders();
    }

    openNotesForm(order: Order, action: 'mark-paid' | 'fulfill' | 'cancel'): void {
        this.selectedOrder = order;
        this.actionType = action;
        this.showNotesForm = true;
        this.notesForm.reset();
    }

    closeNotesForm(): void {
        this.showNotesForm = false;
        this.selectedOrder = null;
        this.actionType = null;
        this.notesForm.reset();
    }

    onSubmitNotes(): void {
        if (!this.selectedOrder || !this.actionType) return;

        const notes = this.notesForm.get('notes')?.value;

        switch (this.actionType) {
            case 'mark-paid':
                this.markOrderPaid(this.selectedOrder.id, notes);
                break;
            case 'fulfill':
                this.fulfillOrder(this.selectedOrder.id, notes);
                break;
            case 'cancel':
                this.adminCancelOrder(this.selectedOrder.id, notes);
                break;
        }
    }

    markOrderPaid(orderId: string, notes?: string): void {
        this.marketplaceService.markOrderPaid(orderId, notes).subscribe({
            next: (response: ApiResponse<Order>) => {
                const updatedOrder = response.data;
                // Update the order in the list
                const index = this.orders.findIndex(o => o.id === orderId);
                if (index !== -1 && updatedOrder) {
                    this.orders[index] = updatedOrder;
                }
                this.toastService.success('Order marked as paid');
                this.closeNotesForm();
            },
            error: (err: any) => {
                console.error('Error marking order as paid:', err);
                const errorMessage = MarketplaceErrorHandler.getErrorMessage(err);
                this.toastService.error(errorMessage);
                this.closeNotesForm();
            }
        });
    }

    fulfillOrder(orderId: string, notes?: string): void {
        this.marketplaceService.fulfillOrder(orderId, notes).subscribe({
            next: (response: ApiResponse<Order>) => {
                const updatedOrder = response.data;
                // Update the order in the list
                const index = this.orders.findIndex(o => o.id === orderId);
                if (index !== -1 && updatedOrder) {
                    this.orders[index] = updatedOrder;
                }
                this.toastService.success('Order fulfilled');
                this.closeNotesForm();
            },
            error: (err: any) => {
                console.error('Error fulfilling order:', err);
                const errorMessage = MarketplaceErrorHandler.getErrorMessage(err);
                this.toastService.error(errorMessage);
                this.closeNotesForm();
            }
        });
    }

    adminCancelOrder(orderId: string, notes?: string): void {
        this.marketplaceService.adminCancelOrder(orderId, notes).subscribe({
            next: (response: ApiResponse<Order>) => {
                const updatedOrder = response.data;
                // Update the order in the list
                const index = this.orders.findIndex(o => o.id === orderId);
                if (index !== -1 && updatedOrder) {
                    this.orders[index] = updatedOrder;
                }
                this.toastService.success('Order canceled');
                this.closeNotesForm();
            },
            error: (err: any) => {
                console.error('Error canceling order:', err);
                const errorMessage = MarketplaceErrorHandler.getErrorMessage(err);
                this.toastService.error(errorMessage);
                this.closeNotesForm();
            }
        });
    }

    viewOrderDetails(orderId: string): void {
        this.router.navigate(['/marketplace/orders', orderId]);
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

    getActionText(action: 'mark-paid' | 'fulfill' | 'cancel'): string {
        switch (action) {
            case 'mark-paid': return 'Mark as Paid';
            case 'fulfill': return 'Fulfill Order';
            case 'cancel': return 'Cancel Order';
            default: return '';
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