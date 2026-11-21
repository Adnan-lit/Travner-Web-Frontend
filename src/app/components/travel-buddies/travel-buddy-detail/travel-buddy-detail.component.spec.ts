import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, ParamMap, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { TravelBuddyDetailComponent } from './travel-buddy-detail.component';
import { TravelBuddyService } from '../../../services/travel-buddy.service';
import { TravelBuddy, TravelBuddyResponse } from '../../../models/location.model';

describe('TravelBuddyDetailComponent', () => {
  let fixture: ComponentFixture<TravelBuddyDetailComponent>;
  let component: TravelBuddyDetailComponent;
  let serviceSpy: jasmine.SpyObj<TravelBuddyService>;
  let routeStub: { snapshot: { paramMap: ParamMap } };

  const buddy = {
    id: 'tb-1',
    userId: 'user-1',
    destination: 'Kyoto',
    startDate: '2026-12-01',
    endDate: '2026-12-10',
    interests: ['hiking', 'food'],
    status: 'active',
    expiryDate: '2026-12-15',
    createdAt: '2026-11-20T00:00:00Z',
    updatedAt: '2026-11-20T00:00:00Z',
    description: 'Looking for a hiking companion.',
    author: { id: 'user-1', userName: 'alice', firstName: 'Alice', lastName: 'Traveler' },
  } as TravelBuddy;
  const successResponse: TravelBuddyResponse = { success: true, data: buddy };

  beforeEach(async () => {
    serviceSpy = jasmine.createSpyObj<TravelBuddyService>('TravelBuddyService', ['getTravelBuddy']);
    serviceSpy.getTravelBuddy.and.returnValue(of(successResponse));
    routeStub = { snapshot: { paramMap: convertToParamMap({ id: 'tb-1' }) } };

    await TestBed.configureTestingModule({
      imports: [TravelBuddyDetailComponent],
      providers: [
        provideRouter([]),
        { provide: TravelBuddyService, useValue: serviceSpy },
        { provide: ActivatedRoute, useValue: routeStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TravelBuddyDetailComponent);
    component = fixture.componentInstance;
    spyOn(TestBed.inject(Router), 'navigate').and.returnValue(Promise.resolve(true));
  });

  function renderedText(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('loads the id from the route and renders the meaningful fields', () => {
    fixture.detectChanges();

    expect(serviceSpy.getTravelBuddy).toHaveBeenCalledOnceWith('tb-1');
    expect(component.loading).toBeFalse();
    expect(component.error).toBeNull();
    expect(component.notFound).toBeFalse();

    const text = renderedText();
    expect(text).toContain('Kyoto');
    expect(text).toContain('hiking');
    expect(text).toContain('food');
    expect(text).toContain('Active');
    expect(text).toContain('Looking for a hiking companion.');
    expect(text).toContain('Alice Traveler');
    expect(component.formatDate('2026-12-01')).toContain('2026');
  });

  it('shows a not-found state when the envelope has no data', () => {
    serviceSpy.getTravelBuddy.and.returnValue(of({ success: true } as TravelBuddyResponse));

    fixture.detectChanges();

    expect(component.notFound).toBeTrue();
    expect(component.loading).toBeFalse();
    expect(component.travelBuddy).toBeNull();
    expect(renderedText()).toContain('not found');
  });

  it('treats a 404 response as not found', () => {
    serviceSpy.getTravelBuddy.and.returnValue(throwError(() => ({ status: 404 })));

    fixture.detectChanges();

    expect(component.notFound).toBeTrue();
    expect(component.error).toBeNull();
    expect(renderedText()).toContain('not found');
  });

  it('shows a safe generic error for other failures', () => {
    serviceSpy.getTravelBuddy.and.returnValue(
      throwError(() => ({ status: 500, error: { detail: 'SECRET alice@example.com' } })),
    );

    fixture.detectChanges();

    expect(component.error).toBe('Unable to load this travel buddy request. Please try again.');
    expect(component.notFound).toBeFalse();
    expect(component.loading).toBeFalse();
    expect(renderedText()).not.toContain('SECRET');
    expect(renderedText()).not.toContain('alice@example.com');
  });

  it('does not call the service when the route has no id', () => {
    routeStub.snapshot.paramMap = convertToParamMap({});

    fixture.detectChanges();

    expect(serviceSpy.getTravelBuddy).not.toHaveBeenCalled();
    expect(component.notFound).toBeTrue();
  });

  it('retries the load with the same id', () => {
    fixture.detectChanges();

    component.retry();

    expect(serviceSpy.getTravelBuddy).toHaveBeenCalledTimes(2);
    expect(serviceSpy.getTravelBuddy).toHaveBeenCalledWith('tb-1');
  });
});
