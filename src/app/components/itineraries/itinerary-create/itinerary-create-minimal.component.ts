import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ItineraryService } from '../../../services/itinerary.service';
import { ItineraryCreate } from '../../../models/location.model';

@Component({
  selector: 'app-itinerary-create-minimal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./itinerary-create.component.css'],
  template: `
    <div class="modern-create-container">
      <div class="create-wrapper">
        <!-- Compact Header -->
        <div class="create-header">
          <div class="header-content">
            <div class="header-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
              </svg>
            </div>
            <div class="header-text">
              <h1 class="create-title">Create Amazing Itinerary</h1>
              <p class="create-subtitle">Plan your perfect travel experience and share it with the world</p>
            </div>
            <div class="header-badges">
              <span class="badge primary">🇧🇩 Bangladesh Focused</span>
              <span class="badge secondary">💰 BDT Currency</span>
            </div>
          </div>
        </div>

        <form (ngSubmit)="onSubmit()" #itineraryForm="ngForm" class="create-form">
          <!-- Basic Information Card -->
          <div class="form-card">
            <div class="card-header">
              <div class="card-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div class="card-title-section">
                <h2 class="card-title">Basic Information</h2>
                <p class="card-subtitle">Fill in the essential details</p>
              </div>
            </div>

            <!-- Title -->
            <div class="form-group full-width">
              <label for="title" class="form-label">
                <span class="required">*</span> Itinerary Title
              </label>
              <input 
                type="text" 
                id="title"
                name="title" 
                [(ngModel)]="itinerary.title" 
                required 
                class="form-input"
                placeholder="e.g., Dhaka City Explorer - 3 Days">
            </div>

            <div class="form-grid">
              <!-- Destination -->
              <div class="form-group">
                <label for="destination" class="form-label">
                  <span class="required">*</span> Destination
                </label>
                <input 
                  type="text" 
                  id="destination"
                  name="destination" 
                  [(ngModel)]="itinerary.destination" 
                  required 
                  class="form-input"
                  placeholder="e.g., Dhaka, Cox's Bazar, Sylhet">
              </div>

              <!-- City -->
              <div class="form-group">
                <label for="destinationCity" class="form-label">
                  <span class="required">*</span> City
                </label>
                <input 
                  type="text" 
                  id="destinationCity"
                  name="destinationCity" 
                  [(ngModel)]="itinerary.destinationCity" 
                  required 
                  class="form-input"
                  placeholder="e.g., Dhaka, Chittagong, Sylhet">
              </div>

              <!-- Country (Fixed to Bangladesh) -->
              <div class="form-group">
                <label for="destinationCountry" class="form-label">Country</label>
                <input 
                  type="text" 
                  id="destinationCountry"
                  name="destinationCountry" 
                  [(ngModel)]="itinerary.destinationCountry" 
                  value="Bangladesh"
                  readonly
                  class="form-input readonly">
              </div>

              <!-- Currency (Fixed to BDT) -->
              <div class="form-group">
                <label for="currency" class="form-label">Currency</label>
                <input 
                  type="text" 
                  id="currency"
                  name="currency" 
                  [(ngModel)]="itinerary.currency" 
                  value="BDT"
                  readonly
                  class="form-input readonly">
              </div>

              <!-- Start Date -->
              <div class="form-group">
                <label for="startDate" class="form-label">
                  <span class="required">*</span> Start Date
                </label>
                <input 
                  type="date" 
                  id="startDate"
                  name="startDate" 
                  [(ngModel)]="itinerary.startDate" 
                  required 
                  class="form-input">
              </div>

              <!-- End Date -->
              <div class="form-group">
                <label for="endDate" class="form-label">
                  <span class="required">*</span> End Date
                </label>
                <input 
                  type="date" 
                  id="endDate"
                  name="endDate" 
                  [(ngModel)]="itinerary.endDate" 
                  required 
                  class="form-input">
              </div>

              <!-- Estimated Budget -->
              <div class="form-group">
                <label for="estimatedBudget" class="form-label">Estimated Budget (BDT)</label>
                <div class="budget-input-wrapper">
                  <span class="budget-symbol">৳</span>
                  <input 
                    type="number" 
                    id="estimatedBudget"
                    name="estimatedBudget" 
                    [(ngModel)]="itinerary.estimatedBudget" 
                    min="0" 
                    step="100"
                    class="form-input budget-input"
                    placeholder="15000">
                </div>
              </div>
            </div>

            <!-- Description -->
            <div class="form-group full-width">
              <label for="description" class="form-label">
                <span class="required">*</span> Description
              </label>
              <textarea 
                id="description"
                name="description" 
                [(ngModel)]="itinerary.description" 
                required 
                rows="4"
                class="form-textarea"
                placeholder="Describe your itinerary, what makes it special, and what travelers can expect..."></textarea>
            </div>
          </div>

          <!-- Tags and Settings Card -->
          <div class="form-card">
            <div class="card-header">
              <div class="card-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                </svg>
              </div>
              <div class="card-title-section">
                <h2 class="card-title">Tags & Settings</h2>
                <p class="card-subtitle">Add tags and configure visibility</p>
              </div>
            </div>
            
            <div class="form-grid">
              <!-- Tags -->
              <div class="form-group">
                <label class="form-label">Tags (comma-separated)</label>
                <input 
                  type="text" 
                  [(ngModel)]="tagInput" 
                  [ngModelOptions]="{standalone: true}"
                  (keyup.enter)="addTag()"
                  class="form-input"
                  placeholder="e.g., bangladesh, dhaka, culture, adventure">
                <div class="tags-container" *ngIf="itinerary.tags.length > 0">
                  <span *ngFor="let tag of itinerary.tags; let i = index" class="tag-item">
                    {{ tag }}
                    <button type="button" (click)="removeTag(i)" class="tag-remove">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  </span>
                </div>
              </div>

              <!-- Settings -->
              <div class="form-group">
                <div class="settings-group">
                  <div class="checkbox-item">
                    <input 
                      type="checkbox" 
                      id="isPublic" 
                      [(ngModel)]="itinerary.isPublic" 
                      [ngModelOptions]="{standalone: true}"
                      class="modern-checkbox">
                    <label for="isPublic" class="checkbox-label">
                      Make this itinerary public
                    </label>
                  </div>
                  
                  <div class="checkbox-item">
                    <input 
                      type="checkbox" 
                      id="isTemplate" 
                      [(ngModel)]="itinerary.isTemplate" 
                      [ngModelOptions]="{standalone: true}"
                      class="modern-checkbox">
                    <label for="isTemplate" class="checkbox-label">
                      Use as template for others
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Submit Section -->
          <div class="form-card submit-card">
            <div class="submit-content">
              <div class="submit-info">
                <h2>Ready to Create?</h2>
                <p>Review your itinerary and create it for others to discover</p>
              </div>
              <div class="submit-actions">
                <button 
                  type="button" 
                  (click)="router.navigate(['/itineraries'])" 
                  class="modern-btn secondary">
                  Cancel
                </button>
                <button 
                  type="submit" 
                  [disabled]="loading || !itineraryForm.form.valid"
                  class="modern-btn primary">
                  <svg *ngIf="loading" class="btn-icon loading-spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {{ loading ? 'Creating...' : 'Create Itinerary' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Error Message -->
          <div *ngIf="error" class="error-message">
            <div class="error-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div class="error-content">
              <h3>Error</h3>
              <p>{{ error }}</p>
            </div>
          </div>
        </form>
      </div>
    </div>
  `
})
export class ItineraryCreateMinimalComponent implements OnInit {
  itinerary: ItineraryCreate = {
    title: '',
    description: '',
    destination: '',
    destinationCountry: 'Bangladesh',
    destinationCity: '',
    startDate: '',
    endDate: '',
    items: [],
    tags: [],
    isPublic: true,
    isTemplate: false,
    estimatedBudget: 0,
    currency: 'BDT'
  };

  loading = false;
  error: string | null = null;
  success: string | null = null;
  tagInput = '';

  constructor(
    private itineraryService: ItineraryService,
    public router: Router
  ) { }

  ngOnInit(): void {
    console.log('🧳 ItineraryCreateMinimalComponent ngOnInit called');
    console.log('🧳 Component data:', this.itinerary);
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

  onSubmit(): void {
    this.loading = true;
    this.error = null;
    this.success = null;

    // Convert date strings to LocalDateTime format for backend
    const itineraryData = {
      ...this.itinerary,
      startDate: this.itinerary.startDate ? `${this.itinerary.startDate}T00:00:00` : '',
      endDate: this.itinerary.endDate ? `${this.itinerary.endDate}T23:59:59` : '',
      // Ensure items array is properly formatted for backend
      items: this.itinerary.items || []
    };

    console.log('🧳 Creating itinerary with data:', itineraryData);

    this.itineraryService.createItinerary(itineraryData).subscribe({
      next: (response) => {
        console.log('✅ Itinerary created successfully:', response);
        this.loading = false;
        this.success = 'Itinerary created successfully! Redirecting...';
        
        // Navigate after a short delay to show success message
        setTimeout(() => {
          this.router.navigate(['/itineraries']);
        }, 1500);
      },
      error: (err) => {
        this.loading = false;
        console.error('❌ Error creating itinerary:', err);
        
        // Extract error message from response
        let errorMessage = 'Failed to create itinerary. Please try again.';
        if (err.error && err.error.message) {
          errorMessage = err.error.message;
        } else if (err.status === 500) {
          errorMessage = 'Server error. Please check your data and try again.';
        } else if (err.status === 400) {
          errorMessage = 'Invalid data. Please check all required fields.';
        }
        
        this.error = errorMessage;
      }
    });
  }
}