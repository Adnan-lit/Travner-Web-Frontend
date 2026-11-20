import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { apiEnvelopeInterceptor } from './api-envelope.interceptor';

describe('apiEnvelopeInterceptor error contract', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiEnvelopeInterceptor])),
        provideHttpClientTesting()
      ]
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('passes backend error envelopes through with code and traceId intact', () => {
    let captured: any;
    http.get('/api/posts').subscribe({ error: err => captured = err });

    const request = httpMock.expectOne('/api/posts');
    request.flush(
      { success: false, code: 'FORBIDDEN', message: 'Access denied', traceId: 'req-42' },
      { status: 403, statusText: 'Forbidden' }
    );

    expect(captured.status).toBe(403);
    expect(captured.error.code).toBe('FORBIDDEN');
    expect(captured.error.traceId).toBe('req-42');
    expect(captured.error.message).toBe('Access denied');
  });

  it('carries the correlation header into non-envelope errors', () => {
    let captured: any;
    http.get('/api/broken').subscribe({ error: err => captured = err });

    const request = httpMock.expectOne('/api/broken');
    request.flush('boom', {
      status: 500,
      statusText: 'Server Error',
      headers: { 'X-Correlation-Id': 'generated-trace-id' }
    });

    expect(captured.error.success).toBeFalse();
    expect(captured.error.traceId).toBe('generated-trace-id');
    expect(captured.error.status).toBe(500);
  });

  it('wraps successful bare responses in the standard envelope', () => {
    let captured: any;
    http.get<{ data: string[] }>('/api/values').subscribe(value => captured = value);

    const request = httpMock.expectOne('/api/values');
    request.flush(['a', 'b']);

    expect(captured.success).toBeTrue();
    expect(captured.data).toEqual(['a', 'b']);
  });
});
