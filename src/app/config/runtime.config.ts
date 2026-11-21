/**
 * Runtime API configuration.
 *
 * The app uses same-origin `/api` and `/ws` by default, letting the Vercel
 * rewrites forward requests to the backend configured by `BACKEND_URL`.
 * Preview deployments can override the prefixes in `/assets/config.json`;
 * no hostname is compiled into the bundle.
 */
export interface RuntimeConfig {
  /** Origin prefix added before endpoint paths such as `/api/auth/login`. */
  apiBaseUrl: string;
  /** SockJS handshake URL. Defaults to `${apiBaseUrl}/ws`. */
  wsUrl: string;
}

export const RUNTIME_CONFIG_URL = '/assets/config.json';

const DEFAULT_CONFIG: Readonly<RuntimeConfig> = Object.freeze({
  apiBaseUrl: '',
  wsUrl: '/ws',
});

let currentConfig: RuntimeConfig = { ...DEFAULT_CONFIG };

/** Current API origin prefix. Empty means same-origin. */
export function getApiBaseUrl(): string {
  return currentConfig.apiBaseUrl;
}

/** Current SockJS URL. */
export function getWebSocketUrl(): string {
  return currentConfig.wsUrl;
}

/** Override the runtime config, e.g. from `/assets/config.json` or a test. */
export function configureRuntimeConfig(partial?: Partial<RuntimeConfig> | null): RuntimeConfig {
  currentConfig = normalize(partial);
  return { ...currentConfig };
}

/** Restore same-origin defaults. */
export function resetRuntimeConfig(): void {
  currentConfig = { ...DEFAULT_CONFIG };
}

/**
 * Fetch the deployment's config before the app initializers construct any
 * services. A missing/invalid file leaves same-origin routing in effect.
 */
export async function loadRuntimeConfig(fetchFn: typeof fetch = fetch): Promise<RuntimeConfig> {
  try {
    const response = await fetchFn(RUNTIME_CONFIG_URL, { cache: 'no-store' });
    if (response.ok) {
      currentConfig = normalize((await response.json()) as Partial<RuntimeConfig>);
      return { ...currentConfig };
    }
  } catch {
    // Fall through to the same-origin defaults.
  }

  resetRuntimeConfig();
  return { ...currentConfig };
}

function normalize(partial?: Partial<RuntimeConfig> | null): RuntimeConfig {
  const apiBaseUrl = normalizePrefix(partial?.apiBaseUrl);
  const wsUrl = normalizePrefix(partial?.wsUrl) || `${apiBaseUrl}/ws`;
  return { apiBaseUrl, wsUrl };
}

function normalizePrefix(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }
  const trimmed = value.trim();
  return trimmed === '/' ? '' : trimmed.replace(/\/+$/, '');
}
