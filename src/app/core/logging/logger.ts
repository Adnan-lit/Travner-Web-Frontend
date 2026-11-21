/* eslint-disable no-console -- this is the only module allowed to touch the console. */
import { isDevMode } from '@angular/core';

/**
 * Gated logger. Debug/info output is development-only; warn/error output is
 * allowed in production but accepts only stable, sanitized values. Raw errors,
 * response bodies, URLs, headers, tokens and user data are never forwarded.
 */
function inDevMode(): boolean {
  try {
    return isDevMode();
  } catch {
    return false;
  }
}

/** Strip values that commonly carry PII or credentials out of a message. */
function redact(message: string): string {
  return message
    .replace(/https?:\/\/\S+/gi, '[url]')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
    .replace(/Bearer\s+\S+/gi, 'Bearer [redacted]')
    .replace(/\b[0-9a-f]{24}\b/gi, '[id]')
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '[id]');
}

function description(value: unknown): string {
  if (typeof value === 'string') {
    const safe = redact(value);
    return safe.length > 200 ? `${safe.slice(0, 200)}…` : safe;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (value instanceof Error) {
    return value.name;
  }
  if (value && typeof value === 'object') {
    const candidate = value as { status?: unknown; code?: unknown; traceId?: unknown };
    const parts: string[] = [];
    if (typeof candidate.status === 'number') {
      parts.push(`status=${candidate.status}`);
    }
    if (typeof candidate.code === 'string') {
      parts.push(`code=${candidate.code}`);
    }
    if (typeof candidate.traceId === 'string') {
      parts.push(`traceId=${candidate.traceId}`);
    }
    return parts.length ? parts.join(' ') : '[redacted]';
  }
  return '[redacted]';
}

function sanitized(args: unknown[]): string[] {
  return args.filter((arg) => arg !== undefined && arg !== null).map(description);
}

export const logger = {
  debug(...args: unknown[]): void {
    if (inDevMode()) {
      console.log(...sanitized(args));
    }
  },
  info(...args: unknown[]): void {
    if (inDevMode()) {
      console.info(...sanitized(args));
    }
  },
  warn(...args: unknown[]): void {
    console.warn(...sanitized(args));
  },
  error(...args: unknown[]): void {
    console.error(...sanitized(args));
  },
};
