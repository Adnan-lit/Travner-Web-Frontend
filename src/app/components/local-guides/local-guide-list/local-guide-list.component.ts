import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LocalGuideService } from '../../../services/local-guide.service';
import { LocalGuide, LocalGuideSearchParams } from '../../../models/location.model';

@Component({
  selector: 'app-local-guide-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './local-guide-list.component.html',
  styleUrls: ['./local-guide-list.component.css']
})
export class LocalGuideListComponent implements OnInit {
  localGuides: LocalGuide[] = [];
  loading = false;
  error: string | null = null;
  
  // Search and filter parameters
  searchParams: LocalGuideSearchParams = {
    page: 0,
    size: 10,
    sortBy: 'rating',
    direction: 'desc',
    isAvailable: true
  };
  
  // Filter options
  locations: string[] = [];
  selectedLocation = '';
  selectedLanguages: string[] = [];
  selectedSpecialties: string[] = [];
  priceRange = { min: 0, max: 1000 };
  ratingRange = { min: 0, max: 5 };
  
  // Pagination
  currentPage = 0;
  totalPages = 0;
  totalElements = 0;

  constructor(
    private localGuideService: LocalGuideService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadLocalGuides();
  }

  loadLocalGuides(): void {
    this.loading = true;
    this.error = null;
    
    const params = {
      ...this.searchParams,
      page: this.currentPage,
      location: this.selectedLocation || undefined,
      languages: this.selectedLanguages.length > 0 ? this.selectedLanguages : undefined,
      specialties: this.selectedSpecialties.length > 0 ? this.selectedSpecialties : undefined,
      minPrice: this.priceRange.min,
      maxPrice: this.priceRange.max,
      minRating: this.ratingRange.min,
      maxRating: this.ratingRange.max
    };

    this.localGuideService.getLocalGuides(params).subscribe({
      next: (response) => {
        this.localGuides = response.data || [];
        this.totalPages = response.pagination?.totalPages || 0;
        this.totalElements = response.pagination?.totalElements || 0;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load local guides';
        this.loading = false;
        console.error('Error loading local guides:', error);
      }
    });
  }

  onSearch(): void {
    this.currentPage = 0;
    this.loadLocalGuides();
  }

  onFilterChange(): void {
    this.currentPage = 0;
    this.loadLocalGuides();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadLocalGuides();
  }

  viewLocalGuide(id: string): void {
    this.router.navigate(['/local-guides', id]);
  }

  createLocalGuide(): void {
    this.router.navigate(['/local-guides/create']);
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

  formatPrice(price: number, currency: string): string {
    return `${currency} ${price.toFixed(2)}/hour`;
  }

  getRatingStars(rating: number): string[] {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push('full');
    }
    
    if (hasHalfStar) {
      stars.push('half');
    }
    
    while (stars.length < 5) {
      stars.push('empty');
    }
    
    return stars;
  }

  getAvailabilityClass(isAvailable: boolean): string {
    return isAvailable ? 'available' : 'unavailable';
  }

  getAvailabilityText(isAvailable: boolean): string {
    return isAvailable ? 'Available' : 'Unavailable';
  }
}
