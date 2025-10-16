import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { NoAuthGuard } from './guards/no-auth.guard';
import { PostOwnerGuard } from './guards/post-owner.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

/**
 * Optimized Routes with Lazy Loading for Better Performance
 * 
 * This configuration implements:
 * - Lazy loading for all feature modules
 * - Route preloading strategies
 * - Code splitting for better bundle optimization
 * - Performance-optimized loading
 */
export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      // Landing page (eagerly loaded for fast initial load)
      { 
        path: '', 
        loadComponent: () => import('./components/landing/landing.component').then(m => m.LandingComponent)
      },
      
      // Dashboard (lazy loaded)
      { 
        path: 'dashboard', 
        loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
        canActivate: [AuthGuard]
      },
      
      // Admin (lazy loaded)
      { 
        path: 'admin', 
        loadComponent: () => import('./components/admin/admin.component').then(m => m.AdminComponent),
        canActivate: [AdminGuard]
      },
      
      // Community/Posts (lazy loaded)
      { 
        path: 'community', 
        loadComponent: () => import('./components/posts/post-list.component').then(m => m.PostListComponent)
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
      
      // Redirects for backward compatibility
      { path: 'posts', redirectTo: 'community', pathMatch: 'full' },
      { path: 'posts/:id', redirectTo: 'community/:id', pathMatch: 'full' },
      
      // Chat (lazy loaded)
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
      
      // Location-based Features (lazy loaded)
      { 
        path: 'itineraries', 
        loadComponent: () => import('./components/itineraries/itinerary-list/itinerary-list.component').then(m => m.ItineraryListComponent)
      },
      { 
        path: 'itineraries/create', 
        loadComponent: () => import('./components/itineraries/itinerary-create/itinerary-create.component').then(m => m.ItineraryCreateComponent),
        canActivate: [AuthGuard]
      },
      { 
        path: 'itineraries/:id', 
        loadComponent: () => import('./components/itineraries/itinerary-detail/itinerary-detail.component').then(m => m.ItineraryDetailComponent)
      },
      
      { 
        path: 'travel-buddies', 
        loadComponent: () => import('./components/travel-buddies/travel-buddy-list/travel-buddy-list.component').then(m => m.TravelBuddyListComponent)
      },
      { 
        path: 'travel-buddies/create', 
        loadComponent: () => import('./components/travel-buddies/travel-buddy-create/travel-buddy-create.component').then(m => m.TravelBuddyCreateComponent),
        canActivate: [AuthGuard]
      },
      { 
        path: 'travel-buddies/:id', 
        loadComponent: () => import('./components/travel-buddies/travel-buddy-detail/travel-buddy-detail.component').then(m => m.TravelBuddyDetailComponent)
      },
      
      { 
        path: 'local-guides', 
        loadComponent: () => import('./components/local-guides/local-guide-list/local-guide-list.component').then(m => m.LocalGuideListComponent)
      },
      { 
        path: 'local-guides/create', 
        loadComponent: () => import('./components/local-guides/local-guide-create/local-guide-create.component').then(m => m.LocalGuideCreateComponent),
        canActivate: [AuthGuard]
      },
      { 
        path: 'local-guides/:id', 
        loadComponent: () => import('./components/local-guides/local-guide-detail/local-guide-detail.component').then(m => m.LocalGuideDetailComponent)
      },
      
      // Trips (lazy loaded)
      { 
        path: 'trips', 
        loadComponent: () => import('./components/trips/trip-list/trip-list.component').then(m => m.TripListComponent)
      },
      { 
        path: 'trips/create', 
        loadComponent: () => import('./components/trips/trip-create/trip-create.component').then(m => m.TripCreateComponent),
        canActivate: [AuthGuard]
      },
      { 
        path: 'trips/:id', 
        loadComponent: () => import('./components/trips/trip-detail/trip-detail.component').then(m => m.TripDetailComponent)
      },

      // Marketplace (lazy loaded)
      { 
        path: 'marketplace', 
        loadComponent: () => import('./components/marketplace/product-list/product-list.component').then(m => m.ProductListComponent)
      },
      { 
        path: 'marketplace/products', 
        redirectTo: 'marketplace', 
        pathMatch: 'full'
      },
      { 
        path: 'marketplace/products/:id', 
        loadComponent: () => import('./components/marketplace/product-detail/product-detail.component').then(m => m.ProductDetailComponent)
      },
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

      // Admin Marketplace Routes (lazy loaded)
      { 
        path: 'admin/marketplace/products', 
        loadComponent: () => import('./components/marketplace/admin/product-management/product-management.component').then(m => m.ProductManagementComponent),
        canActivate: [AdminGuard]
      },
      { 
        path: 'admin/marketplace/orders', 
        loadComponent: () => import('./components/marketplace/admin/order-management/order-management.component').then(m => m.OrderManagementComponent),
        canActivate: [AdminGuard]
      },

      // User Profile (lazy loaded)
      { 
        path: 'profile', 
        loadComponent: () => import('./components/user/user-profile/user-profile.component').then(m => m.UserProfileComponent),
        canActivate: [AuthGuard]
      },
      { 
        path: 'profile/:username', 
        loadComponent: () => import('./components/user/user-profile/user-profile.component').then(m => m.UserProfileComponent)
      },

      // Settings (lazy loaded)
      { 
        path: 'settings', 
        loadComponent: () => import('./components/user/settings/settings.component').then(m => m.SettingsComponent),
        canActivate: [AuthGuard]
      },

      // Debug Routes (development only - lazy loaded)
      { 
        path: 'debug/auth', 
        loadComponent: () => import('./components/auth-debug/auth-debug.component').then(m => m.AuthDebugComponent)
      },
    ]
  },
  
  // Authentication routes (lazy loaded)
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
  
  // 404 page (lazy loaded)
  { 
    path: '404', 
    loadComponent: () => import('./components/error/not-found/not-found.component').then(m => m.NotFoundComponent)
  },
  
  // Wildcard route for 404 pages
  { path: '**', redirectTo: '404' }
];

/**
 * Preloading Strategy Configuration
 * 
 * This can be used with RouterModule.forRoot() to implement
 * custom preloading strategies for better performance.
 */
export const preloadingConfig = {
  // Preload modules after initial load
  preloadAfterMs: 2000,
  
  // Preload critical modules immediately
  criticalModules: [
    'dashboard',
    'community',
    'marketplace'
  ],
  
  // Preload modules on user interaction
  interactionPreload: [
    'chat',
    'itineraries',
    'travel-buddies',
    'local-guides'
  ]
};
