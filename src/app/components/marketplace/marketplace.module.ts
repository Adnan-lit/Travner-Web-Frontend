import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

// Product components
import { ProductListComponent } from './product-list/product-list.component';
import { ProductDetailComponent } from './product-detail/product-detail.component';

// Cart and checkout components
import { CartComponent } from './cart/cart.component';
import { CheckoutComponent } from './checkout/checkout.component';

// Order components
import { OrderListComponent } from './order-list/order-list.component';
import { OrderDetailComponent } from './order-detail/order-detail.component';

// Admin components
import { ProductManagementComponent } from './admin/product-management/product-management.component';
import { OrderManagementComponent } from './admin/order-management/order-management.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    // Standalone components must be imported, not declared
    ProductListComponent,
    ProductDetailComponent,
    CartComponent,
    CheckoutComponent,
    OrderListComponent,
    OrderDetailComponent,
    ProductManagementComponent,
    OrderManagementComponent
  ],
  exports: [
    ProductListComponent,
    ProductDetailComponent,
    CartComponent,
    CheckoutComponent,
    OrderListComponent,
    OrderDetailComponent,
    ProductManagementComponent,
    OrderManagementComponent
  ]
})
export class MarketplaceModule { }