import { Routes } from '@angular/router';
import { LandingComponent } from './components/landing/landing.component';
import { SigninComponent } from './components/signin/signin.component';
import { SignupComponent } from './components/signup/signup.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AdminComponent } from './components/admin/admin.component';
import { AdminDashboardComponent } from './components/admin/admin-dashboard/admin-dashboard.component';
import { AdminAnalyticsComponent } from './components/admin/admin-analytics/admin-analytics.component';
import { AdminSettingsComponent } from './components/admin/admin-settings/admin-settings.component';
import { UserManagementComponent } from './components/admin/user-management/user-management.component';
import { OrderManagementComponent } from './components/admin/order-management/order-management.component';
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
import { AIChatComponent } from './components/ai-chat/ai-chat.component';
import { ProductListFixedComponent } from './components/marketplace/product-list/product-list-fixed.component';

// Marketplace components
import { ProductDetailComponent } from './components/marketplace/product-detail/product-detail.component';
import { CartComponent } from './components/marketplace/cart/cart.component';
import { CheckoutComponent } from './components/marketplace/checkout/checkout.component';
import { OrderListComponent } from './components/marketplace/order-list/order-list.component';
import { OrderDetailComponent } from './components/marketplace/order-detail/order-detail.component';
import { ProductManagementComponent } from './components/marketplace/admin/product-management/product-management.component';
// import { AuthDebugComponent } from './components/auth-debug/auth-debug.component';

// Trip and location-based components
import { TripListComponent } from './components/trips/trip-list/trip-list.component';
import { TripCreateComponent } from './components/trips/trip-create/trip-create.component';
import { TripDetailComponent } from './components/trips/trip-detail/trip-detail.component';
import { ItineraryListComponent } from './components/itineraries/itinerary-list/itinerary-list.component';
import { ItineraryDetailComponent } from './components/itineraries/itinerary-detail/itinerary-detail.component';
import { ItineraryCreateComponent } from './components/itineraries/itinerary-create/itinerary-create.component';
import { TravelBuddyListComponent } from './components/travel-buddies/travel-buddy-list/travel-buddy-list.component';
import { TravelBuddyCreateComponent } from './components/travel-buddies/travel-buddy-create/travel-buddy-create.component';
import { TravelBuddyDetailComponent } from './components/travel-buddies/travel-buddy-detail/travel-buddy-detail.component';
import { LocalGuideListComponent } from './components/local-guides/local-guide-list/local-guide-list.component';
import { LocalGuideCreateComponent } from './components/local-guides/local-guide-create/local-guide-create.component';
import { LocalGuideDetailComponent } from './components/local-guides/local-guide-detail/local-guide-detail.component';

// Account and error pages
import { UserProfileComponent } from './components/user/user-profile/user-profile.component';
import { SettingsComponent } from './components/user/settings/settings.component';
import { NotFoundComponent } from './components/error/not-found/not-found.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', component: LandingComponent },
      { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
      {
        path: 'admin',
        component: AdminComponent,
        canActivate: [AdminGuard],
        children: [
          { path: '', component: AdminDashboardComponent },
          { path: 'users', component: UserManagementComponent },
          { path: 'posts', component: PostListComponent },
          { path: 'orders', component: OrderManagementComponent },
          { path: 'products', component: ProductManagementComponent },
          { path: 'analytics', component: AdminAnalyticsComponent },
          { path: 'chat', component: ChatComponent },
          { path: 'chat/:id', component: ChatComponent },
          { path: 'settings', component: AdminSettingsComponent }
        ]
      },
      { path: 'community', component: PostListComponent },
      { path: 'community/new', component: PostCreateComponent, canActivate: [AuthGuard] },
      { path: 'community/:id', component: PostDetailComponent },
      { path: 'community/:id/edit', component: PostEditComponent, canActivate: [AuthGuard, PostOwnerGuard] },
      { path: 'posts', redirectTo: 'community', pathMatch: 'full' },
      { path: 'posts/:id', redirectTo: 'community/:id', pathMatch: 'full' },
      { path: 'chat', component: ChatComponent, canActivate: [AuthGuard] },
      { path: 'chat/:id', component: ChatComponent, canActivate: [AuthGuard] },
      { path: 'ai-chat', component: AIChatComponent },

      // Trip routes
      { path: 'trips', component: TripListComponent },
      { path: 'trips/create', component: TripCreateComponent, canActivate: [AuthGuard] },
      { path: 'trips/:id', component: TripDetailComponent },

      // Itinerary routes
      { path: 'itineraries', component: ItineraryListComponent },
      { path: 'itineraries/create', component: ItineraryCreateComponent, canActivate: [AuthGuard] },
      { path: 'itineraries/:id', component: ItineraryDetailComponent },

      { path: 'travel-buddies', component: TravelBuddyListComponent },
      { path: 'travel-buddies/create', component: TravelBuddyCreateComponent, canActivate: [AuthGuard] },
      { path: 'travel-buddies/:id', component: TravelBuddyDetailComponent },

      { path: 'local-guides', component: LocalGuideListComponent },
      { path: 'local-guides/create', component: LocalGuideCreateComponent, canActivate: [AuthGuard] },
      { path: 'local-guides/:id', component: LocalGuideDetailComponent },

      // Marketplace routes
      { path: 'marketplace', component: ProductListFixedComponent },
      { path: 'marketplace/products', redirectTo: 'marketplace', pathMatch: 'full' },
      { path: 'marketplace/products/:id', component: ProductDetailComponent },
      { path: 'marketplace/cart', component: CartComponent, canActivate: [AuthGuard] },
      { path: 'marketplace/checkout', component: CheckoutComponent, canActivate: [AuthGuard] },
      { path: 'marketplace/orders', component: OrderListComponent, canActivate: [AuthGuard] },
      { path: 'marketplace/orders/:id', component: OrderDetailComponent, canActivate: [AuthGuard] },

      // Admin marketplace routes
      { path: 'admin/marketplace/products', component: ProductManagementComponent, canActivate: [AdminGuard] },
      { path: 'admin/marketplace/orders', component: OrderManagementComponent, canActivate: [AdminGuard] },

      // Account routes
      { path: 'profile', component: UserProfileComponent, canActivate: [AuthGuard] },
      { path: 'settings', component: SettingsComponent, canActivate: [AuthGuard] },
      { path: 'user/profile', redirectTo: 'profile', pathMatch: 'full' }

      // Debug Routes (development only)
      // { path: 'debug/auth', component: AuthDebugComponent },
    ]
  },
  { path: 'signin', component: SigninComponent, canActivate: [NoAuthGuard] },
  { path: 'signup', component: SignupComponent, canActivate: [NoAuthGuard] },
  { path: '404', component: NotFoundComponent },
  { path: '**', component: NotFoundComponent }
];
