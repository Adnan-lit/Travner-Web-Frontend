import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ItineraryService } from '../../../services/itinerary.service';
import { Itinerary } from '../../../models/location.model';

@Component({
  selector: 'app-itinerary-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './itinerary-detail.component.html',
  styleUrls: ['./itinerary-detail.component.css']
})
export class ItineraryDetailComponent implements OnInit {
  itinerary: Itinerary | null = null;
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private itineraryService: ItineraryService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadItinerary(id);
    }
  }

  loadItinerary(id: string): void {
    this.loading = true;
    this.itineraryService.getItinerary(id).subscribe({
      next: (response) => {
        this.itinerary = response.data || null;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load itinerary.';
        this.loading = false;
        console.error('Error loading itinerary:', err);
      }
    });
  }

  retryLoad(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.error = null;
      this.loadItinerary(id);
    }
  }
}
