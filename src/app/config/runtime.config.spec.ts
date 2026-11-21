import {
  RUNTIME_CONFIG_URL,
  configureRuntimeConfig,
  getApiBaseUrl,
  getWebSocketUrl,
  loadRuntimeConfig,
  resetRuntimeConfig,
} from './runtime.config';

describe('runtime.config', () => {
  afterEach(() => resetRuntimeConfig());

  it('defaults to same-origin API and WebSocket URLs', () => {
    resetRuntimeConfig();
    expect(getApiBaseUrl()).toBe('');
    expect(getWebSocketUrl()).toBe('/ws');
  });

  it('normalizes configured prefixes and derives the WebSocket URL', () => {
    configureRuntimeConfig({
      apiBaseUrl: 'https://preview.example/api/',
      wsUrl: 'wss://preview.example/socket/',
    });
    expect(getApiBaseUrl()).toBe('https://preview.example/api');
    expect(getWebSocketUrl()).toBe('wss://preview.example/socket');

    configureRuntimeConfig({ apiBaseUrl: 'https://preview.example/' });
    expect(getWebSocketUrl()).toBe('https://preview.example/ws');
  });

  it('loads deployment config with caching disabled', async () => {
    const json = jasmine.createSpy('json').and.returnValue(Promise.resolve({ apiBaseUrl: 'https://preview.example' }));
    const fetchSpy = jasmine
      .createSpy('fetch')
      .and.returnValue(Promise.resolve({ ok: true, json } as unknown as Response));

    const config = await loadRuntimeConfig(fetchSpy as unknown as typeof fetch);

    expect(fetchSpy).toHaveBeenCalledWith(RUNTIME_CONFIG_URL, { cache: 'no-store' });
    expect(config).toEqual({ apiBaseUrl: 'https://preview.example', wsUrl: 'https://preview.example/ws' });
    expect(getApiBaseUrl()).toBe('https://preview.example');
  });

  it('falls back to same-origin when the config request fails', async () => {
    configureRuntimeConfig({ apiBaseUrl: 'https://stale.example' });
    const fetchSpy = jasmine.createSpy('fetch').and.returnValue(Promise.reject(new Error('offline')));

    const config = await loadRuntimeConfig(fetchSpy as unknown as typeof fetch);

    expect(config).toEqual({ apiBaseUrl: '', wsUrl: '/ws' });
    expect(getApiBaseUrl()).toBe('');
    expect(getWebSocketUrl()).toBe('/ws');
  });

  it('falls back to same-origin on a non-OK config response', async () => {
    configureRuntimeConfig({ apiBaseUrl: 'https://stale.example' });
    const fetchSpy = jasmine.createSpy('fetch').and.returnValue(Promise.resolve({ ok: false } as Response));

    const config = await loadRuntimeConfig(fetchSpy as unknown as typeof fetch);

    expect(config).toEqual({ apiBaseUrl: '', wsUrl: '/ws' });
    expect(getApiBaseUrl()).toBe('');
    expect(getWebSocketUrl()).toBe('/ws');
  });
});
