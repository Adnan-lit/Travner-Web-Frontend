import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { LocalGuide, LocalGuideResponse } from '../../../models/location.model';
import { LocalGuideService } from '../../../services/local-guide.service';
import { LocalGuideCreateComponent } from './local-guide-create.component';

describe('LocalGuideCreateComponent', () => {
  let fixture: ComponentFixture<LocalGuideCreateComponent>;
  let component: LocalGuideCreateComponent;
  let service: jasmine.SpyObj<LocalGuideService>;
  let router: Router;

  beforeEach(async () => {
    service = jasmine.createSpyObj<LocalGuideService>('LocalGuideService', ['createLocalGuide']);
    service.createLocalGuide.and.returnValue(of(response('guide-1')));

    await TestBed.configureTestingModule({
      imports: [LocalGuideCreateComponent],
      providers: [provideRouter([]), { provide: LocalGuideService, useValue: service }],
    }).compileComponents();

    fixture = TestBed.createComponent(LocalGuideCreateComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture.detectChanges();
  });

  function response(id: string): LocalGuideResponse {
    return { success: true, data: { id } as LocalGuide } as LocalGuideResponse;
  }

  function fillValidForm(): void {
    component.guideForm.setValue({
      location: 'Lisbon',
      bio: 'Local historian and food enthusiast.',
      hourlyRate: 25,
      currency: 'EUR',
      languages: 'English, Portuguese',
      specialties: 'History, Food',
      availability: 'Weekends',
      contactMethod: 'email',
      contactInfo: 'via profile',
    });
  }

  it('posts comma-separated lists as arrays and navigates to the new guide', () => {
    fillValidForm();

    component.onSubmit();

    expect(service.createLocalGuide).toHaveBeenCalledOnceWith({
      location: 'Lisbon',
      bio: 'Local historian and food enthusiast.',
      hourlyRate: 25,
      currency: 'EUR',
      languages: ['English', 'Portuguese'],
      specialties: ['History', 'Food'],
      availability: 'Weekends',
      contactMethod: 'email',
      contactInfo: 'via profile',
    });
    expect(router.navigate).toHaveBeenCalledWith(['/local-guides', 'guide-1']);
  });

  it('does not submit an invalid form', () => {
    component.onSubmit();

    expect(service.createLocalGuide).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('disables submit while the request is in flight', () => {
    const pending = new Subject<LocalGuideResponse>();
    service.createLocalGuide.and.returnValue(pending.asObservable());
    fillValidForm();

    component.onSubmit();
    fixture.detectChanges();

    expect(component.submitting).toBeTrue();
    const button = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(button.disabled).toBeTrue();

    pending.next(response('guide-2'));
    pending.complete();

    expect(component.submitting).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/local-guides', 'guide-2']);
  });

  it('shows a generic error without rendering server error details', () => {
    service.createLocalGuide.and.returnValue(
      throwError(() => ({
        status: 500,
        message: 'SECRET-SERVER-DETAIL',
      })),
    );
    fillValidForm();

    component.onSubmit();
    fixture.detectChanges();

    expect(component.submitting).toBeFalse();
    expect(component.errorMessage).toBe('Could not create the local guide. Please try again.');
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('SECRET-SERVER-DETAIL');
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
