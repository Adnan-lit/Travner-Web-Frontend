import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { MarketplaceService } from '../../services/marketplace.service';
import { AuthService } from '../../services/auth.service';
import { Product, ProductCreate, ProductUpdate, ProductListResponse } from '../../models/marketplace.model';

interface ProductFilter {
    search: string;
    category: string;
    active: boolean | null;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
}

@Component({
    selector: 'app-admin-marketplace',
    templateUrl: './admin-marketplace.component.html',
    styleUrls: ['./admin-marketplace.component.css'],
    standalone: true,
    imports: [CommonModule, RouterModule, ReactiveFormsModule]
})
export class AdminMarketplaceComponent implements OnInit, OnDestroy {
    // Data properties
    products: Product[] = [];
    filteredProducts: Product[] = [];
    categories: string[] = [];
    
    // Loading and error states
    isLoading = false;
    isStatsLoading = false;
    errorMessage = '';
    successMessage = '';
    
    // Forms
    createProductForm!: FormGroup;
    editProductForm!: FormGroup;
    
    // UI state
    activeTab = 'products';
    showCreateProductModal = false;
    showEditProductModal = false;
    showDeleteConfirmModal = false;
    
    // Filtering and sorting
    productFilter: ProductFilter = {
        search: '',
        category: '',
        active: null,
        sortBy: 'title',
        sortOrder: 'asc'
    };
    
    // Selected product for editing/deletion
    selectedProduct: Product | null = null;
    
    // Marketplace stats
    marketplaceStats: any = null;
    
    // Diagnostic properties
    diagnosticResults: any = null;
    showDiagnosticResults = false;
    
    // Subscriptions
    private subscriptions: Subscription[] = [];
    
    constructor(
        private marketplaceService: MarketplaceService,
        private authService: AuthService,
        private formBuilder: FormBuilder,
        private router: Router
    ) { }
    
    ngOnInit(): void {
        // Check authentication first
        const currentUser = this.authService.getCurrentUser();
        
        if (!currentUser) {
            this.router.navigate(['/signin']);
            return;
        }
        
        // Check if user has admin privileges
        if (!this.authService.isAdmin()) {
            this.errorMessage = 'Access denied. You need admin privileges to access this page.';
            setTimeout(() => {
                this.router.navigate(['/dashboard']);
            }, 2000);
            return;
        }
        
        this.initializeForms();
        this.loadInitialData();
    }
    
    ngOnDestroy(): void {
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }
    
    private initializeForms(): void {
        this.createProductForm = this.formBuilder.group({
            title: ['', [Validators.required, Validators.minLength(2)]],
            description: ['', [Validators.required, Validators.minLength(10)]],
            price: [0, [Validators.required, Validators.min(0)]],
            currency: ['BDT', [Validators.required]],
            stock: [0, [Validators.required, Validators.min(0)]],
            category: ['', [Validators.required]],
            imageUrls: ['']
        });
        
        this.editProductForm = this.formBuilder.group({
            title: ['', [Validators.required, Validators.minLength(2)]],
            description: ['', [Validators.required, Validators.minLength(10)]],
            price: [0, [Validators.required, Validators.min(0)]],
            currency: ['BDT', [Validators.required]],
            stock: [0, [Validators.required, Validators.min(0)]],
            category: ['', [Validators.required]],
            active: [true, [Validators.required]]
        });
    }
    
    private loadInitialData(): void {
        this.loadProducts();
        this.loadMarketplaceStats();
    }
    
    // Tab management
    setActiveTab(tab: string): void {
        this.activeTab = tab;
        this.clearMessages();
        
        if (tab === 'products') {
            this.loadProducts();
        } else if (tab === 'stats') {
            this.loadMarketplaceStats();
        }
    }
    
    // Data loading methods
    loadProducts(): void {
        this.isLoading = true;
        this.clearMessages();
        
        const subscription = this.marketplaceService.getProducts().subscribe({
            next: (products: ProductListResponse) => {
                this.products = products.content;
                this.extractCategories();
                this.applyFilters();
                this.isLoading = false;
            },
            error: (error: any) => {
                this.errorMessage = `Failed to load products: ${error.message}`;
                this.isLoading = false;
                this.products = [];
                this.filteredProducts = [];
            }
        });
        
        this.subscriptions.push(subscription);
    }
    
    loadMarketplaceStats(): void {
        this.isStatsLoading = true;
        this.clearMessages();
        
        // For now, we'll calculate stats from the products data
        // In a real implementation, this would come from a dedicated stats endpoint
        setTimeout(() => {
            this.calculateMarketplaceStats();
            this.isStatsLoading = false;
        }, 500);
    }
    
    private calculateMarketplaceStats(): void {
        if (!this.products || this.products.length === 0) {
            this.marketplaceStats = {
                totalProducts: 0,
                activeProducts: 0,
                inactiveProducts: 0,
                totalValue: 0,
                lowStockProducts: 0,
                outOfStockProducts: 0
            };
            return;
        }
        
        const activeProducts = this.products.filter(p => p.active);
        const inactiveProducts = this.products.filter(p => !p.active);
        const lowStockProducts = this.products.filter(p => p.stock > 0 && p.stock <= 10);
        const outOfStockProducts = this.products.filter(p => p.stock === 0);
        const totalValue = activeProducts.reduce((sum, p) => sum + (p.price * p.stock), 0);
        
        this.marketplaceStats = {
            totalProducts: this.products.length,
            activeProducts: activeProducts.length,
            inactiveProducts: inactiveProducts.length,
            totalValue: totalValue,
            lowStockProducts: lowStockProducts.length,
            outOfStockProducts: outOfStockProducts.length
        };
    }
    
    private extractCategories(): void {
        const categorySet = new Set<string>();
        this.products.forEach(product => {
            if (product.category) {
                categorySet.add(product.category);
            }
        });
        this.categories = Array.from(categorySet).sort();
    }
    
    // Filtering and sorting
    applyFilters(): void {
        if (!this.products || this.products.length === 0) {
            this.filteredProducts = [];
            return;
        }
        
        let filtered = [...this.products];
        
        // Apply search filter
        if (this.productFilter.search) {
            const search = this.productFilter.search.toLowerCase();
            filtered = filtered.filter(product =>
                product.title.toLowerCase().includes(search) ||
                product.description.toLowerCase().includes(search)
            );
        }
        
        // Apply category filter
        if (this.productFilter.category) {
            filtered = filtered.filter(product => product.category === this.productFilter.category);
        }
        
        // Apply active filter
        if (this.productFilter.active !== null) {
            filtered = filtered.filter(product => product.active === this.productFilter.active);
        }
        
        // Apply sorting
        filtered.sort((a, b) => {
            const aValue = this.getNestedValue(a, this.productFilter.sortBy);
            const bValue = this.getNestedValue(b, this.productFilter.sortBy);
            
            let comparison = 0;
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                comparison = aValue.localeCompare(bValue);
            } else if (typeof aValue === 'number' && typeof bValue === 'number') {
                comparison = aValue - bValue;
            }
            
            return this.productFilter.sortOrder === 'asc' ? comparison : -comparison;
        });
        
        this.filteredProducts = filtered;
    }
    
    private getNestedValue(obj: any, path: string): any {
        return path.split('.').reduce((o, p) => o && o[p], obj) || '';
    }
    
    onSearchChange(event: Event): void {
        const target = event.target as HTMLInputElement;
        this.productFilter.search = target?.value || '';
        this.applyFilters();
    }
    
    onCategoryFilterChange(event: Event): void {
        const target = event.target as HTMLSelectElement;
        this.productFilter.category = target?.value || '';
        this.applyFilters();
    }
    
    onActiveFilterChange(event: Event): void {
        const target = event.target as HTMLSelectElement;
        const value = target?.value || '';
        this.productFilter.active = value === 'true' ? true : value === 'false' ? false : null;
        this.applyFilters();
    }
    
    onSortChange(sortBy: string): void {
        if (this.productFilter.sortBy === sortBy) {
            this.productFilter.sortOrder = this.productFilter.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            this.productFilter.sortBy = sortBy;
            this.productFilter.sortOrder = 'asc';
        }
        this.applyFilters();
    }
    
    toggleProductStatus(product: Product): void {
        this.isLoading = true;
        this.clearMessages();
        
        const subscription = this.marketplaceService.updateProduct(product.id, {
            active: !product.active
        }).subscribe({
            next: (response) => {
                this.successMessage = `Product ${!product.active ? 'activated' : 'deactivated'} successfully`;
                this.loadProducts();
                this.loadMarketplaceStats();
                this.isLoading = false;
            },
            error: (error: any) => {
                this.errorMessage = error.message;
                this.isLoading = false;
            }
        });
        
        this.subscriptions.push(subscription);
    }
    
    // Product management actions
    openCreateProductModal(): void {
        this.showCreateProductModal = true;
        this.createProductForm.reset();
        this.clearMessages();
    }
    
    closeCreateProductModal(): void {
        this.showCreateProductModal = false;
        this.createProductForm.reset();
    }
    
    onCreateProduct(): void {
        if (this.createProductForm.valid) {
            this.isLoading = true;
            const productData: ProductCreate = this.createProductForm.value;
            
            const subscription = this.marketplaceService.createProduct(productData).subscribe({
                next: (response) => {
                    this.successMessage = 'Product created successfully';
                    this.closeCreateProductModal();
                    this.loadProducts();
                    this.loadMarketplaceStats();
                    this.isLoading = false;
                },
                error: (error: any) => {
                    this.errorMessage = error.message;
                    this.isLoading = false;
                }
            });
            
            this.subscriptions.push(subscription);
        }
    }
    
    openEditProductModal(product: Product): void {
        this.selectedProduct = product;
        this.editProductForm.patchValue({
            title: product.title,
            description: product.description,
            price: product.price,
            currency: product.currency,
            stock: product.stock,
            category: product.category,
            active: product.active
        });
        this.showEditProductModal = true;
        this.clearMessages();
    }
    
    closeEditProductModal(): void {
        this.showEditProductModal = false;
        this.selectedProduct = null;
        this.editProductForm.reset();
    }
    
    onUpdateProduct(): void {
        if (this.editProductForm.valid && this.selectedProduct) {
            this.isLoading = true;
            const productData: ProductUpdate = this.editProductForm.value;
            
            const subscription = this.marketplaceService.updateProduct(this.selectedProduct.id, productData).subscribe({
                next: (response) => {
                    this.successMessage = 'Product updated successfully';
                    this.closeEditProductModal();
                    this.loadProducts();
                    this.loadMarketplaceStats();
                    this.isLoading = false;
                },
                error: (error: any) => {
                    this.errorMessage = error.message;
                    this.isLoading = false;
                }
            });
            
            this.subscriptions.push(subscription);
        }
    }
    
    openDeleteConfirmModal(product: Product): void {
        this.selectedProduct = product;
        this.showDeleteConfirmModal = true;
        this.clearMessages();
    }
    
    closeDeleteConfirmModal(): void {
        this.showDeleteConfirmModal = false;
        this.selectedProduct = null;
    }
    
    onDeleteProduct(): void {
        if (this.selectedProduct) {
            this.isLoading = true;
            
            const subscription = this.marketplaceService.deleteProduct(this.selectedProduct.id).subscribe({
                next: (response) => {
                    this.successMessage = 'Product deleted successfully';
                    this.closeDeleteConfirmModal();
                    this.loadProducts();
                    this.loadMarketplaceStats();
                    this.isLoading = false;
                },
                error: (error: any) => {
                    this.errorMessage = error.message;
                    this.isLoading = false;
                }
            });
            
            this.subscriptions.push(subscription);
        }
    }
    
    // Utility methods
    clearMessages(): void {
        this.errorMessage = '';
        this.successMessage = '';
    }
    
    // Form validation helpers
    isFieldInvalid(form: FormGroup, fieldName: string): boolean {
        const field = form.get(fieldName);
        return field ? field.invalid && (field.dirty || field.touched) : false;
    }
    
    getFieldError(form: FormGroup, fieldName: string): string {
        const field = form.get(fieldName);
        if (field && field.errors) {
            if (field.errors['required']) return `${fieldName} is required`;
            if (field.errors['minlength']) return `${fieldName} must be at least ${field.errors['minlength'].requiredLength} characters`;
            if (field.errors['min']) return `${fieldName} must be at least ${field.errors['min'].min}`;
        }
        return '';
    }
    
    // Diagnostic methods for debugging frontend issues
    runDiagnosticTest(): void {
        console.log('🔧 Running diagnostic test...');
        this.showDiagnosticResults = true;
        this.diagnosticResults = {
            timestamp: new Date().toISOString(),
            status: 'Running...',
            steps: []
        };
        
        // Step 1: Check authentication
        const currentUser = this.authService.getCurrentUser();
        this.diagnosticResults.steps.push({
            step: 'Authentication Check',
            status: currentUser ? '✅ Passed' : '❌ Failed',
            data: currentUser
        });
        
        // Step 2: Check admin privileges
        const isAdmin = this.authService.isAdmin();
        this.diagnosticResults.steps.push({
            step: 'Admin Privileges Check',
            status: isAdmin ? '✅ Passed' : '❌ Failed',
            data: { isAdmin, userRoles: currentUser?.roles }
        });
        
        // Step 3: Test API call
        this.diagnosticResults.steps.push({
            step: 'API Call Test',
            status: '🔄 Testing...',
            data: null
        });
        
        const apiTestIndex = this.diagnosticResults.steps.length - 1;
        
        const subscription = this.marketplaceService.getProducts().subscribe({
            next: (products) => {
                console.log('🎯 Diagnostic API test - Success:', products);
                this.diagnosticResults.steps[apiTestIndex] = {
                    step: 'API Call Test',
                    status: '✅ Success',
                    data: {
                        productsCount: products.content?.length || 0,
                        firstProduct: products.content?.[0] || null,
                        allProducts: products
                    }
                };
                this.diagnosticResults.status = 'Completed Successfully';
            },
            error: (error: any) => {
                console.error('🎯 Diagnostic API test - Error:', error);
                this.diagnosticResults.steps[apiTestIndex] = {
                    step: 'API Call Test',
                    status: '❌ Failed',
                    data: {
                        errorMessage: error.message,
                        errorStatus: error.status,
                        fullError: error
                    }
                };
                this.diagnosticResults.status = 'Failed';
            }
        });
        
        this.subscriptions.push(subscription);
    }
    
    closeDiagnosticResults(): void {
        this.showDiagnosticResults = false;
        this.diagnosticResults = null;
    }
}