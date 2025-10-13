import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AsyncPipe, NgIf, NgFor, NgClass } from '@angular/common';
import { Observable, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Product, ProductListResponse, ProductSearchParams } from '../../../models/marketplace.model';
import { MarketplaceService } from '../../../services/marketplace.service';
import { ToastService } from '../../../services/toast.service';
import { AuthService } from '../../../services/auth.service';
import { CartSummaryComponent } from '../cart-summary/cart-summary.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    AsyncPipe,
    NgIf,
    NgFor,
    NgClass,
    CartSummaryComponent
  ],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit, OnDestroy {
  products$!: Observable<ProductListResponse>;
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
    this.loadProducts();

    // Set up search form debouncing
    this.searchSubscription = this.searchForm.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged((prev, curr) =>
        prev.query === curr.query && prev.category === curr.category
      )
    ).subscribe(() => {
      this.currentPage = 0;
      this.loadProducts();
    });

    // Listen to route changes for pagination
    this.route.queryParams.subscribe(params => {
      const page = params['page'] ? parseInt(params['page'], 10) : 0;
      const query = params['q'] || '';
      const category = params['category'] || '';

      if (page !== this.currentPage || query !== this.currentQuery || category !== this.currentCategory) {
        this.currentPage = page;
        this.currentQuery = query;
        this.currentCategory = category;

        // Update form
        this.searchForm.patchValue({
          query: this.currentQuery,
          category: this.currentCategory
        });

        this.loadProducts();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  loadProducts(): void {
    this.loading = true;
    this.error = null;

    const params: ProductSearchParams = {
      page: this.currentPage,
      size: this.pageSize,
      query: this.currentQuery || undefined,
      category: this.currentCategory || undefined
    };

    this.products$ = this.marketplaceService.getProducts(params);

    // The marketplace service already handles errors gracefully,
    // but we still need to update pagination when data arrives
    this.products$.subscribe({
      next: (response) => {
        // Handle the ApiResponse structure properly
        if (response && response.pagination) {
          this.totalPages = response.pagination.totalPages;
          this.totalElements = response.pagination.totalElements;
        } else {
          // Fallback values if pagination info is missing
          this.totalPages = 0;
          this.totalElements = 0;
        }
        this.loading = false;
      },
      error: (err) => {
        // This error case should be rare since the service handles errors gracefully
        this.error = 'Failed to load products. Please try again later.';
        this.loading = false;
        this.toastService.error('Failed to load products');
        console.error('Error loading products:', err);
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.updateUrl();
    this.loadProducts();
  }

  onCategorySelect(): void {
    const category = this.searchForm.get('category')?.value || '';
    this.currentCategory = category === this.currentCategory ? null : category;
    this.currentPage = 0;
    this.updateUrl();
    this.loadProducts();
  }

  onSearch(): void {
    this.currentPage = 0;
    this.updateUrl();
    this.loadProducts();
  }

  clearFilters(): void {
    this.searchForm.reset();
    this.currentQuery = null;
    this.currentCategory = null;
    this.currentPage = 0;
    this.updateUrl();
    this.loadProducts();
  }

  updateUrl(): void {
    const queryParams: any = {};

    if (this.currentPage > 0) {
      queryParams.page = this.currentPage;
    }

    if (this.currentQuery) {
      queryParams.q = this.currentQuery;
    }

    if (this.currentCategory) {
      queryParams.category = this.currentCategory;
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParams,
      queryParamsHandling: 'merge'
    });
  }

  getProductImage(product: Product): string {
    if (product.images && product.images.length > 0) {
      // If the image is already a full URL, use it directly
      if (product.images[0].startsWith('http')) {
        return product.images[0];
      }
      // Otherwise, assume it's a local image
      return product.images[0];
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
        this.toastService.error('Please sign in to add items to cart');
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
      await this.marketplaceService.addToCart({
        productId: product.id,
        quantity: 1
      }).toPromise();

      if (this.toastService) {
        this.toastService.success(`${product.name} added to cart`);

        // Show option to view cart
        setTimeout(() => {
          this.toastService.info('Item added to cart! Click here to view cart.');
        }, 1000);
      } else {
        console.log(`${product.name} added to cart`);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      if (this.toastService) {
        this.toastService.error('Failed to add item to cart');
      } else {
        console.error('Failed to add item to cart');
      }
    } finally {
      this.isAddingToCart = false;
    }
  }

  handleImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    // Use placehold.co as fallback when image fails to load
    const productName = target.alt || 'Product';
    target.src = `https://placehold.co/300x300/ff0000/ffffff?text=${encodeURIComponent('Image+Error+' + productName)}`;
  }
}