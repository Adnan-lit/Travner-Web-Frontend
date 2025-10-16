import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/common.model';

@Component({
    selector: 'app-landing',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './landing.component.html',
    styleUrls: ['./landing.component.css']
})
export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {
    currentUser: User | null = null;
    isAuthenticated = false;
    private particleInterval: any;

    constructor(private authService: AuthService) { }

    ngOnInit(): void {
        this.authService.currentUser$.subscribe(user => {
            this.currentUser = user;
            this.isAuthenticated = !!user;
        });
    }

    ngAfterViewInit(): void {
        this.initParticles();
    }

    ngOnDestroy(): void {
        if (this.particleInterval) {
            clearInterval(this.particleInterval);
        }
    }

    logout(): void {
        this.authService.logout();
    }

    private initParticles(): void {
        const particlesContainer = document.getElementById('particles');
        if (!particlesContainer) return;

        // Create particles
        for (let i = 0; i < 50; i++) {
            this.createParticle(particlesContainer);
        }

        // Add new particles periodically
        this.particleInterval = setInterval(() => {
            if (particlesContainer.children.length < 100) {
                this.createParticle(particlesContainer);
            }
        }, 2000);
    }

    private createParticle(container: HTMLElement): void {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Random size between 2px and 8px
        const size = Math.random() * 6 + 2;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        // Random position
        particle.style.left = `${Math.random() * 100}%`;
        
        // Random animation duration between 15s and 25s
        const duration = Math.random() * 10 + 15;
        particle.style.animationDuration = `${duration}s`;
        
        // Random delay
        const delay = Math.random() * 5;
        particle.style.animationDelay = `${delay}s`;
        
        container.appendChild(particle);
        
        // Remove particle after animation completes
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, (duration + delay) * 1000);
    }
}