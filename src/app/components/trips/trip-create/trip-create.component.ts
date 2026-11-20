import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CreateTripRequest, Trip, TripService } from '../../../services/trip.service';

interface TripCreateFormValue {
  title: string;
  description: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: string | null;
  currency: string;
  visibility: CreateTripRequest['visibility'];
  tags: string;
}

type TripCreateForm = {
  [K in keyof TripCreateFormValue]: FormControl<TripCreateFormValue[K]>;
};

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
  selector: 'app-trip-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './trip-create.component.html',
  styleUrls: ['./trip-create.component.css']
})
export class TripCreateComponent {
  readonly tripForm: FormGroup<TripCreateForm>;

  submitting = false;
  formSubmitted = false;
  createdTrip: Trip | null = null;
  errorMessage = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly tripService: TripService,
    private readonly router: Router
  ) {
    this.tripForm = this.fb.group<TripCreateForm>({
      title: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(200)] }),
      description: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(2000)] }),
      destination: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(200)] }),
      startDate: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      endDate: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      budget: new FormControl<string | null>(null, [Validators.min(0)]),
      currency: new FormControl('USD', { nonNullable: true, validators: [Validators.required, Validators.maxLength(10)] }),
      visibility: new FormControl<CreateTripRequest['visibility']>('PRIVATE', {
        nonNullable: true,
        validators: [Validators.required]
      }),
      tags: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(500)] })
    }, { validators: [dateRangeValidator] });
  }

  isInvalid(field: keyof TripCreateForm): boolean {
    const control = this.tripForm.controls[field];
    return control.invalid && (control.touched || this.formSubmitted);
  }

  onSubmit(): void {
    this.formSubmitted = true;

    if (this.submitting) {
      return;
    }

    if (this.tripForm.invalid) {
      this.tripForm.markAllAsTouched();
      return;
    }

    const payload = this.buildPayload();
    this.submitting = true;
    this.errorMessage = '';
    this.createdTrip = null;

    this.tripService.createTrip(payload).subscribe({
      next: response => {
        this.submitting = false;
        const trip = response?.data;

        if (!response?.success || !trip?.id) {
          this.errorMessage = 'Your trip was submitted, but its link is unavailable. Please check your trips list.';
          return;
        }

        this.createdTrip = trip;
        void this.router.navigate(['/trips', trip.id]);
      },
      error: () => {
        this.submitting = false;
        this.errorMessage = 'We could not create your trip. Please check your details and try again.';
      }
    });
  }

  private buildPayload(): CreateTripRequest {
    const raw = this.tripForm.getRawValue();
    const budgetValue = raw.budget !== null ? raw.budget.trim() : '';
    const tags = this.parseTags(raw.tags);

    const payload: CreateTripRequest = {
      title: raw.title.trim(),
      description: raw.description.trim(),
      destination: raw.destination.trim(),
      startDate: raw.startDate,
      endDate: raw.endDate,
      currency: raw.currency.trim().toUpperCase(),
      visibility: raw.visibility
    };

    if (budgetValue !== '' && Number.isFinite(Number(budgetValue))) {
      payload.budget = Number(budgetValue);
    }

    if (tags.length > 0) {
      payload.tags = tags;
    }

    return payload;
  }

  private parseTags(raw: string): string[] {
    return raw
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
  }
}
