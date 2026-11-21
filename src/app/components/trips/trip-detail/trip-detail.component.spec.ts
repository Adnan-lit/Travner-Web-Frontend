import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, ParamMap, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ApiResponse } from '../../../models/api-response.model';
import { Trip, TripService } from '../../../services/trip.service';
import { TripDetailComponent } from './trip-detail.component';

describe('TripDetailComponent', () => {
  let fixture: ComponentFixture<TripDetailComponent>;
  let component: TripDetailComponent;
  let serviceSpy: jasmine.SpyObj<TripService>;
  let routeStub: { snapshot: { paramMap: ParamMap } };

  const trip = {
    id: 'trip-42',
    title: 'Alps Adventure',
    description: 'Skiing in Zermatt.',
    destination: 'Zermatt',
    startDate: '2026-12-01',
    endDate: '2026-12-08',
    budget: 1500,
    currency: 'USD',
    status: 'PLANNING',
    visibility: 'PRIVATE',
    authorId: 'user-1',
    authorUsername: 'alice',
    participants: [],
    itinerary: [],
    expenses: [],
    photos: [],
    tags: ['ski', 'snow'],
    createdAt: '2026-11-01T00:00:00Z',
    updatedAt: '2026-11-01T00:00:00Z',
  } as Trip;
  const successResponse: ApiResponse<Trip> = { success: true, data: trip };

  beforeEach(async () => {
    serviceSpy = jasmine.createSpyObj<TripService>('TripService', ['getTripById']);
    serviceSpy.getTripById.and.returnValue(of(successResponse));
    routeStub = { snapshot: { paramMap: convertToParamMap({ id: 'trip-42' }) } };

    await TestBed.configureTestingModule({
      imports: [TripDetailComponent],
      providers: [
        provideRouter([]),
        { provide: TripService, useValue: serviceSpy },
        { provide: ActivatedRoute, useValue: routeStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TripDetailComponent);
    component = fixture.componentInstance;
    spyOn(TestBed.inject(Router), 'navigate').and.returnValue(Promise.resolve(true));
  });

  function renderedText(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('loads the id from the route and renders the meaningful trip fields', () => {
    fixture.detectChanges();

    expect(serviceSpy.getTripById).toHaveBeenCalledOnceWith('trip-42');
    expect(component.state).toBe('ready');
    expect(component.trip).toBe(trip);

    const text = renderedText();
    expect(text).toContain('Alps Adventure');
    expect(text).toContain('Zermatt');
    expect(text).toContain('PLANNING');
    expect(text).toContain('Skiing in Zermatt.');
    expect(text).toContain('alice');
    expect(text).toContain('ski');
    expect(text).toContain('Back to trips');
  });

  it('treats a missing envelope payload as not found', () => {
    serviceSpy.getTripById.and.returnValue(of({ success: true } as ApiResponse<Trip>));

    fixture.detectChanges();

    expect(component.state).toBe('not-found');
    expect(component.trip).toBeNull();
    expect(renderedText()).toContain('Trip not found.');
  });

  it('treats a 404 response as not found', () => {
    serviceSpy.getTripById.and.returnValue(
      throwError(() => ({ status: 404, error: { detail: 'SECRET alice@example.com' } })),
    );

    fixture.detectChanges();

    expect(component.state).toBe('not-found');
    expect(renderedText()).toContain('Trip not found.');
    expect(renderedText()).not.toContain('SECRET');
    expect(renderedText()).not.toContain('alice@example.com');
  });

  it('shows a safe generic error for other failures', () => {
    serviceSpy.getTripById.and.returnValue(
      throwError(() => ({ status: 500, error: { detail: 'SECRET alice@example.com' } })),
    );

    fixture.detectChanges();

    expect(component.state).toBe('error');
    expect(component.errorMessage).toBe('We could not load this trip. Please try again later.');
    expect(renderedText()).not.toContain('SECRET');
    expect(renderedText()).not.toContain('alice@example.com');
  });

  it('does not call the service when the route has no id', () => {
    routeStub.snapshot.paramMap = convertToParamMap({});

    fixture.detectChanges();

    expect(serviceSpy.getTripById).not.toHaveBeenCalled();
    expect(component.state).toBe('missing-id');
    expect(renderedText()).toContain('No trip was specified.');
  });
});
