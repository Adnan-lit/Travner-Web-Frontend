import { Component, inject, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../services/auth.service';
import { UpdateProfileRequest, User } from '../../../models/common.model';
import { ApiResponse } from '../../../models/api-response.model';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css'],
})
export class UserProfileComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);

  readonly profileForm = this.formBuilder.group({
    firstName: ['', [Validators.maxLength(80)]],
    lastName: ['', [Validators.maxLength(80)]],
    email: ['', [Validators.email]],
    bio: ['', [Validators.maxLength(500)]],
    location: ['', [Validators.maxLength(120)]],
  });

  user: User | null = null;
  saving = false;
  errorMessage = '';
  successMessage = '';

  private readonly destroyRef = inject(DestroyRef);

  constructor(private readonly authService: AuthService) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    this.patchForm(this.user);
    this.authService.currentUser$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((user) => {
      this.user = user;
      this.patchForm(user);
    });
  }

  saveProfile(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.profileForm.invalid) {
      this.errorMessage = 'Please check the highlighted fields and try again.';
      this.profileForm.markAllAsTouched();
      return;
    }

    const values = this.profileForm.getRawValue();
    const payload: UpdateProfileRequest = {
      firstName: values.firstName?.trim() || undefined,
      lastName: values.lastName?.trim() || undefined,
      email: values.email?.trim() || undefined,
      bio: values.bio?.trim() || undefined,
      location: values.location?.trim() || undefined,
    };

    this.saving = true;
    this.authService
      .updateProfile(payload)
      .pipe(
        finalize(() => {
          this.saving = false;
        }),
      )
      .subscribe({
        next: (response: ApiResponse<User>) => {
          this.user = response.data ?? this.user;
          this.patchForm(this.user);
          this.successMessage = 'Profile updated.';
        },
        error: () => {
          this.errorMessage = 'Could not update your profile. Please try again.';
        },
      });
  }

  private patchForm(user: User | null): void {
    this.profileForm.patchValue({
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      email: user?.email ?? '',
      bio: user?.bio ?? '',
      location: user?.location ?? '',
    });
  }
}
