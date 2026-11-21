import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { TravelBuddyCreateComponent } from './travel-buddy-create.component';
import { TravelBuddyService } from '../../../services/travel-buddy.service';
import { TravelBuddy, TravelBuddyResponse } from '../../../models/location.model';

describe('TravelBuddyCreateComponent', () => {
  let fixture: ComponentFixture<TravelBuddyCreateComponent>;
  let component: TravelBuddyCreateComponent;
  let serviceSpy: jasmine.SpyObj<TravelBuddyService>;
  let navigateSpy: jasmine.Spy;

  const created: TravelBuddy = {
    id: 'tb-1',
    userId: 'user-1',
    destination: 'Kyoto',
    startDate: '2026-12-01',
    endDate: '2026-12-10',
    interests: ['hiking', 'food', 'photography'],
    status: 'active',
    expiryDate: '2026-12-15',
    createdAt: '2026-11-20T00:00:00Z',
    updatedAt: '2026-11-20T00:00:00Z',
  };
  const successResponse: TravelBuddyResponse = { success: true, data: created };

  beforeEach(async () => {
    serviceSpy = jasmine.createSpyObj<TravelBuddyService>('TravelBuddyService', ['createTravelBuddy']);

    await TestBed.configureTestingModule({
      imports: [TravelBuddyCreateComponent],
      providers: [provideRouter([]), { provide: TravelBuddyService, useValue: serviceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(TravelBuddyCreateComponent);
    component = fixture.componentInstance;
    navigateSpy = spyOn(TestBed.inject(Router), 'navigate').and.returnValue(Promise.resolve(true));
  });

  function fillForm(includeOptional = true): void {
    component.form.setValue({
      destination: '  Kyoto  ',
      startDate: '2026-12-01',
      endDate: '2026-12-10',
      interests: ' hiking , food , photography ',
      expiryDays: 14,
      minAge: includeOptional ? 22 : null,
      maxAge: includeOptional ? 35 : null,
      preferredGender: includeOptional ? 'female' : '',
      budgetRange: includeOptional ? ' 1000-2000 BDT ' : '',
    });
  }

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('submits the full payload and navigates to the new detail route', () => {
    serviceSpy.createTravelBuddy.and.returnValue(of(successResponse));
    fillForm();

    component.onSubmit();

    expect(serviceSpy.createTravelBuddy).toHaveBeenCalledOnceWith({
      destination: 'Kyoto',
      startDate: '2026-12-01',
      endDate: '2026-12-10',
      interests: ['hiking', 'food', 'photography'],
      expiryDays: 14,
      minAge: 22,
      maxAge: 35,
      preferredGender: 'female',
      budgetRange: '1000-2000 BDT',
    });
    expect(navigateSpy).toHaveBeenCalledOnceWith(['/travel-buddies', 'tb-1']);
    expect(component.error).toBeNull();
  });

  it('omits empty optional fields from the payload', () => {
    serviceSpy.createTravelBuddy.and.returnValue(of(successResponse));
    fillForm(false);

    component.onSubmit();

    expect(serviceSpy.createTravelBuddy).toHaveBeenCalledOnceWith({
      destination: 'Kyoto',
      startDate: '2026-12-01',
      endDate: '2026-12-10',
      interests: ['hiking', 'food', 'photography'],
      expiryDays: 14,
    });
  });

  it('disables submit while the request is in flight', () => {
    const pending = new Subject<TravelBuddyResponse>();
    serviceSpy.createTravelBuddy.and.returnValue(pending.asObservable());
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
    expect(button.disabled).toBeFalse();
    expect(navigateSpy).toHaveBeenCalledWith(['/travel-buddies', 'tb-1']);
  });

  it('shows a safe generic error and never displays server details', () => {
    serviceSpy.createTravelBuddy.and.returnValue(
      throwError(() => ({ status: 500, error: { detail: 'SECRET alice@example.com' } })),
    );
    fillForm();

    component.onSubmit();

    expect(component.error).toBe('Could not create your travel buddy request. Please try again.');
    expect(component.error).not.toContain('SECRET');
    expect(component.error).not.toContain('alice@example.com');
    expect(navigateSpy).not.toHaveBeenCalled();
    expect(component.submitting).toBeFalse();
  });

  it('does not call the service for an invalid form', () => {
    fillForm();
    component.form.controls.destination.setValue('');

    component.onSubmit();

    expect(serviceSpy.createTravelBuddy).not.toHaveBeenCalled();
    expect(component.form.controls.destination.touched).toBeTrue();
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('rejects an end date before the start date', () => {
    fillForm();
    component.form.controls.endDate.setValue('2026-11-30');

    component.onSubmit();

    expect(component.form.hasError('dateRange')).toBeTrue();
    expect(serviceSpy.createTravelBuddy).not.toHaveBeenCalled();
  });
});
