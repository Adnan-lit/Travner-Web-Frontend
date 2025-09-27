import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, Renderer2 } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CursorService } from '../../services/cursor.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    RouterModule
],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent implements OnInit, OnDestroy, AfterViewInit {
  private particles: HTMLElement[] = [];

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private cursorService: CursorService
  ) { }

  ngOnInit(): void {
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
    this.renderer.appendChild(document.body, particleContainer);

    for (let i = 0; i < 20; i++) {
      const particle = this.renderer.createElement('div');
      this.renderer.addClass(particle, 'particle');

      const size = Math.random() * 4 + 2;
      const duration = Math.random() * 10 + 15;
      const delay = Math.random() * 5;
      const leftPosition = Math.random() * 100;

      this.renderer.setStyle(particle, 'width', size + 'px');
      this.renderer.setStyle(particle, 'height', size + 'px');
      this.renderer.setStyle(particle, 'left', leftPosition + '%');
      this.renderer.setStyle(particle, 'animation-duration', duration + 's');
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
    // Animate feature cards on scroll
    const cards = this.el.nativeElement.querySelectorAll('.feature-card');
    cards.forEach((card: HTMLElement, index: number) => {
      this.renderer.setStyle(card, 'animation-delay', (index * 0.2) + 's');
      this.renderer.addClass(card, 'fade-in-up');
    });

    // Animate hero elements
    const heroElements = this.el.nativeElement.querySelectorAll('.hero-text > *');
    heroElements.forEach((element: HTMLElement, index: number) => {
      this.renderer.setStyle(element, 'animation-delay', (index * 0.2) + 's');
      this.renderer.addClass(element, 'fade-in-up');
    });
  }
}
