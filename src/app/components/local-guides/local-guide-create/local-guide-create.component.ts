import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { LocalGuideCreate } from '../../../models/location.model';
import { LocalGuideService } from '../../../services/local-guide.service';

const CREATE_ERROR = 'Could not create the local guide. Please try again.';

@Component({
  selector: 'app-local-guide-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './local-guide-create.component.html',
  styleUrls: ['./local-guide-create.component.css']
})
export class LocalGuideCreateComponent {
  readonly guideForm = new FormGroup({
    location: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(200)]
    }),
    bio: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(2000)]
    }),
    hourlyRate: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)]
    }),
    currency: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(3)]
    }),
    languages: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    specialties: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    availability: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(200)]
    }),
    contactMethod: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(100)]
    }),
    contactInfo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(200)]
    })
  });

  submitting = false;
  errorMessage: string | null = null;

  constructor(
    private readonly localGuideService: LocalGuideService,
    private readonly router: Router
  ) {}

  onSubmit(): void {
    this.errorMessage = null;

    if (this.submitting) {
      return;
    }

    if (this.guideForm.invalid) {
      this.guideForm.markAllAsTouched();
      return;
    }

    const payload = this.buildPayload();
    if (!payload) {
      this.errorMessage = 'Please complete every required field with a non-empty value.';
      return;
    }

    this.submitting = true;
    this.localGuideService.createLocalGuide(payload).pipe(
      finalize(() => { this.submitting = false; })
    ).subscribe({
      next: (response) => {
        const id = response.data?.id;
        if (!id) {
          this.errorMessage = CREATE_ERROR;
          return;
        }
        void this.router.navigate(['/local-guides', id]);
      },
      error: () => {
        this.errorMessage = CREATE_ERROR;
      }
    });
  }

  private buildPayload(): LocalGuideCreate | null {
    const value = this.guideForm.getRawValue();
    const location = value.location.trim();
    const bio = value.bio.trim();
    const currency = value.currency.trim();
    const languages = this.parseList(value.languages);
    const specialties = this.parseList(value.specialties);

    if (!location || !bio || !currency || !languages.length || !specialties.length ||
        !Number.isFinite(value.hourlyRate) || value.hourlyRate < 0) {
      return null;
    }

    const payload: LocalGuideCreate = {
      location,
      bio,
      hourlyRate: value.hourlyRate,
      currency,
      languages,
      specialties
    };

    const availability = value.availability.trim();
    const contactMethod = value.contactMethod.trim();
    const contactInfo = value.contactInfo.trim();

    if (availability) {
      payload.availability = availability;
    }
    if (contactMethod) {
      payload.contactMethod = contactMethod;
    }
    if (contactInfo) {
      payload.contactInfo = contactInfo;
    }

    return payload;
  }

  private parseList(value: string): string[] {
    return value.split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }
}
