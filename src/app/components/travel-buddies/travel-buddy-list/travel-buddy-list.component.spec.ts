import { ChangeDetectorRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TravelBuddyService } from '../../../services/travel-buddy.service';
import { TravelBuddyListComponent } from './travel-buddy-list.component';

describe('TravelBuddyListComponent', () => {
  let component: TravelBuddyListComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: TravelBuddyService, useValue: {} },
        { provide: Router, useValue: {} },
        { provide: ChangeDetectorRef, useValue: { markForCheck: () => undefined } }
      ]
    });
    component = TestBed.runInInjectionContext(
      () => new TravelBuddyListComponent(TestBed.inject(TravelBuddyService), TestBed.inject(Router))
    );
  });

  it('keeps duplicate string values distinct for trackBy', () => {
    expect(component.trackByValue(0, 'hiking')).not.toBe(component.trackByValue(1, 'hiking'));
  });
});
