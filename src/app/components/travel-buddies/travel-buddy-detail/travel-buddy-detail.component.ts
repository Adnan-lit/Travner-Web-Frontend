import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TravelBuddyService } from '../../../services/travel-buddy.service';
import { TravelBuddy } from '../../../models/location.model';

/** The current list model has no description field, but older records may carry one. */
type TravelBuddyDetail = TravelBuddy & { description?: string };

@Component({
  selector: 'app-travel-buddy-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './travel-buddy-detail.component.html',
  styleUrls: ['./travel-buddy-detail.component.css'],
})
export class TravelBuddyDetailComponent implements OnInit {
  private readonly loadErrorMessage = 'Unable to load this travel buddy request. Please try again.';

  readonly statusLabels: Record<TravelBuddy['status'], string> = {
    active: 'Active',
    matched: 'Matched',
    expired: 'Expired',
    cancelled: 'Cancelled',
  };

  travelBuddy: TravelBuddyDetail | null = null;
  loading = true;
  error: string | null = null;
  notFound = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly travelBuddyService: TravelBuddyService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading = false;
      this.notFound = true;
      return;
    }
    this.load(id);
  }

  get requesterName(): string {
    const author = this.travelBuddy?.author;
    const fullName = [author?.firstName, author?.lastName].filter((part) => !!part?.trim()).join(' ');
    return fullName || author?.userName || 'Traveller';
  }

  formatDate(value?: string): string {
    if (!value) {
      return '—';
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
  }

  retry(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.load(id);
    }
  }

  private load(id: string): void {
    this.loading = true;
    this.error = null;
    this.notFound = false;
    this.travelBuddy = null;

    this.travelBuddyService.getTravelBuddy(id).subscribe({
      next: (response) => {
        this.loading = false;
        if (response?.data) {
          this.travelBuddy = response.data;
        } else {
          this.notFound = true;
        }
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        if (err?.status === 404) {
          this.notFound = true;
          return;
        }
        this.error = this.loadErrorMessage;
      },
    });
  }
}
