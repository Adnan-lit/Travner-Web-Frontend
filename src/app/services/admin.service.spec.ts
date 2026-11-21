import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  let service: AdminService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AdminService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('reads health and clears the cache through admin-only routes', () => {
    service.getSystemHealth().subscribe();
    const health = httpMock.expectOne('/api/admin/health');
    expect(health.request.method).toBe('GET');
    health.flush({ success: true, data: {} });

    service.clearCache().subscribe();
    const cache = httpMock.expectOne('/api/admin/system/cache/clear');
    expect(cache.request.method).toBe('POST');
    cache.flush({ success: true, data: { message: 'ok' } });
  });

  it('sends role updates to the dedicated role endpoint', () => {
    service.updateUserRole('u1', 'ADMIN').subscribe();

    const request = httpMock.expectOne('/api/admin/users/u1/role');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ role: 'ADMIN' });
    request.flush({ success: true, data: {} });
  });

  it('sends pagination, search and role filters to the admin users endpoint', () => {
    service.getUsers(2, 10, 'alice', 'ADMIN').subscribe();

    const request = httpMock.expectOne((r) => r.url === '/api/admin/users');
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('size')).toBe('10');
    expect(request.request.params.get('search')).toBe('alice');
    expect(request.request.params.get('role')).toBe('ADMIN');
    request.flush({ success: true, data: [] });
  });
});
