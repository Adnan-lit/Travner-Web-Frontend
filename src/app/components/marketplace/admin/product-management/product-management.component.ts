import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Product, ProductListResponse, ProductSearchParams, CreateProductRequest, UpdateProductRequest } from '@app/models/marketplace.model';
import { MarketplaceService } from '@services/marketplace.service';
import { MediaService, MediaFile } from '@services/media.service';
import { ToastService } from '@services/toast.service';
import { AuthService } from '@services/auth.service';
import { NgIf, NgFor, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
// import { MarketplaceErrorHandler } from '../../../../../../utils/marketplace-error-handler';
import { ImageUtil } from '@app/utils/image.util';
import { MediaUploadComponent } from '../../../media/media-upload/media-upload.component';

@Component({
    selector: 'app-product-management',
    standalone: true,
    imports: [NgIf, NgFor, TitleCasePipe, ReactiveFormsModule, FormsModule, MediaUploadComponent],
    templateUrl: './product-management.component.html',
    styleUrls: ['./product-management.component.css']
})
export class ProductManagementComponent implements OnInit {
    @ViewChild(MediaUploadComponent) mediaUploadComponent?: MediaUploadComponent;
    
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

    // Media upload properties
    uploadedMedia: MediaFile[] = [];

    constructor(
        private marketplaceService: MarketplaceService,
        public mediaService: MediaService,
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
            title: product.name || '',
            description: product.description || '',
            price: product.price || 0,
            stock: product.stockQuantity || 0,
            category: product.category || '',
            imageUrls: product.images && Array.isArray(product.images) ? product.images.join(', ') : '',
            active: product.isAvailable !== undefined ? product.isAvailable : true
        });
    }

    closeForm(): void {
        this.showCreateForm = false;
        this.showEditForm = false;
        this.editingProduct = null;
        this.productForm.reset();
        
        // Clear media data
        this.uploadedMedia = [];
        
        // Clear MediaUploadComponent's internal state
        if (this.mediaUploadComponent) {
            this.mediaUploadComponent.clearAll();
        }
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

        // Handle image URLs - use uploaded media IDs for backend association
        const mediaIds: string[] = this.uploadedMedia.map(media => media.id);
        productData.mediaIds = mediaIds;
        
        // Also include the download URLs for backward compatibility
        const imageUrls: string[] = this.uploadedMedia.map(media => 
            this.mediaService.getMediaUrlById(media.id)
        );
        
        // Add manual image URLs from form if any
        if (formValue.imageUrls) {
            const manualUrls = formValue.imageUrls
                .split(',')
                .map((url: string) => url.trim())
                .filter((url: string) => url.length > 0);
            imageUrls.push(...manualUrls);
        }
        
        productData.imageUrls = imageUrls;

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

    formatPrice(price: number | null | undefined): string {
        if (price === null || price === undefined) return 'Price not available';
        return new Intl.NumberFormat('bn-BD', {
            style: 'currency',
            currency: 'BDT'
        }).format(price);
    }

    getStockStatus(stock: number | null | undefined): string {
        if (stock === null || stock === undefined) return 'Unknown';
        if (stock === 0) return 'Out of Stock';
        if (stock < 5) return `Only ${stock} left`;
        return 'In Stock';
    }

    getStockClass(stock: number | null | undefined): string {
        if (stock === null || stock === undefined) return 'unknown-stock';
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

    // Media upload event handlers (used with MediaUploadComponent)
    onMediaUploaded(mediaFiles: MediaFile[]): void {
        this.uploadedMedia = mediaFiles;
        console.log('Product media uploaded:', mediaFiles);
        this.toastService.success('Media uploaded', `${mediaFiles.length} file(s) uploaded successfully`);
    }

    onMediaUploadComplete(): void {
        console.log('Product media upload complete');
    }

    onMediaUploadError(error: any): void {
        console.error('Product media upload error:', error);
        this.toastService.error('Upload failed', error.message || 'Failed to upload media');
    }

    // Pagination helper methods
    getPageNumbers(): number[] {
        const pages: number[] = [];
        const maxPages = Math.min(this.totalPages, 5);
        const startPage = Math.max(0, this.currentPage - 2);
        const endPage = Math.min(this.totalPages - 1, startPage + maxPages - 1);
        
        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        return pages;
    }

}