import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { UserProfileComponent } from './user-profile.component';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/common.model';

describe('UserProfileComponent', () => {
  let fixture: ComponentFixture<UserProfileComponent>;
  let component: UserProfileComponent;
  let authService: jasmine.SpyObj<AuthService>;

  const user: User = {
    id: 'user-1',
    userName: 'alice_01',
    firstName: 'Alice',
    lastName: 'Example',
    email: 'alice@example.com',
    roles: ['USER']
  };

  beforeEach(async () => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', [
      'getCurrentUser', 'updateProfile'
    ], {
      currentUser$: of(user)
    });
    authService.getCurrentUser.and.returnValue(user);
    authService.updateProfile.and.returnValue(of({ success: true, data: user }));

    await TestBed.configureTestingModule({
      imports: [UserProfileComponent],
      providers: [{ provide: AuthService, useValue: authService }]
    }).compileComponents();

    fixture = TestBed.createComponent(UserProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('prefills the form from the current user', () => {
    expect(component.profileForm.controls.firstName.value).toBe('Alice');
    expect(component.profileForm.controls.email.value).toBe('alice@example.com');
  });

  it('submits trimmed profile fields', () => {
    component.profileForm.patchValue({
      firstName: '  Alicia ',
      lastName: ' Example ',
      bio: '  Loves trains  '
    });

    component.saveProfile();

    expect(authService.updateProfile).toHaveBeenCalledWith({
      firstName: 'Alicia',
      lastName: 'Example',
      email: 'alice@example.com',
      bio: 'Loves trains',
      location: undefined
    });
    expect(component.successMessage).toBe('Profile updated.');
  });

  it('shows a generic safe message when saving fails', () => {
    authService.updateProfile.and.returnValue(throwError(() => new Error('password=secret')));

    component.saveProfile();

    expect(component.errorMessage).toBe('Could not update your profile. Please try again.');
    expect(fixture.nativeElement.textContent).not.toContain('password=secret');
  });
});
