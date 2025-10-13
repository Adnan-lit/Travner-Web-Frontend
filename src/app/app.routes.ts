import { Routes } from '@angular/router';
import { LandingComponent } from './components/landing/landing.component';
import { SigninComponent } from './components/signin/signin.component';
import { SignupComponent } from './components/signup/signup.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AdminComponent } from './components/admin/admin.component';
import { PostListComponent } from './components/posts/post-list.component';
import { PostDetailComponent } from './components/posts/post-detail/post-detail.component';
import { PostEditComponent } from './components/posts/post-edit/post-edit.component';
import { PostCreateComponent } from './components/posts/post-create/post-create.component';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { NoAuthGuard } from './guards/no-auth.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { PostOwnerGuard } from './guards/post-owner.guard';
import { ChatComponent } from './components/chat/chat.component';
import { ProductListComponent } from './components/marketplace/product-list/product-list.component';

// Marketplace components
import { ProductDetailComponent } from './components/marketplace/product-detail/product-detail.component';
import { CartComponent } from './components/marketplace/cart/cart.component';
import { CheckoutComponent } from './components/marketplace/checkout/checkout.component';
import { OrderListComponent } from './components/marketplace/order-list/order-list.component';
import { OrderDetailComponent } from './components/marketplace/order-detail/order-detail.component';
import { ProductManagementComponent } from './components/marketplace/admin/product-management/product-management.component';
import { OrderManagementComponent } from './components/marketplace/admin/order-management/order-management.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', component: LandingComponent },
      { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
      { path: 'admin', component: AdminComponent, canActivate: [AdminGuard] },
      { path: 'community', component: PostListComponent },
      { path: 'community/new', component: PostCreateComponent, canActivate: [AuthGuard] },
      { path: 'community/:id', component: PostDetailComponent },
      { path: 'community/:id/edit', component: PostEditComponent, canActivate: [AuthGuard, PostOwnerGuard] },
      { path: 'posts', redirectTo: 'community', pathMatch: 'full' },
      { path: 'posts/:id', redirectTo: 'community/:id', pathMatch: 'full' },
      { path: 'chat', component: ChatComponent, canActivate: [AuthGuard] },
      { path: 'chat/:id', component: ChatComponent, canActivate: [AuthGuard] },

      // Marketplace Routes
      { path: 'marketplace', component: ProductListComponent },
      { path: 'marketplace/products', redirectTo: 'marketplace', pathMatch: 'full' },
      { path: 'marketplace/products/:id', component: ProductDetailComponent },
      { path: 'marketplace/cart', component: CartComponent, canActivate: [AuthGuard] },
      { path: 'marketplace/checkout', component: CheckoutComponent, canActivate: [AuthGuard] },
      { path: 'marketplace/orders', component: OrderListComponent, canActivate: [AuthGuard] },
      { path: 'marketplace/orders/:id', component: OrderDetailComponent, canActivate: [AuthGuard] },

      // Admin Marketplace Routes
      { path: 'admin/marketplace/products', component: ProductManagementComponent, canActivate: [AdminGuard] },
      { path: 'admin/marketplace/orders', component: OrderManagementComponent, canActivate: [AdminGuard] },
    ]
  },
  { path: 'signin', component: SigninComponent, canActivate: [NoAuthGuard] },
  { path: 'signup', component: SignupComponent, canActivate: [NoAuthGuard] },
  { path: '**', redirectTo: '' } // Wildcard route for 404 pages
];