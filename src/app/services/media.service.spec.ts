import { configureRuntimeConfig, resetRuntimeConfig } from '../config/runtime.config';
import { MediaService } from './media.service';

describe('MediaService.validateFile', () => {
  const service = new MediaService(null as any);

  afterEach(() => resetRuntimeConfig());

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

  it('builds same-origin and configured media URLs', () => {
    expect(service.getMediaUrl('a.png')).toBe('/api/media/files/a.png');

    configureRuntimeConfig({ apiBaseUrl: 'https://preview.example' });
    const configured = new MediaService(null as any);

    expect(configured.getMediaUrl('a.png')).toBe('https://preview.example/api/media/files/a.png');
    expect(configured.getMediaUrlById('m1')).toBe('https://preview.example/api/media/m1');
  });
});
