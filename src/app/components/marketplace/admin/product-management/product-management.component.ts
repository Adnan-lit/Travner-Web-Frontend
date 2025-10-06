import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Product, ProductListResponse, ProductSearchParams, ProductCreate, ProductUpdate } from '../../../../models/marketplace.model';
import { MarketplaceService } from '../../../../services/marketplace.service';
import { ToastService } from '../../../../services/toast.service';
import { AuthService } from '../../../../services/auth.service';
import { NgIf, NgFor, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MarketplaceErrorHandler } from '../../../../utils/marketplace-error-handler';
import { ImageUtil } from '../../../../utils/image.util';

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
            this.toastService.error('Access denied. Admin privileges required.');
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
            active: undefined // Show all products (active and inactive)
        };

        if (this.searchQuery) {
            params.q = this.searchQuery;
        }

        if (this.categoryFilter) {
            params.category = this.categoryFilter;
        }

        this.marketplaceService.getProducts(params).subscribe({
            next: (response: ProductListResponse) => {
                this.products = response.content;
                this.totalPages = response.totalPages;
                this.totalElements = response.totalElements;
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading products:', err);
                const errorMessage = MarketplaceErrorHandler.getErrorMessage(err);
                this.error = errorMessage;
                this.loading = false;
                this.toastService.error(errorMessage);
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
            title: product.title,
            description: product.description,
            price: product.price,
            stock: product.stock,
            category: product.category,
            imageUrls: product.imageUrls.join(', '),
            active: product.active
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
            this.toastService.error('Please fill in all required fields correctly');
            return;
        }

        const formValue = this.productForm.value;
        const productData: any = {
            title: formValue.title,
            description: formValue.description,
            price: formValue.price,
            stock: formValue.stock,
            category: formValue.category,
            active: formValue.active,
            currency: 'BDT'
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

    createProduct(productData: ProductCreate): void {
        this.marketplaceService.createProduct(productData).subscribe({
            next: (product) => {
                this.toastService.success('Product created successfully');
                this.closeForm();
                this.loadProducts(); // Refresh the product list
            },
            error: (err) => {
                console.error('Error creating product:', err);
                const errorMessage = MarketplaceErrorHandler.getErrorMessage(err);
                this.toastService.error(errorMessage);
            }
        });
    }

    updateProduct(id: string, productData: ProductUpdate): void {
        this.marketplaceService.updateProduct(id, productData).subscribe({
            next: (product) => {
                this.toastService.success('Product updated successfully');
                this.closeForm();
                this.loadProducts(); // Refresh the product list
            },
            error: (err) => {
                console.error('Error updating product:', err);
                const errorMessage = MarketplaceErrorHandler.getErrorMessage(err);
                this.toastService.error(errorMessage);
            }
        });
    }

    deleteProduct(product: Product): void {
        if (!confirm(`Are you sure you want to delete "${product.title}"?`)) {
            return;
        }

        this.marketplaceService.deleteProduct(product.id).subscribe({
            next: () => {
                this.toastService.success('Product deleted successfully');
                this.loadProducts(); // Refresh the product list
            },
            error: (err) => {
                console.error('Error deleting product:', err);
                const errorMessage = MarketplaceErrorHandler.getErrorMessage(err);
                this.toastService.error(errorMessage);
            }
        });
    }

    toggleProductStatus(product: Product): void {
        const action = product.active ? 'deactivate' : 'activate';

        if (!confirm(`Are you sure you want to ${action} "${product.title}"?`)) {
            return;
        }

        this.marketplaceService.updateProduct(product.id, { active: !product.active }).subscribe({
            next: (updatedProduct) => {
                // Update the product in the list
                const index = this.products.findIndex(p => p.id === product.id);
                if (index !== -1) {
                    this.products[index] = updatedProduct;
                }
                this.toastService.success(`Product ${action}d successfully`);
            },
            error: (err) => {
                console.error(`Error ${action}ing product:`, err);
                const errorMessage = MarketplaceErrorHandler.getErrorMessage(err);
                this.toastService.error(errorMessage);
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