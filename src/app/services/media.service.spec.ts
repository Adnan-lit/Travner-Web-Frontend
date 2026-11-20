import { MediaService } from './media.service';

describe('MediaService.validateFile', () => {
  const service = new MediaService(null as any);

  function file(name: string, type: string, size: number): File {
    const f = new File(['x'], name, { type });
    Object.defineProperty(f, 'size', { value: size });
    return f;
  }

  it('accepts supported images and videos up to 20MB', () => {
    expect(service.validateFile(file('a.png', 'image/png', 1024)).valid).toBeTrue();
    expect(service.validateFile(file('a.mp4', 'video/mp4', 1024)).valid).toBeTrue();
    expect(service.validateFile(file('a.png', 'image/png', 20 * 1024 * 1024)).valid).toBeTrue();
  });

  it('rejects files above 20MB', () => {
    const result = service.validateFile(file('a.png', 'image/png', 20 * 1024 * 1024 + 1));
    expect(result.valid).toBeFalse();
    expect(result.error).toContain('20MB');
  });

  it('rejects unsupported types', () => {
    expect(service.validateFile(file('a.pdf', 'application/pdf', 10)).valid).toBeFalse();
  });
});
