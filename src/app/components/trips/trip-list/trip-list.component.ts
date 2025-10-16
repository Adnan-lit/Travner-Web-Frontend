import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TripService } from '../../../services/trip.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { Trip, TripParticipant } from '../../../services/trip.service';

@Component({
  selector: 'app-trip-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="trip-list-container">
      <!-- Header -->
      <div class="trip-header">
        <div class="header-content">
          <h1>Travel Trips</h1>
          <p>Discover and plan amazing travel experiences</p>
        </div>
        <div class="header-actions" *ngIf="isAuthenticated">
          <button class="create-trip-btn" (click)="createNewTrip()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14"></path>
            </svg>
            Create Trip
          </button>
        </div>
      </div>

      <!-- Filters and Search -->
      <div class="filters-section">
        <form [formGroup]="searchForm" (ngSubmit)="onSearch()" class="search-form">
          <div class="search-input-group">
            <input
              type="text"
              formControlName="search"
              placeholder="Search trips by destination, title..."
              class="search-input"
            />
            <select formControlName="status" class="status-select">
              <option value="">All Status</option>
              <option value="PLANNING">Planning</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <select formControlName="destination" class="destination-select">
              <option value="">All Destinations</option>
              <option value="Paris">Paris</option>
              <option value="Tokyo">Tokyo</option>
              <option value="New York">New York</option>
              <option value="London">London</option>
              <option value="Barcelona">Barcelona</option>
              <option value="Rome">Rome</option>
              <option value="Amsterdam">Amsterdam</option>
              <option value="Berlin">Berlin</option>
            </select>
            <button type="submit" class="search-btn">Search</button>
            <button type="button" class="clear-btn" (click)="clearFilters()">Clear</button>
          </div>
        </form>
      </div>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="loading">
        <div class="loader"></div>
        <p>Loading trips...</p>
      </div>

      <!-- Error State -->
      <div class="error-state" *ngIf="error">
        <div class="error-icon">⚠️</div>
        <h3>Oops! Something went wrong</h3>
        <p>{{ error }}</p>
        <button class="retry-btn" (click)="loadTrips()">Try Again</button>
      </div>

      <!-- Trips Grid -->
      <div class="trips-grid" *ngIf="!loading && !error">
        <!-- Trip Cards -->
        <div 
          *ngFor="let trip of trips" 
          class="trip-card"
          [class.featured]="trip.status === 'CONFIRMED'"
          (click)="viewTripDetails(trip.id)"
        >
          <!-- Trip Image -->
          <div class="trip-image">
            <img 
              [src]="getTripImage(trip)" 
              [alt]="trip.title"
              (error)="handleImageError($event)"
            />
            <div class="trip-status" [class]="getStatusClass(trip.status)">
              {{ getStatusText(trip.status) }}
            </div>
            <div class="trip-dates">
              <span class="start-date">{{ formatDate(trip.startDate) }}</span>
              <span class="date-separator">→</span>
              <span class="end-date">{{ formatDate(trip.endDate) }}</span>
            </div>
          </div>

          <!-- Trip Content -->
          <div class="trip-content">
            <div class="trip-header">
              <h3 class="trip-title">{{ trip.title }}</h3>
              <div class="trip-budget" *ngIf="trip.budget">
                <span class="budget-amount">{{ formatCurrency(trip.budget, trip.currency) }}</span>
              </div>
            </div>

            <div class="trip-destination">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span>{{ trip.destination }}</span>
            </div>

            <p class="trip-description">{{ trip.description }}</p>

            <!-- Trip Tags -->
            <div class="trip-tags" *ngIf="trip.tags && trip.tags.length > 0">
              <span class="tag" *ngFor="let tag of trip.tags.slice(0, 3)">{{ tag }}</span>
              <span class="more-tags" *ngIf="trip.tags.length > 3">+{{ trip.tags.length - 3 }} more</span>
            </div>

            <!-- Trip Stats -->
            <div class="trip-stats">
              <div class="stat">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <span>{{ trip.participants.length || 0 }} participants</span>
              </div>
              <div class="stat">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14,2 14,8 20,8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10,9 9,9 8,9"></polyline>
                </svg>
                <span>{{ trip.itinerary.length || 0 }} activities</span>
              </div>
              <div class="stat">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21,15 16,10 5,21"></polyline>
                </svg>
                <span>{{ trip.photos.length || 0 }} photos</span>
              </div>
            </div>

            <!-- Trip Actions -->
            <div class="trip-actions">
              <button 
                class="action-btn primary" 
                (click)="viewTripDetails(trip.id); $event.stopPropagation()"
              >
                View Details
              </button>
              <button 
                class="action-btn secondary" 
                (click)="joinTrip(trip); $event.stopPropagation()"
                *ngIf="canJoinTrip(trip)"
              >
                Join Trip
              </button>
              <button 
                class="action-btn danger" 
                (click)="leaveTrip(trip); $event.stopPropagation()"
                *ngIf="isParticipant(trip)"
              >
                Leave Trip
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div class="empty-state" *ngIf="trips.length === 0 && !loading">
          <div class="empty-icon">🗺️</div>
          <h3>No trips found</h3>
          <p>Try adjusting your search criteria or create a new trip</p>
          <button class="create-trip-btn" (click)="createNewTrip()" *ngIf="isAuthenticated">
            Create Your First Trip
          </button>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination" *ngIf="totalPages > 1">
        <button 
          class="pagination-btn" 
          [disabled]="currentPage === 0"
          (click)="onPageChange(currentPage - 1)"
        >
          Previous
        </button>
        
        <div class="page-numbers">
          <button 
            *ngFor="let page of getPageNumbers()" 
            class="page-btn"
            [class.active]="page === currentPage"
            (click)="onPageChange(page)"
          >
            {{ page + 1 }}
          </button>
        </div>
        
        <button 
          class="pagination-btn" 
          [disabled]="currentPage >= totalPages - 1"
          (click)="onPageChange(currentPage + 1)"
        >
          Next
        </button>
      </div>
    </div>
  `,
  styles: [`
    .trip-list-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .trip-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 2px solid #e9ecef;
    }

    .header-content h1 {
      margin: 0 0 0.5rem 0;
      color: #333;
      font-size: 2.5rem;
      font-weight: 700;
    }

    .header-content p {
      margin: 0;
      color: #666;
      font-size: 1.1rem;
    }

    .create-trip-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .create-trip-btn:hover {
      background: #0056b3;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
    }

    .filters-section {
      margin-bottom: 2rem;
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .search-form {
      width: 100%;
    }

    .search-input-group {
      display: flex;
      gap: 1rem;
      align-items: center;
      flex-wrap: wrap;
    }

    .search-input {
      flex: 2;
      padding: 0.75rem 1rem;
      border: 2px solid #e9ecef;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.3s ease;
    }

    .search-input:focus {
      outline: none;
      border-color: #007bff;
    }

    .status-select, .destination-select {
      flex: 1;
      padding: 0.75rem 1rem;
      border: 2px solid #e9ecef;
      border-radius: 8px;
      font-size: 1rem;
      background: white;
      cursor: pointer;
    }

    .search-btn, .clear-btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .search-btn {
      background: #28a745;
      color: white;
    }

    .search-btn:hover {
      background: #218838;
    }

    .clear-btn {
      background: #6c757d;
      color: white;
    }

    .clear-btn:hover {
      background: #5a6268;
    }

    .loading-state, .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      text-align: center;
    }

    .loader {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #007bff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .retry-btn {
      padding: 0.75rem 1.5rem;
      background: #dc3545;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      margin-top: 1rem;
    }

    .trips-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .trip-card {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      transition: all 0.3s ease;
      cursor: pointer;
      position: relative;
    }

    .trip-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    }

    .trip-card.featured {
      border: 2px solid #28a745;
    }

    .trip-image {
      position: relative;
      height: 200px;
      overflow: hidden;
    }

    .trip-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    .trip-card:hover .trip-image img {
      transform: scale(1.05);
    }

    .trip-status {
      position: absolute;
      top: 1rem;
      right: 1rem;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .trip-status.planning {
      background: #ffc107;
      color: #000;
    }

    .trip-status.confirmed {
      background: #28a745;
      color: white;
    }

    .trip-status.in-progress {
      background: #17a2b8;
      color: white;
    }

    .trip-status.completed {
      background: #6c757d;
      color: white;
    }

    .trip-status.cancelled {
      background: #dc3545;
      color: white;
    }

    .trip-dates {
      position: absolute;
      bottom: 1rem;
      left: 1rem;
      right: 1rem;
      background: rgba(0,0,0,0.7);
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.9rem;
    }

    .date-separator {
      margin: 0 0.5rem;
    }

    .trip-content {
      padding: 1.5rem;
    }

    .trip-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }

    .trip-title {
      margin: 0;
      font-size: 1.3rem;
      font-weight: 700;
      color: #333;
      line-height: 1.3;
    }

    .trip-budget {
      text-align: right;
    }

    .budget-amount {
      font-size: 1.1rem;
      font-weight: 700;
      color: #28a745;
    }

    .trip-destination {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #666;
      margin-bottom: 1rem;
      font-size: 0.9rem;
    }

    .trip-description {
      color: #666;
      line-height: 1.5;
      margin-bottom: 1rem;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .trip-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .tag {
      padding: 0.25rem 0.75rem;
      background: #e9ecef;
      color: #495057;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .more-tags {
      padding: 0.25rem 0.75rem;
      background: #007bff;
      color: white;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .trip-stats {
      display: flex;
      justify-content: space-between;
      margin-bottom: 1.5rem;
      padding: 1rem 0;
      border-top: 1px solid #e9ecef;
      border-bottom: 1px solid #e9ecef;
    }

    .stat {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #666;
      font-size: 0.9rem;
    }

    .trip-actions {
      display: flex;
      gap: 0.75rem;
    }

    .action-btn {
      flex: 1;
      padding: 0.75rem 1rem;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .action-btn.primary {
      background: #007bff;
      color: white;
    }

    .action-btn.primary:hover {
      background: #0056b3;
    }

    .action-btn.secondary {
      background: #28a745;
      color: white;
    }

    .action-btn.secondary:hover {
      background: #218838;
    }

    .action-btn.danger {
      background: #dc3545;
      color: white;
    }

    .action-btn.danger:hover {
      background: #c82333;
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      color: #666;
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      margin-top: 2rem;
    }

    .pagination-btn {
      padding: 0.75rem 1.5rem;
      border: 2px solid #e9ecef;
      background: white;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .pagination-btn:hover:not(:disabled) {
      border-color: #007bff;
      color: #007bff;
    }

    .pagination-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .page-numbers {
      display: flex;
      gap: 0.5rem;
    }

    .page-btn {
      padding: 0.75rem 1rem;
      border: 2px solid #e9ecef;
      background: white;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .page-btn:hover {
      border-color: #007bff;
      color: #007bff;
    }

    .page-btn.active {
      background: #007bff;
      color: white;
      border-color: #007bff;
    }

    @media (max-width: 768px) {
      .trip-list-container {
        padding: 1rem;
      }

      .trip-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }

      .search-input-group {
        flex-direction: column;
      }

      .search-input, .status-select, .destination-select {
        flex: none;
        width: 100%;
      }

      .trips-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .trip-actions {
        flex-direction: column;
      }
    }
  `]
})
export class TripListComponent implements OnInit, OnDestroy {
  trips: Trip[] = [];
  loading = false;
  error: string | null = null;
  isAuthenticated = false;
  currentUser: any = null;

  // Pagination
  currentPage = 0;
  pageSize = 12;
  totalPages = 0;
  totalElements = 0;

  // Search form
  searchForm: FormGroup;

  constructor(
    private tripService: TripService,
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.searchForm = this.fb.group({
      search: [''],
      status: [''],
      destination: ['']
    });
  }

  ngOnInit(): void {
    this.checkAuthentication();
    this.loadTrips();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  private checkAuthentication(): void {
    this.authService.isAuthenticated$.subscribe(isAuth => {
      this.isAuthenticated = isAuth;
    });

    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  loadTrips(): void {
    this.loading = true;
    this.error = null;

    const searchValue = this.searchForm.get('search')?.value || '';
    const statusValue = this.searchForm.get('status')?.value || '';
    const destinationValue = this.searchForm.get('destination')?.value || '';

    this.tripService.getTrips(
      this.currentPage, 
      this.pageSize, 
      searchValue || undefined,
      statusValue || undefined,
      destinationValue || undefined
    ).subscribe({
      next: (response) => {
        // Ensure we have an array for NgFor
        if (Array.isArray(response.data)) {
          this.trips = response.data;
        } else if (response.data && typeof response.data === 'object' && 'content' in response.data && Array.isArray((response.data as any).content)) {
          // Handle case where data is wrapped in a content property
          this.trips = (response.data as any).content;
        } else {
          console.warn('Unexpected response format:', response);
          this.trips = [];
        }
        
        this.totalPages = response.pagination?.totalPages || 0;
        this.totalElements = response.pagination?.totalElements || 0;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading trips:', error);
        this.error = 'Failed to load trips. Please try again.';
        this.loading = false;
        this.toastService.error('Failed to load trips', '');
      }
    });
  }

  onSearch(): void {
    this.currentPage = 0;
    this.loadTrips();
  }

  clearFilters(): void {
    this.searchForm.reset();
    this.currentPage = 0;
    this.loadTrips();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadTrips();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const start = Math.max(0, this.currentPage - 2);
    const end = Math.min(this.totalPages - 1, this.currentPage + 2);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  viewTripDetails(tripId: string): void {
    this.router.navigate(['/trips', tripId]);
  }

  createNewTrip(): void {
    if (!this.isAuthenticated) {
      this.router.navigate(['/signin'], {
        queryParams: { returnUrl: '/trips/create' }
      });
      return;
    }
    this.router.navigate(['/trips/create']);
  }

  joinTrip(trip: Trip): void {
    if (!this.isAuthenticated) {
      this.router.navigate(['/signin'], {
        queryParams: { returnUrl: this.router.url }
      });
      return;
    }

    this.tripService.acceptTripInvitation(trip.id).subscribe({
      next: () => {
        this.toastService.success('Successfully joined the trip!', '');
        this.loadTrips();
      },
      error: (error) => {
        console.error('Error joining trip:', error);
        this.toastService.error('Failed to join trip', '');
      }
    });
  }

  leaveTrip(trip: Trip): void {
    if (!this.isAuthenticated) return;

    if (confirm('Are you sure you want to leave this trip?')) {
      // Implementation would depend on backend API
      this.toastService.info('Leave trip functionality coming soon!', '');
    }
  }

  canJoinTrip(trip: Trip): boolean {
    if (!this.isAuthenticated) return false;
    return !this.isParticipant(trip) && trip.status === 'PLANNING';
  }

  isParticipant(trip: Trip): boolean {
    if (!this.currentUser || !trip.participants) return false;
    return trip.participants.some(p => p.userId === this.currentUser.id);
  }

  getTripImage(trip: Trip): string {
    if (trip.photos && trip.photos.length > 0) {
      return trip.photos[0].url;
    }
    return `https://placehold.co/400x200/007bff/ffffff?text=${encodeURIComponent(trip.destination)}`;
  }

  handleImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.src = 'https://placehold.co/400x200/cccccc/666666?text=Image+Not+Available';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'PLANNING': 'Planning',
      'CONFIRMED': 'Confirmed',
      'IN_PROGRESS': 'In Progress',
      'COMPLETED': 'Completed',
      'CANCELLED': 'Cancelled'
    };
    return statusMap[status] || status;
  }

  getStatusClass(status: string): string {
    return status.toLowerCase().replace('_', '-');
  }
}
