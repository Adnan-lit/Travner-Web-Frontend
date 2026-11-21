import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Trip, TripService } from '../../../services/trip.service';

type TripDetailState = 'loading' | 'ready' | 'error' | 'not-found' | 'missing-id';

@Component({
  selector: 'app-trip-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './trip-detail.component.html',
  styleUrls: ['./trip-detail.component.css'],
})
export class TripDetailComponent implements OnInit {
  state: TripDetailState = 'loading';
  trip: Trip | null = null;
  errorMessage = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly tripService: TripService,
  ) {}

  ngOnInit(): void {
    const tripId = this.route.snapshot.paramMap.get('id')?.trim();

    if (!tripId) {
      this.state = 'missing-id';
      return;
    }

    this.state = 'loading';
    this.trip = null;
    this.errorMessage = '';

    this.tripService.getTripById(tripId).subscribe({
      next: (response) => {
        if (!response?.success || !response?.data) {
          this.state = 'not-found';
          this.errorMessage = 'Trip not found.';
          return;
        }

        this.trip = response.data;
        this.state = 'ready';
      },
      error: (error: unknown) => {
        if (this.isNotFound(error)) {
          this.state = 'not-found';
          this.errorMessage = 'Trip not found.';
          return;
        }

        this.state = 'error';
        this.errorMessage = 'We could not load this trip. Please try again later.';
      },
    });
  }

  private isNotFound(error: unknown): boolean {
    if (typeof error !== 'object' || error === null || !('status' in error)) {
      return false;
    }

    return (error as { status?: unknown }).status === 404;
  }
}
