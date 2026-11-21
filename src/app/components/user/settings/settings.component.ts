import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/common.model';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
})
export class SettingsComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);

  readonly passwordForm = this.formBuilder.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required],
  });

  currentUser: User | null = null;
  saving = false;
  errorMessage = '';
  successMessage = '';

  constructor(private readonly authService: AuthService) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
  }

  get rolesLabel(): string {
    return this.currentUser?.roles?.length ? this.currentUser.roles.join(', ') : 'Not available';
  }

  changePassword(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.passwordForm.invalid) {
      this.errorMessage = 'Please complete all password fields. New passwords need at least 6 characters.';
      this.passwordForm.markAllAsTouched();
      return;
    }

    const values = this.passwordForm.getRawValue();
    if (values.newPassword !== values.confirmPassword) {
      this.errorMessage = 'The new passwords do not match.';
      return;
    }

    const currentPassword = values.currentPassword ?? '';
    const newPassword = values.newPassword ?? '';
    this.saving = true;
    this.authService
      .changePassword(currentPassword, newPassword)
      .pipe(
        finalize(() => {
          this.saving = false;
        }),
      )
      .subscribe({
        next: () => {
          this.passwordForm.reset();
          this.successMessage = 'Password changed.';
        },
        error: () => {
          this.errorMessage = 'Could not change your password. Please try again.';
        },
      });
  }

  signOut(): void {
    this.authService.logout();
  }
}
