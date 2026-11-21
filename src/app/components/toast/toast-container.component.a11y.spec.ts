import { ComponentFixture, TestBed } from '@angular/core/testing';
import axe from 'axe-core';
import { ToastService } from '../../services/toast.service';
import { ToastContainerComponent } from './toast-container.component';

describe('ToastContainerComponent accessibility', () => {
  let fixture: ComponentFixture<ToastContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastContainerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ToastContainerComponent);
    TestBed.inject(ToastService).error('Error', 'Something went wrong. Please try again.');
    fixture.detectChanges();
  });

  it('exposes announcements and a named close control without axe violations', async () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[role="status"][aria-live]')).not.toBeNull();
    expect(element.querySelector('button[aria-label]')).not.toBeNull();

    const results = await axe.run(element, {
      rules: {
        // The toast container is a fixed overlay, not a page landmark.
        region: { enabled: false },
      },
    });
    expect(results.violations.map((v) => v.id)).toEqual([]);
  });
});
