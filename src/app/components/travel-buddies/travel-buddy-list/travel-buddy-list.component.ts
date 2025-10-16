import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TravelBuddyService } from '../../../services/travel-buddy.service';
import { TravelBuddy, TravelBuddySearchParams } from '../../../models/location.model';

@Component({
  selector: 'app-travel-buddy-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './travel-buddy-list.component.html',
  styleUrls: ['./travel-buddy-list.component.css']
})
export class TravelBuddyListComponent implements OnInit {
  travelBuddies: TravelBuddy[] = [];
  loading = false;
  error: string | null = null;
  
  // Search and filter parameters
  searchParams: TravelBuddySearchParams = {
    page: 0,
    size: 10,
    sortBy: 'createdAt',
    direction: 'desc',
    status: 'active'
  };
  
  // Filter options
  destinations: string[] = [];
  selectedDestination = '';
  selectedInterests: string[] = [];
  ageRange = { min: 18, max: 65 };
  preferredGender = '';
  
  // Pagination
  currentPage = 0;
  totalPages = 0;
  totalElements = 0;

  constructor(
    private travelBuddyService: TravelBuddyService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTravelBuddies();
  }

  loadTravelBuddies(): void {
    this.loading = true;
    this.error = null;
    
    const params = {
      ...this.searchParams,
      page: this.currentPage,
      destination: this.selectedDestination || undefined,
      interests: this.selectedInterests.length > 0 ? this.selectedInterests : undefined,
      minAge: this.ageRange.min,
      maxAge: this.ageRange.max,
      preferredGender: this.preferredGender || undefined
    };

    this.travelBuddyService.getTravelBuddies(params).subscribe({
      next: (response) => {
        this.travelBuddies = response.data || [];
        this.totalPages = response.pagination?.totalPages || 0;
        this.totalElements = response.pagination?.totalElements || 0;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load travel buddies';
        this.loading = false;
        console.error('Error loading travel buddies:', error);
      }
    });
  }

  onSearch(): void {
    this.currentPage = 0;
    this.loadTravelBuddies();
  }

  onFilterChange(): void {
    this.currentPage = 0;
    this.loadTravelBuddies();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadTravelBuddies();
  }

  viewTravelBuddy(id: string): void {
    this.router.navigate(['/travel-buddies', id]);
  }

  createTravelBuddy(): void {
    this.router.navigate(['/travel-buddies/create']);
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

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  getDuration(startDate: string, endDate: string): string {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} days`;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'active': return 'status-active';
      case 'matched': return 'status-matched';
      case 'expired': return 'status-expired';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-default';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'active': return 'Looking for buddies';
      case 'matched': return 'Matched';
      case 'expired': return 'Expired';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  }
}
