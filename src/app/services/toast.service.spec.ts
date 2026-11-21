import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  it('never renders raw API or exception messages', () => {
    const id = service.showApiError({
      status: 500,
      error: { message: 'alice@example.com / internal/sql detail' },
    } as any);

    const toast = service.getToasts().find((t) => t.id === id);
    expect(toast?.message).not.toContain('alice@example.com');
    expect(toast?.message).not.toContain('internal/sql');
    expect(toast?.message).toBe('Something went wrong. Please try again.');
  });

  it('maps status codes to generic user-facing messages', () => {
    const id = service.showApiError({ status: 401 });
    expect(service.getToasts().find((t) => t.id === id)?.message).toContain('session has expired');
  });
});
