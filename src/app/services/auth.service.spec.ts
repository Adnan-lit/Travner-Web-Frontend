import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { apiEnvelopeInterceptor } from '../core/http/api-envelope.interceptor';
import { AuthService } from './auth.service';

describe('AuthService (bearer + refresh cookie)', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: jasmine.SpyObj<Router>;
  let storageSpy: jasmine.Spy<typeof localStorage.setItem>;

  const authResponse = {
    accessToken: 'access-1',
    tokenType: 'Bearer',
    expiresIn: 900,
    user: { id: '507f1f77bcf86cd799439011', username: 'alice', roles: ['USER'] },
  };

  beforeEach(() => {
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    storageSpy = spyOn(localStorage, 'setItem').and.callThrough();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiEnvelopeInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: router },
      ],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('does not expose placeholder password-reset stubs', () => {
    expect((service as any).requestPasswordReset).toBeUndefined();
    expect((service as any).resetPasswordWithToken).toBeUndefined();
  });

  it('logs in with credentials in the body and keeps the token in memory only', () => {
    service.login('Alice', 'pw').subscribe();

    const request = httpMock.expectOne('/api/auth/login');
    expect(request.request.withCredentials).toBe(true);
    expect(request.request.body).toEqual({ username: 'alice', password: 'pw' });
    request.flush({ success: true, data: authResponse });

    expect(service.getAccessToken()).toBe('access-1');
    expect(service.getToken()).toBe('access-1');
    expect(service.isAuthenticated()).toBe(true);
    expect(service.getCurrentUser()?.userName).toBe('alice');
    expect(storageSpy).not.toHaveBeenCalled();
  });

  it('does not expose raw backend messages in authentication errors', () => {
    let message = '';
    service.login('alice', 'pw').subscribe({
      error: (error: Error) => (message = error.message),
    });

    httpMock.expectOne('/api/auth/login').flush({ success: false, message: 'SECRET-BACKEND-DETAIL', data: null });

    expect(message).toBe('Invalid username or password');
    expect(message).not.toContain('SECRET-BACKEND-DETAIL');
  });

  it('shares a single refresh request across parallel callers', () => {
    service.refresh().subscribe();
    service.refresh().subscribe();

    const requests = httpMock.match('/api/auth/refresh');
    expect(requests.length).toBe(1);
    expect(requests[0].request.withCredentials).toBe(true);
    requests[0].flush({ success: true, data: authResponse });

    expect(service.getAccessToken()).toBe('access-1');
  });

  it('revokes the refresh cookie and clears state on logout', () => {
    service.login('alice', 'pw').subscribe();
    httpMock.expectOne('/api/auth/login').flush({ success: true, data: authResponse });
    expect(service.getAccessToken()).toBe('access-1');

    service.logout();

    const request = httpMock.expectOne('/api/auth/logout');
    expect(request.request.withCredentials).toBe(true);
    request.flush(null, { status: 204, statusText: 'No Content' });
    expect(service.getAccessToken()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/signin']);
  });

  it('normalizes a failed startup refresh into an anonymous session', () => {
    service.initializeSession().subscribe((restored) => expect(restored).toBe(false));

    httpMock.expectOne('/api/auth/refresh').flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(service.getAccessToken()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('trims and lowercases the username on login', () => {
    service.login('  Alice  ', 'pw').subscribe();

    const request = httpMock.expectOne('/api/auth/login');
    expect(request.request.body).toEqual({ username: 'alice', password: 'pw' });
    request.flush({ success: true, data: authResponse });
  });

  it('trims and lowercases username and email on signup', () => {
    service
      .signup({
        userName: '  Alice  ',
        firstName: 'Alice',
        lastName: 'Example',
        email: '  Alice@Example.COM ',
        password: 'pw',
      })
      .subscribe();

    const request = httpMock.expectOne('/api/public/register');
    expect(request.request.body.userName).toBe('alice');
    expect(request.request.body.email).toBe('alice@example.com');
    request.flush({ success: true, data: {} });
  });

  it('normalizes the username before the availability check', () => {
    service.checkUsername('  Alice  ').subscribe();

    httpMock.expectOne('/api/public/check-username/alice').flush({ success: true, data: { available: true } });
  });
});
