import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIf, NgFor, NgClass } from '@angular/common';
import { Observable, Subscription, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, tap, catchError } from 'rxjs/operators';
import { Product, ProductListResponse, ProductSearchParams } from '../../../models/marketplace.model';
import { MarketplaceService } from '../../../services/marketplace.service';
import { ToastService } from '../../../services/toast.service';
import { AuthService } from '../../../services/auth.service';
import { CartSummaryComponent } from '../cart-summary/cart-summary.component';

@Component({
  selector: 'app-product-list-fixed',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgIf,
    NgFor,
    NgClass,
    CartSummaryComponent
  ],
  template: `
    <div class="product-list-container">
      <!-- Cart Summary Widget -->
      <app-cart-summary></app-cart-summary>

      <!-- Search and Filters Section -->
      <div class="search-filters-section">
        <div class="search-container">
          <form [formGroup]="searchForm" (ngSubmit)="onSearch()">
            <div class="search-input-group">
              <input
                type="text"
                formControlName="query"
                placeholder="Search products..."
                class="search-input"
              />
              <button type="submit" class="search-button">
                <i class="fas fa-search"></i>
              </button>
            </div>

            <div class="filters-container">
              <div class="category-filter">
                <label for="category-select">Category:</label>
                <select
                  id="category-select"
                  formControlName="category"
                  (change)="onCategorySelect()"
                  class="category-select"
                >
                  <option value="">All Categories</option>
                  <option *ngFor="let category of categories" [value]="category">
                    {{ category.charAt(0).toUpperCase() + category.slice(1) }}
                  </option>
                </select>
              </div>

              <button
                *ngIf="currentQuery || currentCategory"
                (click)="clearFilters()"
                class="clear-filters-button"
              >
                <i class="fas fa-times"></i> Clear Filters
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Loading products...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error && !loading" class="error-container">
        <i class="fas fa-exclamation-triangle"></i>
        <p>{{ error }}</p>
        <button (click)="loadProducts()" class="retry-button">Try Again</button>
      </div>

      <!-- Products Grid -->
      <div *ngIf="!loading && !error" class="products-grid">
        <div *ngIf="products && products.length > 0" class="grid">
          <div
            *ngFor="let product of products"
            class="product-card"
            [ngClass]="getStockClass(product.stockQuantity)"
          >
            <div class="product-image-container">
              <img
                [src]="getProductImage(product)"
                [alt]="product.name"
                class="product-image"
                (error)="handleImageError($event)"
              />
              <div *ngIf="product.stockQuantity === 0" class="out-of-stock-overlay">
                <span>Out of Stock</span>
              </div>
            </div>

            <div class="product-info">
              <h3 class="product-title">{{ product.name }}</h3>
              <p class="product-description">
                {{
                  (product.description && product.description.length > 100)
                    ? product.description.substring(0, 100) + "..."
                    : (product.description || "")
                }}
              </p>

              <div class="product-meta">
                <span class="product-category">{{ product.category }}</span>
                <span
                  class="product-stock"
                  [class]="getStockClass(product.stockQuantity)"
                >
                  {{ getStockStatus(product.stockQuantity) }}
                </span>
              </div>

              <div class="product-footer">
                <span class="product-price">{{
                  formatPrice(product.price)
                }}</span>
                <div class="product-actions">
                  <button
                    *ngIf="product.stockQuantity > 0"
                    (click)="viewProductDetails(product.id)"
                    class="view-details-button"
                  >
                    View Details
                  </button>
                  <button
                    *ngIf="product.stockQuantity > 0"
                    (click)="addToCart(product)"
                    class="add-to-cart-button"
                    [disabled]="isAddingToCart"
                  >
                    <i class="fas fa-shopping-cart"></i>
                    <span *ngIf="!isAddingToCart">Add to Cart</span>
                    <span *ngIf="isAddingToCart">Adding...</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- No Products State -->
        <div *ngIf="!products || products.length === 0" class="no-products">
          <i class="fas fa-box-open"></i>
          <h3>No products found</h3>
          <p *ngIf="currentQuery || currentCategory">
            Try adjusting your search or filters.
          </p>
          <p *ngIf="!currentQuery && !currentCategory">
            Check back later for new products.
          </p>
        </div>
      </div>

      <!-- Pagination -->
      <div *ngIf="!loading && !error" class="pagination">
        <div *ngIf="totalPages > 1">
          <div class="pagination-container">
            <button
              *ngIf="currentPage > 0"
              (click)="onPageChange(currentPage - 1)"
              class="pagination-button"
              [disabled]="loading"
            >
              <i class="fas fa-chevron-left"></i> Previous
            </button>

            <div class="pagination-info">
              Page {{ currentPage + 1 }} of {{ totalPages }}
              <span *ngIf="totalElements > 0">({{ totalElements }} products)</span>
            </div>

            <button
              *ngIf="currentPage < totalPages - 1"
              (click)="onPageChange(currentPage + 1)"
              class="pagination-button"
              [disabled]="loading"
            >
              Next <i class="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./product-list.component.css']
})
export class ProductListFixedComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  loading = false;
  error: string | null = null;
  searchForm: FormGroup;
  private searchSubscription: Subscription | null = null;

  // Pagination
  currentPage = 0;
  pageSize = 12;
  totalPages = 0;
  totalElements = 0;

  // Filters
  currentCategory: string | null = null;
  currentQuery: string | null = null;

  // Available categories for filter
  categories: string[] = [
    'electronics', 'gadgets', 'home', 'fashion', 'books', 'sports', 'toys', 'other'
  ];

  constructor(
    private marketplaceService: MarketplaceService,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private toastService: ToastService,
    private auth: AuthService
  ) {
    this.searchForm = this.fb.group({
      query: [''],
      category: ['']
    });
  }

  ngOnInit(): void {
    console.log('🛒 ProductListFixedComponent: Initializing...');
    
    // Load products on init
    this.loadProducts();

    // Set up search subscription
    this.searchSubscription = this.searchForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.currentPage = 0;
        this.loadProducts();
      });

    // Handle URL parameters
    this.route.queryParams.subscribe(params => {
      if (params['query']) {
        this.currentQuery = params['query'];
        this.searchForm.patchValue({ query: params['query'] });
      }
      if (params['category']) {
        this.currentCategory = params['category'];
        this.searchForm.patchValue({ category: params['category'] });
      }
      if (params['page']) {
        this.currentPage = parseInt(params['page']) || 0;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  loadProducts(): void {
    console.log('🛒 ProductListFixedComponent: Loading products...');
    this.loading = true;
    this.error = null;

    const params: ProductSearchParams = {
      page: this.currentPage,
      size: this.pageSize,
      query: this.currentQuery || undefined,
      category: this.currentCategory || undefined
    };

    console.log('🛒 ProductListFixedComponent: Params:', params);

    this.marketplaceService.getProducts(params).subscribe({
      next: (response: any) => {
        console.log('✅ ProductListFixedComponent: Products response:', response);
        
        if (response && response.success && response.data) {
          this.products = response.data;
          
          if (response.pagination) {
            this.totalPages = response.pagination.totalPages;
            this.totalElements = response.pagination.totalElements;
          } else {
            this.totalPages = 0;
            this.totalElements = 0;
          }
        } else {
          this.products = [];
          this.totalPages = 0;
          this.totalElements = 0;
        }
        
        this.loading = false;
        console.log('✅ ProductListFixedComponent: Products loaded:', this.products.length);
      },
      error: (err) => {
        console.error('❌ ProductListFixedComponent: Error loading products:', err);
        this.error = 'Failed to load products. Please try again later.';
        this.loading = false;
        this.products = [];
        this.toastService.error('Failed to load products', '');
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.updateUrl();
    this.loadProducts();
  }

  onCategorySelect(): void {
    this.currentCategory = this.searchForm.get('category')?.value || null;
    this.currentPage = 0;
    this.updateUrl();
    this.loadProducts();
  }

  onSearch(): void {
    this.currentQuery = this.searchForm.get('query')?.value?.trim() || null;
    this.currentPage = 0;
    this.updateUrl();
    this.loadProducts();
  }

  clearFilters(): void {
    this.currentQuery = null;
    this.currentCategory = null;
    this.currentPage = 0;
    this.searchForm.patchValue({ query: '', category: '' });
    this.updateUrl();
    this.loadProducts();
  }

  updateUrl(): void {
    const queryParams: any = {};
    if (this.currentQuery) queryParams.query = this.currentQuery;
    if (this.currentCategory) queryParams.category = this.currentCategory;
    if (this.currentPage > 0) queryParams.page = this.currentPage;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParams,
      queryParamsHandling: 'merge'
    });
  }

  handleImageError(event: any): void {
    event.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
  }

  getProductImage(product: Product): string {
    if (product.images && product.images.length > 0) {
      const imageUrl = product.images[0];
      // Check if it's a full URL
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
      }
      // Otherwise, assume it's a local image
      return imageUrl;
    }
    // Use placehold.co for placeholder images with product-specific dimensions and text
    return `https://placehold.co/300x300/cccccc/969696?text=${encodeURIComponent(product.name || 'Product')}`;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('bn-BD', {
      style: 'currency',
      currency: 'BDT'
    }).format(price);
  }

  getStockStatus(stock: number): string {
    if (stock === 0) return 'Out of Stock';
    if (stock < 10) return `Only ${stock} left`;
    return 'In Stock';
  }

  getStockClass(stock: number): string {
    if (stock === 0) return 'out-of-stock';
    if (stock < 10) return 'low-stock';
    return 'in-stock';
  }

  // Cart functionality
  isAddingToCart = false;

  viewProductDetails(productId: string): void {
    this.router.navigate(['/marketplace/products', productId]);
  }

  async addToCart(product: any): Promise<void> {
    if (this.isAddingToCart || product.stockQuantity === 0) return;

    // Check if user is authenticated
    if (!this.auth.isAuthenticated()) {
      if (this.toastService) {
        this.toastService.error('Please sign in to add items to cart', '');
      } else {
        console.error('Please sign in to add items to cart');
      }
      this.router.navigate(['/signin'], {
        queryParams: { returnUrl: this.router.url }
      });
      return;
    }

    this.isAddingToCart = true;

    try {
      const response = await this.marketplaceService.addToCart({
        productId: product.id,
        quantity: 1
      }).toPromise();

      if (response && response.success) {
        this.toastService.success('Item added to cart successfully', '');
      } else {
        this.toastService.error('Failed to add item to cart', '');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      this.toastService.error('Failed to add item to cart', '');
    } finally {
      this.isAddingToCart = false;
    }
  }
}
