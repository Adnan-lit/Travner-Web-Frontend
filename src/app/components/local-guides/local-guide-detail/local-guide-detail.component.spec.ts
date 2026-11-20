import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LocalGuide, LocalGuideResponse } from '../../../models/location.model';
import { LocalGuideService } from '../../../services/local-guide.service';
import { LocalGuideDetailComponent } from './local-guide-detail.component';

describe('LocalGuideDetailComponent', () => {
  let fixture: ComponentFixture<LocalGuideDetailComponent>;
  let component: LocalGuideDetailComponent;
  let service: jasmine.SpyObj<LocalGuideService>;

  const guide: LocalGuide = {
    id: 'guide-1',
    userId: 'user-1',
    location: 'Lisbon',
    languages: ['English', 'Portuguese'],
    specialties: ['History', 'Food'],
    bio: 'Local historian and food enthusiast.',
    hourlyRate: 30,
    currency: 'EUR',
    isAvailable: true,
    availability: 'Weekends',
    rating: 0,
    reviewCount: 0,
    totalBookings: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    author: {
      id: 'user-1',
      userName: 'lisbon_local',
      firstName: 'Ana',
      lastName: 'Silva'
    }
  };

  beforeEach(async () => {
    service = jasmine.createSpyObj<LocalGuideService>('LocalGuideService', ['getLocalGuide']);
    service.getLocalGuide.and.returnValue(of({ success: true, data: guide } as LocalGuideResponse));

    await TestBed.configureTestingModule({
      imports: [LocalGuideDetailComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: 'guide-1' }) } } },
        { provide: LocalGuideService, useValue: service }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LocalGuideDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads the guide from the route id and renders its details', () => {
    fixture.detectChanges();

    expect(service.getLocalGuide).toHaveBeenCalledWith('guide-1');
    expect(component.guide).toEqual(guide);
    expect(component.displayName).toBe('Ana Silva');

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Ana Silva');
    expect(text).toContain('Lisbon');
    expect(text).toContain('Local historian and food enthusiast.');
    expect(text).toContain('English, Portuguese');
    expect(text).toContain('History, Food');
    expect(text).toContain('EUR 30');
    expect(text).toContain('Weekends');
    expect(text).toContain('Back to local guides');
  });

  it('shows a not-found state for a 404 response', () => {
    service.getLocalGuide.and.returnValue(throwError(() => ({ status: 404 })));
    component.loadGuide();
    fixture.detectChanges();

    expect(component.notFound).toBeTrue();
    expect(component.errorMessage).toBeNull();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Local guide not found');
  });

  it('shows a generic error without rendering server error details', () => {
    service.getLocalGuide.and.returnValue(throwError(() => ({
      status: 500,
      message: 'SECRET-SERVER-DETAIL'
    })));
    component.loadGuide();
    fixture.detectChanges();

    expect(component.notFound).toBeFalse();
    expect(component.errorMessage).toBe('Could not load this local guide. Please try again.');
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).not.toContain('SECRET-SERVER-DETAIL');
  });
});
