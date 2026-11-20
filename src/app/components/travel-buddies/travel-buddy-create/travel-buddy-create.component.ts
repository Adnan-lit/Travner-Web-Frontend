import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TravelBuddyService } from '../../../services/travel-buddy.service';
import { TravelBuddyCreate } from '../../../models/location.model';

function dateRangeValidator(group: AbstractControl): ValidationErrors | null {
  const startDate = group.get('startDate')?.value;
  const endDate = group.get('endDate')?.value;
  if (
    typeof startDate === 'string' &&
    typeof endDate === 'string' &&
    startDate.length > 0 &&
    endDate.length > 0 &&
    endDate < startDate
  ) {
    return { dateRange: true };
  }
  return null;
}

@Component({
  selector: 'app-travel-buddy-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './travel-buddy-create.component.html',
  styleUrls: ['./travel-buddy-create.component.css']
})
export class TravelBuddyCreateComponent {
  private readonly failureMessage = 'Could not create your travel buddy request. Please try again.';

  readonly form = new FormGroup(
    {
      destination: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(200)]
      }),
      startDate: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      endDate: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      interests: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      expiryDays: new FormControl(30, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(1), Validators.max(365)]
      }),
      minAge: new FormControl<number | null>(null, [Validators.min(18), Validators.max(100)]),
      maxAge: new FormControl<number | null>(null, [Validators.min(18), Validators.max(100)]),
      preferredGender: new FormControl('', { nonNullable: true }),
      budgetRange: new FormControl('', {
        nonNullable: true,
        validators: [Validators.maxLength(100)]
      })
    },
    { validators: [dateRangeValidator] }
  );

  submitting = false;
  error: string | null = null;

  constructor(
    private readonly travelBuddyService: TravelBuddyService,
    private readonly router: Router
  ) {}

  onSubmit(): void {
    if (this.submitting) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.error = null;
    this.submitting = true;

    const raw = this.form.getRawValue();
    const payload: TravelBuddyCreate = {
      destination: raw.destination.trim(),
      startDate: raw.startDate,
      endDate: raw.endDate,
      interests: raw.interests
        .split(',')
        .map((interest) => interest.trim())
        .filter((interest) => interest.length > 0),
      expiryDays: raw.expiryDays
    };

    if (raw.minAge !== null) {
      payload.minAge = raw.minAge;
    }
    if (raw.maxAge !== null) {
      payload.maxAge = raw.maxAge;
    }
    if (raw.preferredGender) {
      payload.preferredGender = raw.preferredGender;
    }
    if (raw.budgetRange.trim()) {
      payload.budgetRange = raw.budgetRange.trim();
    }

    this.travelBuddyService.createTravelBuddy(payload).subscribe({
      next: (response) => {
        this.submitting = false;
        const id = response?.data?.id;
        if (!id) {
          this.error = this.failureMessage;
          return;
        }
        this.router.navigate(['/travel-buddies', id]);
      },
      error: () => {
        this.submitting = false;
        this.error = this.failureMessage;
      }
    });
  }
}
