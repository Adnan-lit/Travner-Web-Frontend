import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';
import { CursorService } from '../../services/cursor.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  currentUser: User | null = null;
  private userSubscription?: Subscription;
  private particles: HTMLElement[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private el: ElementRef,
    private renderer: Renderer2,
    private cursorService: CursorService
  ) { }

  /**
   * Check if current user is admin
   */
  isAdmin(): boolean {
    return this.currentUser?.roles?.includes('ADMIN') || false;
  }

  ngOnInit(): void {
    this.cursorService.initializeCursor(this.renderer, this.el);
    this.createParticles();

    // Subscribe to current user
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;

      // If no user is logged in, redirect to signin
      if (!user) {
        this.router.navigate(['/signin']);
      }
    });

    // Get current user if available
    this.currentUser = this.authService.getCurrentUser();

    // If no user, redirect to signin
    if (!this.currentUser) {
      this.router.navigate(['/signin']);
    }

    console.log('Dashboard loaded for user:', this.currentUser);
  }

  ngAfterViewInit(): void {
    this.initializeAnimations();
  }

  ngOnDestroy(): void {
    this.cursorService.cleanup(this.renderer);
    this.removeParticles();
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }



  private createParticles(): void {
    const particleContainer = this.renderer.createElement('div');
    this.renderer.addClass(particleContainer, 'particles');
    this.renderer.appendChild(document.body, particleContainer);

    for (let i = 0; i < 15; i++) {
      const particle = this.renderer.createElement('div');
      this.renderer.addClass(particle, 'particle');

      const size = Math.random() * 3 + 1;
      const animationDuration = Math.random() * 8 + 12;
      const delay = Math.random() * 3;

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
    this.particles.forEach(particle => {
      if (particle.parentElement) {
        this.renderer.removeChild(particle.parentElement, particle);
      }
    });
    this.particles = [];

    const particleContainer = document.querySelector('.particles');
    if (particleContainer) {
      this.renderer.removeChild(document.body, particleContainer);
    }
  }

  private initializeAnimations(): void {
    // Animate dashboard elements on load
    const animatedElements = this.el.nativeElement.querySelectorAll('.welcome-section, .action-card, .activity-item, .destination-card');
    animatedElements.forEach((element: HTMLElement, index: number) => {
      this.renderer.setStyle(element, 'opacity', '0');
      this.renderer.setStyle(element, 'transform', 'translateY(30px)');

      setTimeout(() => {
        this.renderer.setStyle(element, 'transition', 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)');
        this.renderer.setStyle(element, 'opacity', '1');
        this.renderer.setStyle(element, 'transform', 'translateY(0)');
      }, index * 100 + 200);
    });
  }

  logout(): void {
    console.log('Logging out user...');
    this.authService.logout();
    // AuthService.logout() already navigates to home page
  }
}
