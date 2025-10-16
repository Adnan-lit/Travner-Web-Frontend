import { Component, OnInit, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { AuthService } from '../../services/auth.service';

import { MarketplaceService } from '../../services/marketplace.service';
import { filter } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class NavbarComponent implements OnInit {
  isAuthenticated = false;
  currentUser: any = null;
  showMobileMenu = false;
  showUserMenu = false;
  lastScrollY = 0;
  hidden = false;
  scrolled = false;
  isLandingRoute = false;
  // Temporarily disable background transition when switching to landing to avoid flash
  suppressTransition = false;

  protected router = inject(Router);
  private authService = inject(AuthService);

  private marketplaceService = inject(MarketplaceService);

  theme$ = of('light');
  cartItemCount = 0;

  constructor() { }

  ngOnInit(): void {
    this.ensureBackdropSupport();
    this.authService.currentUser$.subscribe(user => {
      this.isAuthenticated = !!user;
      this.currentUser = user;
      console.log('🧭 Navbar: Authentication status changed:', this.isAuthenticated);

      // Only load cart count if user is authenticated AND on marketplace page
      if (this.isAuthenticated && this.isMarketplacePage()) {
        this.loadCartCount();
      } else {
        this.cartItemCount = 0;
      }
    });

    // Subscribe to cart item count changes
    // Cart item count subscription removed

    // Set initial state synchronously to avoid first-frame flicker
    this.isLandingRoute = this.router.url === '/' || this.router.url === '';
    if (this.isLandingRoute) {
      // Ensure we start at top and have correct scroll state
      setTimeout(() => { window.scrollTo(0, 0); this.onScroll(); });
    }

    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: any) => {
      const landing = e.urlAfterRedirects === '/' || e.url === '/';
      if (landing !== this.isLandingRoute) {
        // If entering landing, suppress transition for smoother visual
        if (landing) {
          this.suppressTransition = true;
          // Force scroll top so scrolled class doesn't persist from previous page
          window.scrollTo(0, 0);
          this.onScroll();
          // Allow class change without transition in next frame
          requestAnimationFrame(() => {
            this.isLandingRoute = landing;
            // Re-enable transitions after a short delay
            setTimeout(() => this.suppressTransition = false, 80);
          });
        } else {
          this.isLandingRoute = landing;
        }
      } else if (landing) {
        // Still landing: ensure scroll state recalculated (e.g., manual route reuse)
        this.onScroll();
      }

      // Load cart count when entering marketplace pages
      if (this.isAuthenticated && this.isMarketplacePage()) {
        this.loadCartCount();
      } else {
        this.cartItemCount = 0;
      }
    });
  }

  /**
   * Detect backdrop-filter support to prevent transient white background flashes.
   */
  private ensureBackdropSupport(): void {
    try {
      const testEl = document.createElement('div');
      testEl.style.backdropFilter = 'blur(2px)';
      const supported = !!testEl.style.backdropFilter;
      if (!supported) {
        document.documentElement.classList.add('no-backdrop-filter');
      }
    } catch (_) {
      document.documentElement.classList.add('no-backdrop-filter');
    }
  }

  @HostListener('window:scroll')
  onScroll(): void {
    const currentY = window.scrollY;
    this.scrolled = currentY > 20;
    if (currentY > this.lastScrollY && currentY > 120) {
      this.hidden = true; // scrolling down hide
    } else {
      this.hidden = false; // scrolling up show
    }
    this.lastScrollY = currentY;
  }

  isAdmin(): boolean {
    return this.currentUser?.role === 'ADMIN';
  }

  isMarketplacePage(): boolean {
    const url = this.router.url;
    return url.startsWith('/marketplace');
  }

  get initials(): string {
    if (!this.currentUser) return '';
    const name = this.currentUser.firstName || this.currentUser.userName || '';
    return name.substring(0, 2).toUpperCase();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  toggleMobileMenu(): void {
    this.showMobileMenu = !this.showMobileMenu;
  }

  closeMobileMenu(): void {
    this.showMobileMenu = false;
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  closeUserMenu(): void {
    this.showUserMenu = false;
  }

  toggleTheme(): void {
    // Theme toggle removed
  }

  // Convenience navigation methods for template (avoid direct router.navigate usage in HTML)
  go(path: string): void {
    this.router.navigate([path]);
  }

  // Load cart item count
  loadCartCount(): void {
    if (!this.isAuthenticated) {
      this.cartItemCount = 0;
      return;
    }

    // Double-check authentication before making the request
    if (!this.authService.isAuthenticated()) {
      console.log('🧭 Navbar: User not authenticated, skipping cart count load');
      this.cartItemCount = 0;
      return;
    }

    this.marketplaceService.getCartItemCount().subscribe({
      next: (response: any) => {
        this.cartItemCount = response?.data || 0;
        console.log('🧭 Navbar: Cart count loaded successfully:', this.cartItemCount);
      },
      error: (err: any) => {
        console.warn('🧭 Navbar: Failed to load cart count:', err);
        if (err.status === 401) {
          console.log('🧭 Navbar: Authentication failed, clearing cart count');
          // If we get a 401, the user is not properly authenticated
          this.cartItemCount = 0;
        } else {
          this.cartItemCount = 0;
        }
      }
    });
  }
}