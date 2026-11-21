import { logger } from './logger';

describe('logger', () => {
  it('redacts PII and credentials from string messages', () => {
    const spy = spyOn(console, 'error');

    logger.error('Failed for alice@example.com at https://api.example/user?token=abc 507f1f77bcf86cd799439011');

    const message = spy.calls.mostRecent().args.join(' ');
    expect(message).not.toContain('alice@example.com');
    expect(message).not.toContain('https://api.example');
    expect(message).not.toContain('507f1f77bcf86cd799439011');
    expect(message).toContain('[email]');
    expect(message).toContain('[url]');
    expect(message).toContain('[id]');
  });

  it('never forwards raw error objects or response bodies', () => {
    const spy = spyOn(console, 'error');
    const raw = { status: 500, code: 'INTERNAL', traceId: 'tr-1', password: 'secret', body: { email: 'a@b.co' } };

    logger.error('request.failed', raw, new Error('sensitive details'));

    const args = spy.calls.mostRecent().args as string[];
    expect(args.join(' ')).toContain('status=500 code=INTERNAL traceId=tr-1');
    expect(args.join(' ')).not.toContain('secret');
    expect(args.join(' ')).not.toContain('a@b.co');
    expect(args.join(' ')).not.toContain('sensitive details');
    expect(args[args.length - 1]).toBe('Error');
  });
});
