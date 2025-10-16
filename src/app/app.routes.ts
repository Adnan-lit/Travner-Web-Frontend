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
import { ProductListFixedComponent } from './components/marketplace/product-list/product-list-fixed.component';

// Marketplace components
import { ProductDetailComponent } from './components/marketplace/product-detail/product-detail.component';
import { CartComponent } from './components/marketplace/cart/cart.component';
import { CheckoutComponent } from './components/marketplace/checkout/checkout.component';
import { OrderListComponent } from './components/marketplace/order-list/order-list.component';
import { OrderDetailComponent } from './components/marketplace/order-detail/order-detail.component';
import { ProductManagementComponent } from './components/marketplace/admin/product-management/product-management.component';
import { OrderManagementComponent } from './components/marketplace/admin/order-management/order-management.component';
import { AuthDebugComponent } from './components/auth-debug/auth-debug.component';
import { TripListComponent } from './components/trips/trip-list/trip-list.component';

// Location-based components
import { ItineraryListComponent } from './components/itineraries/itinerary-list/itinerary-list.component';
import { ItineraryDetailComponent } from './components/itineraries/itinerary-detail/itinerary-detail.component';
import { ItineraryCreateComponent } from './components/itineraries/itinerary-create/itinerary-create.component';
import { ItineraryCreateMinimalComponent } from './components/itineraries/itinerary-create/itinerary-create-minimal.component';
import { ItineraryCreateSimpleComponent } from './components/itineraries/itinerary-create/itinerary-create-simple.component';
import { ItineraryListTestComponent } from './components/itineraries/itinerary-list/itinerary-list-test.component';
import { TravelBuddyListComponent } from './components/travel-buddies/travel-buddy-list/travel-buddy-list.component';
import { LocalGuideListComponent } from './components/local-guides/local-guide-list/local-guide-list.component';

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
      
      // Trip Routes
      { path: 'trips', component: TripListComponent },
      { path: 'trips/create', component: TripListComponent, canActivate: [AuthGuard] },
      { path: 'trips/:id', component: TripListComponent },

      // Itinerary Routes
      { path: 'itineraries', component: ItineraryListComponent },
      { path: 'itineraries/test', component: ItineraryListTestComponent },
      { path: 'itineraries/create', component: ItineraryCreateMinimalComponent },
      { path: 'itineraries/:id', component: ItineraryDetailComponent },
      
      { path: 'travel-buddies', component: TravelBuddyListComponent },
      { path: 'travel-buddies/create', component: TravelBuddyListComponent, canActivate: [AuthGuard] },
      { path: 'travel-buddies/:id', component: TravelBuddyListComponent },
      
      { path: 'local-guides', component: LocalGuideListComponent },
      { path: 'local-guides/create', component: LocalGuideListComponent, canActivate: [AuthGuard] },
      { path: 'local-guides/:id', component: LocalGuideListComponent },

      // Marketplace Routes
      { path: 'marketplace', component: ProductListFixedComponent },
      { path: 'marketplace/products', redirectTo: 'marketplace', pathMatch: 'full' },
      { path: 'marketplace/products/:id', component: ProductDetailComponent },
      { path: 'marketplace/cart', component: CartComponent, canActivate: [AuthGuard] },
      { path: 'marketplace/checkout', component: CheckoutComponent, canActivate: [AuthGuard] },
      { path: 'marketplace/orders', component: OrderListComponent, canActivate: [AuthGuard] },
      { path: 'marketplace/orders/:id', component: OrderDetailComponent, canActivate: [AuthGuard] },

      // Admin Marketplace Routes
      { path: 'admin/marketplace/products', component: ProductManagementComponent, canActivate: [AdminGuard] },
      { path: 'admin/marketplace/orders', component: OrderManagementComponent, canActivate: [AdminGuard] },

      // Debug Routes (development only)
      { path: 'debug/auth', component: AuthDebugComponent },
    ]
  },
  { path: 'signin', component: SigninComponent, canActivate: [NoAuthGuard] },
  { path: 'signup', component: SignupComponent, canActivate: [NoAuthGuard] },
  { path: '**', redirectTo: '' } // Wildcard route for 404 pages
];