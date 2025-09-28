import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, Renderer2 } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { CursorService } from '../../services/cursor.service';

@Component({
  selector: 'app-signup',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})
export class SignupComponent implements OnInit, OnDestroy, AfterViewInit {
  signupForm!: FormGroup;
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;
  errorMessage = '';
  successMessage = '';
  private particles: HTMLElement[] = [];
  showHints = false;

  get theme$() { return this.themeService.theme$; }

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private el: ElementRef,
    private renderer: Renderer2,
    private authService: AuthService,
    private cursorService: CursorService,
    private themeService: ThemeService
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    this.cursorService.initializeCursor(this.renderer, this.el);
    this.createParticles();
  }

  ngAfterViewInit(): void {
    this.initializeAnimations();
  }

  ngOnDestroy(): void {
    this.cursorService.cleanup(this.renderer);
    this.removeParticles();
  }



  private createParticles(): void {
    const particleContainer = this.renderer.createElement('div');
    this.renderer.addClass(particleContainer, 'particles');
    this.renderer.appendChild(this.el.nativeElement, particleContainer);

    for (let i = 0; i < 25; i++) {
      const particle = this.renderer.createElement('div');
      this.renderer.addClass(particle, 'particle');

      const size = Math.random() * 4 + 2;
      const animationDuration = Math.random() * 12 + 18;
      const delay = Math.random() * 8;

      this.renderer.setStyle(particle, 'left', Math.random() * 100 + '%');
      this.renderer.setStyle(particle, 'width', size + 'px');
      this.renderer.setStyle(particle, 'height', size + 'px');
      this.renderer.setStyle(particle, 'animation-duration', animationDuration + 's');
      this.renderer.setStyle(particle, 'animation-delay', delay + 's');

      this.renderer.appendChild(particleContainer, particle);
      this.particles.push(particle);
    }
  }

  private removeParticles(): void {
    const particleContainer = this.el.nativeElement.querySelector('.particles');
    if (particleContainer) {
      this.renderer.removeChild(this.el.nativeElement, particleContainer);
    }
  }

  private initializeAnimations(): void {
    // Animate form elements on load
    const formElements = this.el.nativeElement.querySelectorAll('.form-group, .form-row, .auth-header, .auth-footer');
    formElements.forEach((element: HTMLElement, index: number) => {
      this.renderer.setStyle(element, 'opacity', '0');
      this.renderer.setStyle(element, 'transform', 'translateY(40px)');

      setTimeout(() => {
        this.renderer.setStyle(element, 'transition', 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)');
        this.renderer.setStyle(element, 'opacity', '1');
        this.renderer.setStyle(element, 'transform', 'translateY(0)');
      }, index * 120);
    });
  }

  private initializeForm(): void {
    this.signupForm = this.formBuilder.group({
      userName: ['', [Validators.required, Validators.minLength(3)]],
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(6) // Updated to match API requirements
      ]],
      confirmPassword: ['', [Validators.required]],
      acceptTerms: [false, [Validators.requiredTrue]],
      subscribeNewsletter: [false]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  // Custom validator to check if passwords match
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    if (confirmPassword?.hasError('passwordMismatch')) {
      delete confirmPassword.errors?.['passwordMismatch'];
      if (Object.keys(confirmPassword.errors || {}).length === 0) {
        confirmPassword.setErrors(null);
      }
    }

    return null;
  }

  get userName() {
    return this.signupForm.get('userName');
  }

  get firstName() {
    return this.signupForm.get('firstName');
  }

  get lastName() {
    return this.signupForm.get('lastName');
  }

  get email() {
    return this.signupForm.get('email');
  }

  get password() {
    return this.signupForm.get('password');
  }

  get confirmPassword() {
    return this.signupForm.get('confirmPassword');
  }

  get acceptTerms() {
    return this.signupForm.get('acceptTerms');
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  toggleTheme(): void { this.themeService.toggleTheme(); }

  getPasswordStrength(): string {
    const password = this.password?.value || '';
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^\w\s]/.test(password)) score++;
    if (score <= 2) return 'weak';
    if (score <= 3) return 'fair';
    if (score <= 4) return 'good';
    return 'strong';
  }

  getPasswordStrengthText(): string {
    const level = this.getPasswordStrength();
    switch (level) {
      case 'weak': return 'Weak';
      case 'fair': return 'Fair';
      case 'good': return 'Good';
      case 'strong': return 'Strong';
      default: return '';
    }
  }

  onSubmit(): void {
    if (this.signupForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const formData = this.signupForm.value;
      const signupData = {
        userName: formData.userName,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password
      };

      this.authService.signup(signupData).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          console.log('Signup successful:', response);

          // Since API returns 200 OK, treat it as success
          this.successMessage = response?.message || 'Account created successfully!';

          // Show success message briefly, then redirect
          setTimeout(() => {
            this.router.navigate(['/signin'], {
              queryParams: {
                message: `Account created successfully! Please sign in using your username: ${signupData.userName}`
              }
            });
          }, 2000);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Signup error:', error);

          // Handle different error scenarios
          if (error.status === 400) {
            this.errorMessage = 'Invalid data provided. Please check your information.';
          } else if (error.status === 409) {
            this.errorMessage = 'An account with this email or username already exists.';
          } else if (error.status === 500) {
            this.errorMessage = 'Server error. Please try again later.';
          } else {
            this.errorMessage = error.error?.message || 'Network error. Please check your connection and try again.';
          }

          // Log debugging information for developers
          console.log('🔍 Debugging Information:');
          console.log(`  - Frontend Origin: ${window.location.origin}`);
          console.log(`  - Backend URL: ${this.authService['API_BASE_URL']}`);
          console.log(`  - Error Status: ${error.status}`);
          console.log(`  - Error Message: ${error.message}`);
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.signupForm.controls).forEach(key => {
        const control = this.signupForm.get(key);
        control?.markAsTouched();
      });
    }
  }

  signUpWithGoogle(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    // Placeholder for Google OAuth implementation
    console.log('Google OAuth integration would go here');
    
    // Simulate OAuth flow
    setTimeout(() => {
      this.isLoading = false;
      this.successMessage = 'Google OAuth integration would redirect to Google here';
    }, 1500);
  }

  signUpWithFacebook(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    // Placeholder for Facebook OAuth implementation
    console.log('Facebook OAuth integration would go here');
    
    // Simulate OAuth flow
    setTimeout(() => {
      this.isLoading = false;
      this.successMessage = 'Facebook OAuth integration would redirect to Facebook here';
    }, 1500);
  }
}
