import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AdminSettingsComponent } from './admin-settings.component';
import { AdminService } from '../../../services/admin.service';

describe('AdminSettingsComponent', () => {
  let fixture: ComponentFixture<AdminSettingsComponent>;
  let component: AdminSettingsComponent;
  let adminService: jasmine.SpyObj<AdminService>;

  beforeEach(async () => {
    adminService = jasmine.createSpyObj<AdminService>('AdminService', ['getSystemHealth', 'clearCache']);
    adminService.getSystemHealth.and.returnValue(
      of({
        success: true,
        data: {
          status: 'UP',
          database: true,
          storage: true,
          cache: true,
          uptime: 3720,
          version: '1.0.0',
        },
      }),
    );
    adminService.clearCache.and.returnValue(of({ success: true, data: { message: 'Cache cleared' } }));

    await TestBed.configureTestingModule({
      imports: [AdminSettingsComponent],
      providers: [{ provide: AdminService, useValue: adminService }],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads and renders system health', () => {
    expect(adminService.getSystemHealth).toHaveBeenCalled();
    expect(component.health?.status).toBe('UP');
    expect(fixture.nativeElement.textContent).toContain('Connected');
    expect(component.formatUptime(3720)).toBe('1h 2m');
  });

  it('clears the cache and refreshes health', () => {
    component.clearCache();

    expect(adminService.clearCache).toHaveBeenCalled();
    expect(component.successMessage).toBe('Cache cleared');
    expect(adminService.getSystemHealth).toHaveBeenCalledTimes(2);
  });

  it('shows a generic safe message when health loading fails', () => {
    adminService.getSystemHealth.and.returnValue(throwError(() => new Error('connection string=secret')));

    component.loadHealth();

    expect(component.errorMessage).toBe('Could not load system health. Please try again.');
    expect(fixture.nativeElement.textContent).not.toContain('connection string=secret');
  });
});
