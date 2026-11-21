import { ChangeDetectorRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { LocalGuideService } from '../../../services/local-guide.service';
import { LocalGuideListComponent } from './local-guide-list.component';

describe('LocalGuideListComponent', () => {
  let component: LocalGuideListComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: LocalGuideService, useValue: {} },
        { provide: Router, useValue: {} },
        { provide: ChangeDetectorRef, useValue: { markForCheck: () => undefined } },
      ],
    });
    component = TestBed.runInInjectionContext(
      () => new LocalGuideListComponent(TestBed.inject(LocalGuideService), TestBed.inject(Router)),
    );
  });

  it('keeps duplicate string values distinct for trackBy', () => {
    expect(component.trackByValue(0, 'beach')).not.toBe(component.trackByValue(1, 'beach'));
  });
});
