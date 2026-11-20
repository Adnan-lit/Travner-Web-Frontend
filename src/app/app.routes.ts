import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { NoAuthGuard } from './guards/no-auth.guard';
import { PostOwnerGuard } from './guards/post-owner.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

/**
 * All feature pages are lazy-loaded so the initial bundle only contains the
 * application shell, guards and shared infrastructure. Routes marked with
 * `data: { preload: true }` are warmed by SelectivePreloadingStrategy.
 */
export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', loadComponent: () => import('./components/landing/landing.component').then(m => m.LandingComponent) },
      {
        path: 'dashboard',
        loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
        canActivate: [AuthGuard]
      },
      {
        path: 'admin',
        loadComponent: () => import('./components/admin/admin.component').then(m => m.AdminComponent),
        canActivate: [AdminGuard],
        children: [
          { path: '', loadComponent: () => import('./components/admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent) },
          { path: 'users', loadComponent: () => import('./components/admin/user-management/user-management.component').then(m => m.UserManagementComponent) },
          { path: 'posts', loadComponent: () => import('./components/posts/post-list.component').then(m => m.PostListComponent) },
          { path: 'orders', loadComponent: () => import('./components/admin/order-management/order-management.component').then(m => m.OrderManagementComponent) },
          { path: 'products', loadComponent: () => import('./components/marketplace/admin/product-management/product-management.component').then(m => m.ProductManagementComponent) },
          { path: 'analytics', loadComponent: () => import('./components/admin/admin-analytics/admin-analytics.component').then(m => m.AdminAnalyticsComponent) },
          { path: 'chat', loadComponent: () => import('./components/chat/chat.component').then(m => m.ChatComponent) },
          { path: 'chat/:id', loadComponent: () => import('./components/chat/chat.component').then(m => m.ChatComponent) },
          { path: 'settings', loadComponent: () => import('./components/admin/admin-settings/admin-settings.component').then(m => m.AdminSettingsComponent) }
        ]
      },
      {
        path: 'community',
        loadComponent: () => import('./components/posts/post-list.component').then(m => m.PostListComponent),
        data: { preload: true }
      },
      {
        path: 'community/new',
        loadComponent: () => import('./components/posts/post-create/post-create.component').then(m => m.PostCreateComponent),
        canActivate: [AuthGuard]
      },
      {
        path: 'community/:id',
        loadComponent: () => import('./components/posts/post-detail/post-detail.component').then(m => m.PostDetailComponent)
      },
      {
        path: 'community/:id/edit',
        loadComponent: () => import('./components/posts/post-edit/post-edit.component').then(m => m.PostEditComponent),
        canActivate: [AuthGuard, PostOwnerGuard]
      },
      { path: 'posts', redirectTo: 'community', pathMatch: 'full' },
      { path: 'posts/:id', redirectTo: 'community/:id', pathMatch: 'full' },
      {
        path: 'chat',
        loadComponent: () => import('./components/chat/chat.component').then(m => m.ChatComponent),
        canActivate: [AuthGuard]
      },
      {
        path: 'chat/:id',
        loadComponent: () => import('./components/chat/chat.component').then(m => m.ChatComponent),
        canActivate: [AuthGuard]
      },
      { path: 'ai-chat', loadComponent: () => import('./components/ai-chat/ai-chat.component').then(m => m.AIChatComponent) },

      { path: 'trips', loadComponent: () => import('./components/trips/trip-list/trip-list.component').then(m => m.TripListComponent) },
      {
        path: 'trips/create',
        loadComponent: () => import('./components/trips/trip-create/trip-create.component').then(m => m.TripCreateComponent),
        canActivate: [AuthGuard]
      },
      { path: 'trips/:id', loadComponent: () => import('./components/trips/trip-detail/trip-detail.component').then(m => m.TripDetailComponent) },

      { path: 'itineraries', loadComponent: () => import('./components/itineraries/itinerary-list/itinerary-list.component').then(m => m.ItineraryListComponent) },
      {
        path: 'itineraries/create',
        loadComponent: () => import('./components/itineraries/itinerary-create/itinerary-create.component').then(m => m.ItineraryCreateComponent),
        canActivate: [AuthGuard]
      },
      { path: 'itineraries/:id', loadComponent: () => import('./components/itineraries/itinerary-detail/itinerary-detail.component').then(m => m.ItineraryDetailComponent) },

      { path: 'travel-buddies', loadComponent: () => import('./components/travel-buddies/travel-buddy-list/travel-buddy-list.component').then(m => m.TravelBuddyListComponent) },
      {
        path: 'travel-buddies/create',
        loadComponent: () => import('./components/travel-buddies/travel-buddy-create/travel-buddy-create.component').then(m => m.TravelBuddyCreateComponent),
        canActivate: [AuthGuard]
      },
      { path: 'travel-buddies/:id', loadComponent: () => import('./components/travel-buddies/travel-buddy-detail/travel-buddy-detail.component').then(m => m.TravelBuddyDetailComponent) },

      { path: 'local-guides', loadComponent: () => import('./components/local-guides/local-guide-list/local-guide-list.component').then(m => m.LocalGuideListComponent) },
      {
        path: 'local-guides/create',
        loadComponent: () => import('./components/local-guides/local-guide-create/local-guide-create.component').then(m => m.LocalGuideCreateComponent),
        canActivate: [AuthGuard]
      },
      { path: 'local-guides/:id', loadComponent: () => import('./components/local-guides/local-guide-detail/local-guide-detail.component').then(m => m.LocalGuideDetailComponent) },

      {
        path: 'marketplace',
        loadComponent: () => import('./components/marketplace/product-list/product-list.component').then(m => m.ProductListComponent),
        data: { preload: true }
      },
      { path: 'marketplace/products', redirectTo: 'marketplace', pathMatch: 'full' },
      { path: 'marketplace/products/:id', loadComponent: () => import('./components/marketplace/product-detail/product-detail.component').then(m => m.ProductDetailComponent) },
      {
        path: 'marketplace/cart',
        loadComponent: () => import('./components/marketplace/cart/cart.component').then(m => m.CartComponent),
        canActivate: [AuthGuard]
      },
      {
        path: 'marketplace/checkout',
        loadComponent: () => import('./components/marketplace/checkout/checkout.component').then(m => m.CheckoutComponent),
        canActivate: [AuthGuard]
      },
      {
        path: 'marketplace/orders',
        loadComponent: () => import('./components/marketplace/order-list/order-list.component').then(m => m.OrderListComponent),
        canActivate: [AuthGuard]
      },
      {
        path: 'marketplace/orders/:id',
        loadComponent: () => import('./components/marketplace/order-detail/order-detail.component').then(m => m.OrderDetailComponent),
        canActivate: [AuthGuard]
      },

      {
        path: 'admin/marketplace/products',
        loadComponent: () => import('./components/marketplace/admin/product-management/product-management.component').then(m => m.ProductManagementComponent),
        canActivate: [AdminGuard]
      },
      {
        path: 'admin/marketplace/orders',
        loadComponent: () => import('./components/admin/order-management/order-management.component').then(m => m.OrderManagementComponent),
        canActivate: [AdminGuard]
      },

      {
        path: 'profile',
        loadComponent: () => import('./components/user/user-profile/user-profile.component').then(m => m.UserProfileComponent),
        canActivate: [AuthGuard]
      },
      {
        path: 'settings',
        loadComponent: () => import('./components/user/settings/settings.component').then(m => m.SettingsComponent),
        canActivate: [AuthGuard]
      },
      { path: 'user/profile', redirectTo: 'profile', pathMatch: 'full' }
    ]
  },
  {
    path: 'signin',
    loadComponent: () => import('./components/signin/signin.component').then(m => m.SigninComponent),
    canActivate: [NoAuthGuard]
  },
  {
    path: 'signup',
    loadComponent: () => import('./components/signup/signup.component').then(m => m.SignupComponent),
    canActivate: [NoAuthGuard]
  },
  { path: '404', loadComponent: () => import('./components/error/not-found/not-found.component').then(m => m.NotFoundComponent) },
  { path: '**', loadComponent: () => import('./components/error/not-found/not-found.component').then(m => m.NotFoundComponent) }
];
