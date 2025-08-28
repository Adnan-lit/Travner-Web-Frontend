// Admin Setup Utility
// This helps create the first admin user using the API

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
    selector: 'app-admin-setup',
    imports: [CommonModule, ReactiveFormsModule],
    template: `
    <div class="setup-container">
      <h2>Create First Admin User</h2>
      <form [formGroup]="setupForm" (ngSubmit)="createFirstAdmin()">
        <div>
          <label>Username:</label>
          <input type="text" formControlName="userName" />
        </div>
        <div>
          <label>Password:</label>
          <input type="password" formControlName="password" />
        </div>
        <div>
          <label>First Name:</label>
          <input type="text" formControlName="firstName" />
        </div>
        <div>
          <label>Last Name:</label>
          <input type="text" formControlName="lastName" />
        </div>
        <div>
          <label>Email:</label>
          <input type="email" formControlName="email" />
        </div>
        <button type="submit" [disabled]="!setupForm.valid">Create Admin</button>
      </form>
      <div *ngIf="message">{{ message }}</div>
    </div>
  `,
    styles: [`
    .setup-container { max-width: 400px; margin: 50px auto; padding: 20px; }
    div { margin: 10px 0; }
    label { display: block; margin-bottom: 5px; }
    input { width: 100%; padding: 8px; }
    button { width: 100%; padding: 10px; background: #007bff; color: white; border: none; cursor: pointer; }
  `]
})
export class AdminSetupComponent {
    setupForm: FormGroup;
    message = '';

    constructor(private fb: FormBuilder, private authService: AuthService) {
        this.setupForm = this.fb.group({
            userName: ['', [Validators.required]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            firstName: ['', [Validators.required]],
            lastName: ['', [Validators.required]],
            email: ['', [Validators.required, Validators.email]]
        });
    }

    createFirstAdmin() {
        if (this.setupForm.valid) {
            this.authService.createFirstAdmin(this.setupForm.value).subscribe({
                next: (response) => {
                    this.message = 'Admin created successfully! You can now sign in.';
                },
                error: (error) => {
                    this.message = `Error: ${error.message}`;
                }
            });
        }
    }
}