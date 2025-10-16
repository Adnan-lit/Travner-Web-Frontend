import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ItineraryService } from '../../../services/itinerary.service';
import { ItineraryCreate } from '../../../models/location.model';

@Component({
  selector: 'app-itinerary-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './itinerary-create.component.html',
  styleUrls: ['./itinerary-create.component.css']
})
export class ItineraryCreateComponent implements OnInit {
  itinerary: ItineraryCreate = {
    title: '',
    description: '',
    destination: '',
    destinationCountry: 'Bangladesh', // Fixed to Bangladesh
    destinationCity: '',
    startDate: '',
    endDate: '',
    items: [],
    tags: [],
    isPublic: true,
    isTemplate: false,
    estimatedBudget: 0,
    currency: 'BDT' // Fixed to BDT
  };

  loading = false;
  error: string | null = null;
  tagInput = '';

  constructor(
    private itineraryService: ItineraryService,
    public router: Router
  ) { }

  ngOnInit(): void {
    console.log('🧳 ItineraryCreateComponent ngOnInit called');
    console.log('🧳 Component data:', this.itinerary);
    console.log('🧳 Loading state:', this.loading);
    console.log('🧳 Error state:', this.error);
  }

  onSubmit(): void {
    this.loading = true;
    this.error = null;

    // Convert date strings to LocalDateTime format for backend
    const itineraryData = {
      ...this.itinerary,
      startDate: this.itinerary.startDate ? `${this.itinerary.startDate}T00:00:00` : '',
      endDate: this.itinerary.endDate ? `${this.itinerary.endDate}T23:59:59` : '',
      items: this.itinerary.items.map(item => ({
        ...item,
        startTime: item.startTime ? `${this.itinerary.startDate}T${item.startTime}:00` : '',
        endTime: item.endTime ? `${this.itinerary.startDate}T${item.endTime}:00` : ''
      }))
    };

    console.log('🧳 Creating itinerary with data:', itineraryData);

    this.itineraryService.createItinerary(itineraryData).subscribe({
      next: (response) => {
        console.log('✅ Itinerary created successfully:', response);
        this.loading = false;
        this.router.navigate(['/itineraries']);
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Failed to create itinerary. Please try again.';
        console.error('❌ Error creating itinerary:', err);
      }
    });
  }

  addItem(): void {
    this.itinerary.items.push({
      title: '',
      description: '',
      location: '',
      startTime: '',
      endTime: '',
      category: 'activity',
      notes: '',
      estimatedCost: 0,
      currency: 'BDT'
    });
  }

  removeItem(index: number): void {
    this.itinerary.items.splice(index, 1);
  }

  addTag(): void {
    if (this.tagInput.trim()) {
      const tags = this.tagInput.split(',').map(tag => tag.trim()).filter(tag => tag);
      this.itinerary.tags.push(...tags);
      this.tagInput = '';
    }
  }

  removeTag(index: number): void {
    this.itinerary.tags.splice(index, 1);
  }


  onCancel(): void {
    this.router.navigate(['/itineraries']);
  }
}
