import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ItineraryService } from '../../../services/itinerary.service';
import { Itinerary, ItinerarySearchParams } from '../../../models/location.model';

@Component({
  selector: 'app-itinerary-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './itinerary-list.component.html',
  styleUrls: ['./itinerary-list.component.css']
})
export class ItineraryListComponent implements OnInit {
  itineraries: Itinerary[] = [];
  loading = false;
  error: string | null = null;
  
  // Search and filter parameters
  searchParams: ItinerarySearchParams = {
    page: 0,
    size: 10,
    sortBy: 'createdAt',
    direction: 'desc'
  };
  
  // Filter options
  destinations: string[] = [];
  selectedDestination = '';
  selectedTags: string[] = [];
  showPublicOnly = true;
  showTemplatesOnly = false;
  
  // Pagination
  currentPage = 0;
  totalPages = 0;
  totalElements = 0;

  constructor(
    private itineraryService: ItineraryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadItineraries();
  }

  loadItineraries(): void {
    this.loading = true;
    this.error = null;
    
    const params = {
      ...this.searchParams,
      page: this.currentPage,
      destination: this.selectedDestination || undefined,
      tags: this.selectedTags.length > 0 ? this.selectedTags : undefined,
      isPublic: this.showPublicOnly ? true : undefined,
      isTemplate: this.showTemplatesOnly ? true : undefined
    };

    console.log('🧳 Loading itineraries with params:', params);

    this.itineraryService.getItineraries(params).subscribe({
      next: (response) => {
        console.log('✅ Itineraries response:', response);
        this.itineraries = response.data || [];
        this.totalPages = response.pagination?.totalPages || 0;
        this.totalElements = response.pagination?.totalElements || 0;
        this.loading = false;
        console.log('📊 Loaded', this.itineraries.length, 'itineraries');
      },
      error: (error) => {
        this.error = 'Failed to load itineraries';
        this.loading = false;
        console.error('❌ Error loading itineraries:', error);
      }
    });
  }

  onSearch(): void {
    this.currentPage = 0;
    this.loadItineraries();
  }

  onFilterChange(): void {
    this.currentPage = 0;
    this.loadItineraries();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadItineraries();
  }

  viewItinerary(id: string): void {
    this.router.navigate(['/itineraries', id]);
  }

  createItinerary(): void {
    this.router.navigate(['/itineraries/create']);
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
}
