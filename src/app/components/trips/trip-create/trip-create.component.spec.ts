import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { ApiResponse } from '../../../models/api-response.model';
import { Trip, TripService } from '../../../services/trip.service';
import { TripCreateComponent } from './trip-create.component';

describe('TripCreateComponent', () => {
  let fixture: ComponentFixture<TripCreateComponent>;
  let component: TripCreateComponent;
  let serviceSpy: jasmine.SpyObj<TripService>;
  let navigateSpy: jasmine.Spy;

  const createdTrip = { id: 'trip-42', title: 'Alps trip' } as Trip;
  const successResponse: ApiResponse<Trip> = { success: true, data: createdTrip };

  beforeEach(async () => {
    serviceSpy = jasmine.createSpyObj<TripService>('TripService', ['createTrip']);

    await TestBed.configureTestingModule({
      imports: [TripCreateComponent],
      providers: [provideRouter([]), { provide: TripService, useValue: serviceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(TripCreateComponent);
    component = fixture.componentInstance;
    navigateSpy = spyOn(TestBed.inject(Router), 'navigate').and.returnValue(Promise.resolve(true));
  });

  function fillForm(): void {
    component.tripForm.setValue({
      title: '  Alps trip  ',
      description: '  Skiing in Zermatt  ',
      destination: '  Zermatt  ',
      startDate: '2026-12-01',
      endDate: '2026-12-08',
      budget: '1500',
      currency: ' usd ',
      visibility: 'PRIVATE',
      tags: 'ski, snow, food',
    });
  }

  function renderedText(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('submits the normalized payload and navigates to the created trip', () => {
    serviceSpy.createTrip.and.returnValue(of(successResponse));
    fillForm();

    component.onSubmit();
    fixture.detectChanges();

    expect(serviceSpy.createTrip).toHaveBeenCalledOnceWith({
      title: 'Alps trip',
      description: 'Skiing in Zermatt',
      destination: 'Zermatt',
      startDate: '2026-12-01',
      endDate: '2026-12-08',
      budget: 1500,
      currency: 'USD',
      visibility: 'PRIVATE',
      tags: ['ski', 'snow', 'food'],
    });
    expect(navigateSpy).toHaveBeenCalledOnceWith(['/trips', 'trip-42']);
    expect(component.submitting).toBeFalse();
    expect(component.createdTrip).toBe(createdTrip);
    expect(renderedText()).toContain('Trip created.');
  });

  it('omits empty optional fields from the payload', () => {
    serviceSpy.createTrip.and.returnValue(of(successResponse));
    fillForm();
    component.tripForm.patchValue({ budget: '', tags: '  ,  ' });

    component.onSubmit();

    expect(serviceSpy.createTrip).toHaveBeenCalledOnceWith({
      title: 'Alps trip',
      description: 'Skiing in Zermatt',
      destination: 'Zermatt',
      startDate: '2026-12-01',
      endDate: '2026-12-08',
      currency: 'USD',
      visibility: 'PRIVATE',
    });
  });

  it('disables submit while the request is in flight', () => {
    const pending = new Subject<ApiResponse<Trip>>();
    serviceSpy.createTrip.and.returnValue(pending.asObservable());
    fillForm();
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(button.disabled).toBeFalse();

    component.onSubmit();
    fixture.detectChanges();
    expect(component.submitting).toBeTrue();
    expect(button.disabled).toBeTrue();

    pending.next(successResponse);
    pending.complete();
    fixture.detectChanges();
    expect(component.submitting).toBeFalse();
    expect(navigateSpy).toHaveBeenCalledWith(['/trips', 'trip-42']);
  });

  it('does not call the service for an invalid form', () => {
    fillForm();
    component.tripForm.controls.title.setValue('');

    component.onSubmit();

    expect(serviceSpy.createTrip).not.toHaveBeenCalled();
    expect(component.tripForm.controls.title.touched).toBeTrue();
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('rejects an end date before the start date', () => {
    fillForm();
    component.tripForm.controls.endDate.setValue('2026-11-30');

    component.onSubmit();

    expect(component.tripForm.hasError('dateRange')).toBeTrue();
    expect(serviceSpy.createTrip).not.toHaveBeenCalled();
  });

  it('shows a safe generic error and never displays server details', () => {
    serviceSpy.createTrip.and.returnValue(
      throwError(() => ({ status: 400, error: { detail: 'SECRET alice@example.com' } })),
    );
    fillForm();

    component.onSubmit();

    expect(component.errorMessage).toBe('We could not create your trip. Please check your details and try again.');
    expect(component.errorMessage).not.toContain('SECRET');
    expect(component.errorMessage).not.toContain('alice@example.com');
    expect(navigateSpy).not.toHaveBeenCalled();
    expect(component.submitting).toBeFalse();
  });
});
