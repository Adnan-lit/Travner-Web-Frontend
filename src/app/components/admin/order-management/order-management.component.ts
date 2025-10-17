import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MarketplaceService } from '../../../services/marketplace.service';
import { AuthService } from '../../../services/auth.service';
import { Order } from '../../../models/marketplace.model';
import { User } from '../../../models/common.model';
import { ApiResponse, ApiListResponse } from '../../../models/api-response.model';

interface OrderFilters {
  status: string;
  paymentStatus: string;
  search: string;
  dateFrom: string;
  dateTo: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  paidOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
}

@Component({
  selector: 'app-order-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './order-management.component.html',
  styleUrls: ['./order-management.component.css']
})
export class OrderManagementComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  orders: Order[] = [];
  orderStats: OrderStats = {
    totalOrders: 0,
    pendingOrders: 0,
    paidOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0
  };
  
  filters: OrderFilters = {
    status: '',
    paymentStatus: '',
    search: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  };
  
  pagination = {
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0
  };
  
  isLoading = false;
  selectedOrders: Set<string> = new Set();
  showBulkActions = false;
  
  // Modal states
  showOrderModal = false;
  showStatusModal = false;
  selectedOrder: Order | null = null;
  newStatus: string = '';
  
  private destroy$ = new Subject<void>();

  constructor(
    private marketplaceService: MarketplaceService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        if (user && this.authService.isAdmin()) {
          this.loadOrders();
          this.loadOrderStats();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadOrders(): void {
    this.isLoading = true;
    
    this.marketplaceService.getAllOrders()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: ApiResponse<Order[]>) => {
          this.orders = response.data || [];
          this.applyFilters();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading orders:', error);
          this.isLoading = false;
        }
      });
  }

  loadOrderStats(): void {
    // Calculate stats from orders
    this.orderStats.totalOrders = this.orders.length;
    this.orderStats.pendingOrders = this.orders.filter(order => order.status === 'PENDING').length;
    this.orderStats.paidOrders = this.orders.filter(order => order.status === 'PAID').length;
    this.orderStats.shippedOrders = this.orders.filter(order => order.status === 'SHIPPED').length;
    this.orderStats.deliveredOrders = this.orders.filter(order => order.status === 'DELIVERED').length;
    this.orderStats.cancelledOrders = this.orders.filter(order => order.status === 'CANCELLED').length;
    
    // Calculate revenue
    this.orderStats.totalRevenue = this.orders
      .filter(order => order.status === 'DELIVERED')
      .reduce((total, order) => total + (order.totalAmount || 0), 0);
    
    this.orderStats.averageOrderValue = this.orderStats.totalOrders > 0 
      ? this.orderStats.totalRevenue / this.orderStats.totalOrders 
      : 0;
  }

  applyFilters(): void {
    let filteredOrders = [...this.orders];

    // Apply status filter
    if (this.filters.status) {
      filteredOrders = filteredOrders.filter(order => order.status === this.filters.status);
    }

    // Apply payment status filter
    if (this.filters.paymentStatus) {
      filteredOrders = filteredOrders.filter(order => 
        order.paymentInfo?.status === this.filters.paymentStatus
      );
    }

    // Apply search filter
    if (this.filters.search) {
      const searchTerm = this.filters.search.toLowerCase();
      filteredOrders = filteredOrders.filter(order =>
        order.id.toLowerCase().includes(searchTerm) ||
        order.customerEmail?.toLowerCase().includes(searchTerm) ||
        order.customerName?.toLowerCase().includes(searchTerm)
      );
    }

    // Apply date filters
    if (this.filters.dateFrom) {
      filteredOrders = filteredOrders.filter(order =>
        new Date(order.createdAt) >= new Date(this.filters.dateFrom)
      );
    }

    if (this.filters.dateTo) {
      filteredOrders = filteredOrders.filter(order =>
        new Date(order.createdAt) <= new Date(this.filters.dateTo)
      );
    }

    // Apply sorting
    filteredOrders.sort((a, b) => {
      const aValue = this.getSortValue(a, this.filters.sortBy);
      const bValue = this.getSortValue(b, this.filters.sortBy);
      
      if (this.filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    this.orders = filteredOrders;
    this.pagination.totalElements = filteredOrders.length;
    this.pagination.totalPages = Math.ceil(filteredOrders.length / this.pagination.size);
  }

  private getSortValue(order: Order, sortBy: string): any {
    switch (sortBy) {
      case 'createdAt': return new Date(order.createdAt).getTime();
      case 'totalAmount': return order.totalAmount || 0;
      case 'status': return order.status;
      case 'customerName': return order.customerName || '';
      default: return order.createdAt;
    }
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  onSortChange(): void {
    this.applyFilters();
  }

  onPageChange(page: number): void {
    this.pagination.page = page;
    this.loadOrders();
  }

  onPageSizeChange(size: string | number): void {
    this.pagination.size = typeof size === 'string' ? parseInt(size, 10) : size;
    this.pagination.page = 0;
    this.loadOrders();
  }

  toggleOrderSelection(orderId: string): void {
    if (this.selectedOrders.has(orderId)) {
      this.selectedOrders.delete(orderId);
    } else {
      this.selectedOrders.add(orderId);
    }
    this.showBulkActions = this.selectedOrders.size > 0;
  }

  selectAllOrders(): void {
    if (this.selectedOrders.size === this.orders.length) {
      this.selectedOrders.clear();
    } else {
      this.selectedOrders.clear();
      this.orders.forEach(order => this.selectedOrders.add(order.id));
    }
    this.showBulkActions = this.selectedOrders.size > 0;
  }

  viewOrder(order: Order): void {
    this.selectedOrder = order;
    this.showOrderModal = true;
  }

  updateOrderStatus(order: Order): void {
    this.selectedOrder = order;
    this.newStatus = order.status;
    this.showStatusModal = true;
  }

  confirmStatusUpdate(): void {
    if (!this.selectedOrder) return;

    // Call the appropriate service method based on status
    let updateMethod;
    switch (this.newStatus) {
      case 'PAID':
        updateMethod = this.marketplaceService.payOrder(this.selectedOrder.id);
        break;
      case 'FULFILLED':
        updateMethod = this.marketplaceService.fulfillOrder(this.selectedOrder.id);
        break;
      case 'CANCELLED':
        updateMethod = this.marketplaceService.adminCancelOrder(this.selectedOrder.id);
        break;
      default:
        console.error('Unknown status update:', this.newStatus);
        return;
    }

    updateMethod.pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        console.log('Order status updated:', response);
        this.loadOrders();
        this.loadOrderStats();
        this.showStatusModal = false;
        this.selectedOrder = null;
      },
      error: (error) => {
        console.error('Error updating order status:', error);
      }
    });
  }

  bulkAction(action: string): void {
    const orderIds = Array.from(this.selectedOrders);
    
    switch (action) {
      case 'mark_paid':
        // Implement bulk mark as paid
        console.log('Bulk mark as paid:', orderIds);
        break;
      case 'mark_shipped':
        // Implement bulk mark as shipped
        console.log('Bulk mark as shipped:', orderIds);
        break;
      case 'cancel':
        // Implement bulk cancel
        console.log('Bulk cancel:', orderIds);
        break;
      default:
        console.log('Unknown bulk action:', action);
    }
    
    // Clear selection after action
    this.selectedOrders.clear();
    this.showBulkActions = false;
  }

  exportOrders(): void {
    // Implement order export functionality
    console.log('Export orders');
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'PENDING': return 'badge-warning';
      case 'PAID': return 'badge-info';
      case 'CONFIRMED': return 'badge-primary';
      case 'PROCESSING': return 'badge-secondary';
      case 'FULFILLED': return 'badge-success';
      case 'SHIPPED': return 'badge-info';
      case 'DELIVERED': return 'badge-success';
      case 'CANCELLED': return 'badge-danger';
      case 'REFUNDED': return 'badge-secondary';
      default: return 'badge-secondary';
    }
  }

  getPaymentStatusBadgeClass(status: string): string {
    switch (status) {
      case 'PENDING': return 'badge-warning';
      case 'COMPLETED': return 'badge-success';
      case 'FAILED': return 'badge-danger';
      case 'REFUNDED': return 'badge-secondary';
      default: return 'badge-secondary';
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  closeModal(): void {
    this.showOrderModal = false;
    this.showStatusModal = false;
    this.selectedOrder = null;
  }

  getOrderItemsSummary(order: Order): string {
    if (!order.items || order.items.length === 0) return 'No items';
    
    const itemCount = order.items.reduce((total, item) => total + item.quantity, 0);
    return `${itemCount} item${itemCount !== 1 ? 's' : ''}`;
  }

  getStatusOptions(currentStatus: string): string[] {
    switch (currentStatus) {
      case 'PENDING':
        return ['PAID', 'CANCELLED'];
      case 'PAID':
        return ['FULFILLED', 'CANCELLED'];
      case 'FULFILLED':
        return ['SHIPPED', 'CANCELLED'];
      case 'SHIPPED':
        return ['DELIVERED', 'CANCELLED'];
      case 'DELIVERED':
        return ['REFUNDED'];
      case 'CANCELLED':
        return ['PENDING'];
      default:
        return [];
    }
  }
}
