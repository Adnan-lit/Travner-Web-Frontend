import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Product, ProductListResponse, ProductSearchParams, CreateProductRequest, UpdateProductRequest } from '@app/models/marketplace.model';
import { MarketplaceService } from '@services/marketplace.service';
import { ToastService } from '@services/toast.service';
import { AuthService } from '@services/auth.service';
import { NgIf, NgFor, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
// import { MarketplaceErrorHandler } from '../../../../../../utils/marketplace-error-handler';
import { ImageUtil } from '@app/utils/image.util';

@Component({
    selector: 'app-product-management',
    standalone: true,
    imports: [NgIf, NgFor, TitleCasePipe, ReactiveFormsModule, FormsModule],
    templateUrl: './product-management.component.html',
    styleUrls: ['./product-management.component.css']
})
export class ProductManagementComponent implements OnInit {
    products: Product[] = [];
    loading = true;
    error: string | null = null;
    showCreateForm = false;
    showEditForm = false;
    editingProduct: Product | null = null;
    productForm: FormGroup;

    // Pagination
    currentPage = 0;
    pageSize = 10;
    totalPages = 0;
    totalElements = 0;

    // Filters
    searchQuery = '';
    categoryFilter = '';

    categories: string[] = [
        'electronics', 'gadgets', 'home', 'fashion', 'books', 'sports', 'toys', 'other'
    ];

    constructor(
        private marketplaceService: MarketplaceService,
        private toastService: ToastService,
        private authService: AuthService,
        private router: Router,
        private fb: FormBuilder
    ) {
        this.productForm = this.fb.group({
            title: ['', [Validators.required, Validators.minLength(3)]],
            description: ['', [Validators.required, Validators.minLength(10)]],
            price: ['', [Validators.required, Validators.min(0)]],
            stock: ['', [Validators.required, Validators.min(0)]],
            category: ['', [Validators.required]],
            imageUrls: [''],
            active: [true]
        });
    }

    ngOnInit(): void {
        // Check if user is admin
        if (!this.authService.isAdmin()) {
            this.router.navigate(['/']);
            this.toastService.error('Access denied. Admin privileges required.', '');
            return;
        }

        this.loadProducts();
    }

    loadProducts(): void {
        this.loading = true;
        this.error = null;

        const params: ProductSearchParams = {
            page: this.currentPage,
            size: this.pageSize,
            query: this.searchQuery
        };

        if (this.categoryFilter) {
            params.category = this.categoryFilter;
        }

        this.marketplaceService.getProducts(params).subscribe({
            next: (response: ProductListResponse) => {
                this.products = response.data || [];
                this.totalPages = response.pagination?.totalPages || 0;
                this.totalElements = response.pagination?.totalElements || 0;
                this.loading = false;
            },
            error: (err: any) => {
                console.error('Error loading products:', err);
                const errorMessage = err.message || 'Failed to load products';
                this.error = errorMessage;
                this.loading = false;
                this.toastService.error('Error', errorMessage);
            }
        });
    }

    onPageChange(page: number): void {
        this.currentPage = page;
        this.loadProducts();
    }

    onSearch(): void {
        this.currentPage = 0;
        this.loadProducts();
    }

    onCategoryFilterChange(): void {
        this.currentPage = 0;
        this.loadProducts();
    }

    clearFilters(): void {
        this.searchQuery = '';
        this.categoryFilter = '';
        this.currentPage = 0;
        this.loadProducts();
    }

    openCreateForm(): void {
        this.showCreateForm = true;
        this.showEditForm = false;
        this.editingProduct = null;
        this.productForm.reset({
            active: true
        });
    }

    openEditForm(product: Product): void {
        this.showEditForm = true;
        this.showCreateForm = false;
        this.editingProduct = product;

        this.productForm.patchValue({
            title: product.name,
            description: product.description,
            price: product.price,
            stock: product.stockQuantity,
            category: product.category,
            imageUrls: product.images.join(', '),
            active: product.isAvailable
        });
    }

    closeForm(): void {
        this.showCreateForm = false;
        this.showEditForm = false;
        this.editingProduct = null;
        this.productForm.reset();
    }

    onSubmit(): void {
        if (this.productForm.invalid) {
            this.toastService.error('Please fill in all required fields correctly', '');
            return;
        }

        const formValue = this.productForm.value;
        const productData: any = {
            name: formValue.title,
            description: formValue.description,
            price: formValue.price,
            stockQuantity: formValue.stock,
            category: formValue.category,
            isAvailable: formValue.active
        };

        // Handle image URLs
        if (formValue.imageUrls) {
            productData.imageUrls = formValue.imageUrls
                .split(',')
                .map((url: string) => url.trim())
                .filter((url: string) => url.length > 0);
        } else {
            productData.imageUrls = [];
        }

        if (this.editingProduct) {
            // Update existing product
            this.updateProduct(this.editingProduct.id, productData);
        } else {
            // Create new product
            this.createProduct(productData);
        }
    }

    createProduct(productData: CreateProductRequest): void {
        this.marketplaceService.createProduct(productData).subscribe({
            next: (response: any) => {
                // Handle the ApiResponse structure
                if (response && response.success && response.data) {
                    this.toastService.success('Product created successfully', '');
                    this.closeForm();
                    this.loadProducts(); // Refresh the product list
                } else {
                    this.toastService.error('Failed to create product', '');
                }
            },
            error: (err: any) => {
                console.error('Error creating product:', err);
                const errorMessage = err.message || 'Failed to create product';
                this.toastService.error('Error', errorMessage);
            }
        });
    }

    updateProduct(id: string, productData: UpdateProductRequest): void {
        this.marketplaceService.updateProduct(id, productData).subscribe({
            next: (response: any) => {
                // Handle the ApiResponse structure
                if (response && response.success && response.data) {
                    this.toastService.success('Product updated successfully', '');
                    this.closeForm();
                    this.loadProducts(); // Refresh the product list
                } else {
                    this.toastService.error('Failed to update product', '');
                }
            },
            error: (err: any) => {
                console.error('Error updating product:', err);
                const errorMessage = err.message || 'Failed to update product';
                this.toastService.error('Error', errorMessage);
            }
        });
    }

    deleteProduct(product: Product): void {
        if (!confirm(`Are you sure you want to delete "${product.name}"?`)) {
            return;
        }

        this.marketplaceService.deleteProduct(product.id).subscribe({
            next: () => {
                this.toastService.success('Product deleted successfully', '');
                this.loadProducts(); // Refresh the product list
            },
            error: (err: any) => {
                console.error('Error deleting product:', err);
                const errorMessage = err.message || 'Failed to delete product';
                this.toastService.error('Error', errorMessage);
            }
        });
    }

    toggleProductStatus(product: Product): void {
        const action = product.isAvailable ? 'deactivate' : 'activate';

        if (!confirm(`Are you sure you want to ${action} "${product.name}"?`)) {
            return;
        }

        this.marketplaceService.updateProduct(product.id, { isAvailable: !product.isAvailable } as UpdateProductRequest).subscribe({
            next: (response: any) => {
                // Handle the ApiResponse structure
                if (response && response.success && response.data) {
                    // Update the product in the list
                    const index = this.products.findIndex(p => p.id === product.id);
                    if (index !== -1) {
                        this.products[index] = response.data;
                    }
                    this.toastService.success('Product ${action}d successfully', '');
                } else {
                    this.toastService.error('Failed to ${action} product', '');
                }
            },
            error: (err: any) => {
                console.error(`Error ${action}ing product:`, err);
                const errorMessage = err.message || `Failed to ${action} product`;
                this.toastService.error('Error', errorMessage);
            }
        });
    }

    formatPrice(price: number): string {
        return new Intl.NumberFormat('bn-BD', {
            style: 'currency',
            currency: 'BDT'
        }).format(price);
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

    // Added missing handleImageError method
    handleImageError(event: any): void {
        ImageUtil.handleImageError(event, 'NO_IMAGE');
    }

    getAdminPlaceholder(): string {
        return ImageUtil.getPlaceholder('admin');
    }
}