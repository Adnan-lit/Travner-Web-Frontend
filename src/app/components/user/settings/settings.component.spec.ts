import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { SettingsComponent } from './settings.component';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/common.model';

describe('SettingsComponent', () => {
  let fixture: ComponentFixture<SettingsComponent>;
  let component: SettingsComponent;
  let authService: jasmine.SpyObj<AuthService>;

  const user: User = {
    id: 'user-1',
    userName: 'alice_01',
    roles: ['USER']
  };

  beforeEach(async () => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', [
      'getCurrentUser', 'changePassword', 'logout'
    ]);
    authService.getCurrentUser.and.returnValue(user);
    authService.changePassword.and.returnValue(of({ success: true, data: { message: 'Password changed' } }));

    await TestBed.configureTestingModule({
      imports: [SettingsComponent],
      providers: [{ provide: AuthService, useValue: authService }]
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('changes the password and clears the form', () => {
    component.passwordForm.patchValue({
      currentPassword: 'old-password',
      newPassword: 'new-password',
      confirmPassword: 'new-password'
    });

    component.changePassword();

    expect(authService.changePassword).toHaveBeenCalledWith('old-password', 'new-password');
    expect(component.passwordForm.controls.currentPassword.value).toBeNull();
    expect(component.successMessage).toBe('Password changed.');
  });

  it('rejects mismatched new passwords without calling the service', () => {
    component.passwordForm.patchValue({
      currentPassword: 'old-password',
      newPassword: 'new-password',
      confirmPassword: 'different-password'
    });

    component.changePassword();

    expect(authService.changePassword).not.toHaveBeenCalled();
    expect(component.errorMessage).toBe('The new passwords do not match.');
  });

  it('shows a generic safe message when password change fails', () => {
    authService.changePassword.and.returnValue(throwError(() => new Error('token=secret')));
    component.passwordForm.patchValue({
      currentPassword: 'old-password',
      newPassword: 'new-password',
      confirmPassword: 'new-password'
    });

    component.changePassword();

    expect(component.errorMessage).toBe('Could not change your password. Please try again.');
    expect(fixture.nativeElement.textContent).not.toContain('token=secret');
  });

  it('signs out through the auth service', () => {
    component.signOut();

    expect(authService.logout).toHaveBeenCalled();
  });
});
