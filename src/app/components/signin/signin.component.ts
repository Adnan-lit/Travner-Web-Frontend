import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, Renderer2 } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { AuthService, User } from '../../services/auth.service';
import { CursorService } from '../../services/cursor.service';

@Component({
  selector: 'app-signin',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule],
  templateUrl: './signin.component.html',
  styleUrl: './signin.component.css'
})
export class SigninComponent implements OnInit, OnDestroy, AfterViewInit {
  signinForm!: FormGroup;
  isLoading = false;
  showPassword = false;
  errorMessage = '';
  successMessage = '';
  private particles: HTMLElement[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private el: ElementRef,
    private renderer: Renderer2,
    private authService: AuthService,
    private cursorService: CursorService
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    this.cursorService.initializeCursor(this.renderer, this.el);
    this.createParticles();

    // Check for success message from route params (e.g., after successful signup)
    this.route.queryParams.subscribe(params => {
      if (params['message']) {
        this.successMessage = params['message'];
        // Clear the success message after 5 seconds
        setTimeout(() => {
          this.successMessage = '';
        }, 5000);
      }
    });
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

    for (let i = 0; i < 20; i++) {
      const particle = this.renderer.createElement('div');
      this.renderer.addClass(particle, 'particle');

      const size = Math.random() * 4 + 2;
      const animationDuration = Math.random() * 10 + 15;
      const delay = Math.random() * 5;

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
    const formElements = this.el.nativeElement.querySelectorAll('.form-group, .auth-header, .auth-footer');
    formElements.forEach((element: HTMLElement, index: number) => {
      this.renderer.setStyle(element, 'opacity', '0');
      this.renderer.setStyle(element, 'transform', 'translateY(30px)');

      setTimeout(() => {
        this.renderer.setStyle(element, 'transition', 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)');
        this.renderer.setStyle(element, 'opacity', '1');
        this.renderer.setStyle(element, 'transform', 'translateY(0)');
      }, index * 100);
    });
  }

  private initializeForm(): void {
    this.signinForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  get username() {
    return this.signinForm.get('username');
  }

  get password() {
    return this.signinForm.get('password');
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.signinForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const formData = this.signinForm.value;
      console.log('Attempting signin with:', { username: formData.username });

      this.authService.signin(formData.username, formData.password).subscribe({
        next: (user: User) => {
          this.isLoading = false;
          console.log('Sign in successful:', user);

          // Navigate to dashboard after successful signin
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Full signin error details:', {
            status: error.status,
            statusText: error.statusText,
            error: error.error,
            message: error.message,
            url: error.url,
            fullError: error
          });

          // Enhanced CORS detection with browser origin verification
          const currentOrigin = window.location.origin;
          console.log('🌐 Current browser origin:', currentOrigin);
          console.log('🔗 API URL:', error.url);

          // Handle different error scenarios with enhanced CORS debugging
          if (error.status === 0) {
            // Status 0 usually indicates CORS or network connectivity issues
            console.log('🔴 CORS/Network Error Detected:');
            console.log('- Backend server needs CORS configuration');
            console.log(`- Backend should allow Origin: ${currentOrigin}`);
            console.log('- Check if the backend server is running');
            console.log('- Verify backend CORS allows credentials if needed');

            // Check if this is likely a CORS issue vs network issue
            if (error.error instanceof ProgressEvent) {
              console.log('🚫 This appears to be a CORS preflight failure');
              this.errorMessage = `🔴 CORS Error: Backend server is not configured to allow requests from ${currentOrigin}. ` +
                'The backend needs to include this origin in its CORS configuration.';
            } else {
              console.log('🚫 This appears to be a network connectivity issue');
              this.errorMessage = '🔴 Network Error: Unable to connect to the backend server. Please check if the server is running.';
            }
          } else if (error.status === 401) {
            this.errorMessage = 'Invalid username or password. Please check your credentials and try again.';
          } else if (error.status === 403) {
            this.errorMessage = 'Access denied. Please check your username and password.';
          } else if (error.status === 404) {
            this.errorMessage = 'Username not found. Please check your username or create a new account.';
          } else if (error.status === 500) {
            this.errorMessage = 'Server error. Please try again later.';
          } else {
            this.errorMessage = error.error?.message || `Sign in failed (${error.status}). Please check your credentials and try again.`;
          }

          // Log detailed debugging information for developers
          console.log('🔍 Debugging Information:');
          console.log(`  - Frontend Origin: ${currentOrigin}`);
          console.log(`  - Backend URL: ${error.url}`);
          console.log(`  - Error Status: ${error.status}`);
          console.log(`  - Error Type: ${error.error?.constructor?.name || 'Unknown'}`);
          console.log('  - Suggestion: Test CORS using the button below');
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.signinForm.controls).forEach(key => {
        const control = this.signinForm.get(key);
        control?.markAsTouched();
      });
    }
  }

  signInWithGoogle(): void {
    console.log('Sign in with Google');
    // Implement Google OAuth logic here
  }

  signInWithFacebook(): void {
    console.log('Sign in with Facebook');
    // Implement Facebook OAuth logic here
  }
}
