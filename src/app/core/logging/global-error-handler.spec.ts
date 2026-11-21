import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService } from '../../services/toast.service';
import { GlobalErrorHandler, isToasted } from './global-error-handler';

describe('GlobalErrorHandler', () => {
  let handler: GlobalErrorHandler;
  let toast: jasmine.SpyObj<ToastService>;

  beforeEach(() => {
    toast = jasmine.createSpyObj<ToastService>('ToastService', ['showGlobalError']);
    TestBed.configureTestingModule({
      providers: [GlobalErrorHandler, { provide: ToastService, useValue: toast }],
    });
    handler = TestBed.inject(GlobalErrorHandler);
  });

  it('logs only stable metadata and shows one generic toast', async () => {
    const spy = spyOn(console, 'error');
    const error = new HttpErrorResponse({
      status: 500,
      error: { code: 'INTERNAL', traceId: 'tr-1', message: 'alice@example.com failed' },
    });

    handler.handleError(error);
    await Promise.resolve();

    expect(spy.calls.mostRecent().args.join(' ')).toContain('status=500 code=INTERNAL traceId=tr-1');
    expect(spy.calls.mostRecent().args.join(' ')).not.toContain('alice@example.com');
    expect(toast.showGlobalError).toHaveBeenCalledTimes(1);
    expect(isToasted(error)).toBeTrue();
  });

  it('does not toast the same failure twice', async () => {
    const error = new Error('already shown');

    handler.handleError(error);
    handler.handleError(error);
    await Promise.resolve();

    expect(toast.showGlobalError).toHaveBeenCalledTimes(1);
  });
});
