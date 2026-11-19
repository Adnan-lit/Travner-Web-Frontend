import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { apiEnvelopeInterceptor } from './api-envelope.interceptor';
import { authTokenInterceptor } from './auth-token.interceptor';

describe('authTokenInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let auth: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    auth = jasmine.createSpyObj<AuthService>('AuthService',
      ['getAccessToken', 'refresh', 'logout'],
      { accessToken$: of(null) });
    auth.getAccessToken.and.returnValue('old-token');
    auth.refresh.and.returnValue(of({} as any));

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiEnvelopeInterceptor, authTokenInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: auth }
      ]
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('attaches a bearer token to protected API calls', () => {
    http.post('/api/posts', {}).subscribe();

    const request = httpMock.expectOne('/api/posts');
    expect(request.request.headers.get('Authorization')).toBe('Bearer old-token');
    request.flush({});
  });

  it('never attaches a Basic header or token to login/refresh', () => {
    http.post('/api/auth/login', { username: 'alice', password: 'pw' }).subscribe();

    const request = httpMock.expectOne('/api/auth/login');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
  });

  it('skips public GETs', () => {
    http.get('/api/posts').subscribe();

    const request = httpMock.expectOne('/api/posts');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush([]);
  });

  it('refreshes once, retries with the new token and stays logged in', () => {
    auth.getAccessToken.and.returnValues('old-token', 'new-token');
    http.post('/api/posts', {}).subscribe();

    const first = httpMock.expectOne('/api/posts');
    expect(first.request.headers.get('Authorization')).toBe('Bearer old-token');
    first.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(auth.refresh).toHaveBeenCalledTimes(1);
    const retry = httpMock.expectOne('/api/posts');
    expect(retry.request.headers.get('Authorization')).toBe('Bearer new-token');
    retry.flush({});
    expect(auth.logout).not.toHaveBeenCalled();
  });

  it('logs out when the refresh fails instead of retrying forever', () => {
    auth.refresh.and.returnValue(throwError(() => new Error('expired')));
    http.post('/api/posts', {}).subscribe({ error: () => undefined });

    const request = httpMock.expectOne('/api/posts');
    request.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(auth.refresh).toHaveBeenCalledTimes(1);
    expect(auth.logout).toHaveBeenCalledTimes(1);
    httpMock.expectNone('/api/posts');
  });

  it('does not refresh on non-401 errors', () => {
    http.post('/api/posts', {}).subscribe({ error: () => undefined });

    const request = httpMock.expectOne('/api/posts');
    request.flush('Forbidden', { status: 403, statusText: 'Forbidden' });

    expect(auth.refresh).not.toHaveBeenCalled();
  });
});
