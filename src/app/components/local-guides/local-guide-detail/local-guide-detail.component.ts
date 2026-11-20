import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { LocalGuide } from '../../../models/location.model';
import { LocalGuideService } from '../../../services/local-guide.service';

const LOAD_ERROR = 'Could not load this local guide. Please try again.';

@Component({
  selector: 'app-local-guide-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './local-guide-detail.component.html',
  styleUrls: ['./local-guide-detail.component.css']
})
export class LocalGuideDetailComponent implements OnInit {
  guide: LocalGuide | null = null;
  loading = false;
  notFound = false;
  errorMessage: string | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly localGuideService: LocalGuideService
  ) {}

  ngOnInit(): void {
    this.loadGuide();
  }

  loadGuide(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.guide = null;
      this.notFound = true;
      return;
    }

    this.guide = null;
    this.loading = true;
    this.notFound = false;
    this.errorMessage = null;

    this.localGuideService.getLocalGuide(id).pipe(
      finalize(() => { this.loading = false; })
    ).subscribe({
      next: (response) => {
        if (!response.data) {
          this.notFound = true;
          return;
        }
        this.guide = response.data;
      },
      error: (error: unknown) => {
        const status = (error as { status?: number } | null)?.status;
        if (status === 404) {
          this.notFound = true;
        } else {
          this.errorMessage = LOAD_ERROR;
        }
      }
    });
  }

  get displayName(): string {
    const author = this.guide?.author;
    if (!author) {
      return 'Unknown guide';
    }

    const fullName = [author.firstName, author.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();

    return fullName || author.userName || 'Unknown guide';
  }
}
