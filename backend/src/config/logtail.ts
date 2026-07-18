import pino from 'pino';
import { env } from './env.js';

let _logger: pino.Logger | null = null;

/**
 * Lazy-singleton structured logger (Phase 4 D-07 — Better Stack centralized
 * logging). Mirrors the lazy-singleton shape of `getStripe()` (CLAUDE.md
 * "Lazy SDK init" Critical Design Pattern).
 *
 * - Always emits to stdout (pino/file → fd 1) at the configured LOG_LEVEL.
 * - Adds the @logtail/pino transport when BETTER_STACK_TOKEN is present.
 *   When the token is missing, the logger gracefully falls back to stdout
 *   only (CLAUDE.md "Graceful external service stubs").
 *
 * `validateProductionEnv` (env.ts) refuses to start in production when
 * BETTER_STACK_TOKEN is unset, so the dev/test fallback is the only path
 * where the @logtail target is omitted.
 */
export function getLogger(): pino.Logger {
  if (_logger) return _logger;

  const targets: pino.TransportTargetOptions[] = [
    { target: 'pino/file', options: { destination: 1 }, level: env.LOG_LEVEL },
  ];

  if (env.BETTER_STACK_TOKEN) {
    targets.push({
      target: '@logtail/pino',
      options: {
        sourceToken: env.BETTER_STACK_TOKEN,
        options: {
          endpoint: env.BETTER_STACK_INGEST_URL ?? 'https://in.logs.betterstack.com',
        },
      },
      level: 'info',
    });
  }

  _logger = pino({
    level: env.LOG_LEVEL,
    transport: { targets },
    base: { service: 'sorcyn-api', env: env.NODE_ENV },
  });
  return _logger;
}

/**
 * Test-only reset hook so that vitest can re-init the logger when the env
 * changes between describe blocks. Production code never calls this.
 */
export function _resetLoggerForTests(): void {
  _logger = null;
}
