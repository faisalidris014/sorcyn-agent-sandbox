import * as Sentry from '@sentry/node';
import {
  httpIntegration,
  prismaIntegration,
  fastifyIntegration,
} from '@sentry/node';
import { env } from './env.js';

let initialized = false;

export function initSentry(): void {
  if (initialized || !env.SENTRY_DSN) {
    if (!env.SENTRY_DSN && env.NODE_ENV === 'production') {
      console.warn('[SENTRY] SENTRY_DSN not set — error tracking disabled');
    }
    return;
  }

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    // Phase 4 D-05 — Sentry Performance.
    // Pitfall 6 (RESEARCH.md): 0.1 (10%) at 1K DAU = ~300K traces/month, over
    // Team plan quota. Default to 0.05 (5%) in production; tunable via
    // SENTRY_TRACES_SAMPLE_RATE without code change.
    tracesSampleRate:
      env.NODE_ENV === 'production'
        ? (env.SENTRY_TRACES_SAMPLE_RATE ?? 0.05)
        : 1.0,
    integrations: [
      httpIntegration(),      // Stripe / Resend / R2 outbound spans
      prismaIntegration(),    // DB span breakdown
      fastifyIntegration(),   // Fastify route spans (v5+ uses fastifyIntegration; setupFastifyErrorHandler still wires error capture)
    ],
    beforeSend(event) {
      // Strip sensitive data
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }
      return event;
    },
  });

  initialized = true;
}

export function captureException(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  if (!initialized) {
    return;
  }

  Sentry.withScope((scope) => {
    if (context) {
      for (const [key, value] of Object.entries(context)) {
        scope.setExtra(key, value);
      }
    }
    Sentry.captureException(error);
  });
}
