import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // Database
  DATABASE_URL: z.string().url(),
  DIRECT_DATABASE_URL: z.string().url().optional(), // Direct connection for migrations (bypasses pooler)

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('30d'),

  // Stripe
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_CONNECT_CLIENT_ID: z.string().optional(),

  // Payment-processor outage kill switch (RUNBOOK_OPS.md §2 / issue #84).
  // When true: payment-intent creation under the high-value threshold is queued
  // for retry, creation at/above the threshold is blocked (503), and all refunds
  // return 503. Flipped via env on both VPS nodes during an outage, then reloaded.
  STRIPE_DEGRADED: z.coerce.boolean().default(false),

  // Cloudflare R2
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().default('reverse-marketplace'),
  R2_PUBLIC_URL: z.string().optional(),

  // Resend (transactional email)
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().email().default('noreply@sorcyn.com'),
  RESEND_FROM_NAME: z.string().default('Sorcyn'),

  // Brand name used in user-facing copy (email subjects/bodies, etc.)
  BRAND_NAME: z.string().default('Sorcyn'),

  // Google Maps
  GOOGLE_MAPS_API_KEY: z.string().optional(),

  // AI
  GEMINI_API_KEY: z.string().optional(),

  // TX TDLR license verification (#337, seller category access Phase 3)
  // When enabled, the TDLR adapter is registered so electrical/hvac category
  // requests auto-decide via the Texas Open Data SODA API instead of queueing.
  // Off by default — explicit opt-in for production.
  TDLR_VERIFICATION_ENABLED: z.coerce.boolean().default(false),
  // Optional Socrata app token: 1000 req/hr vs a low shared per-IP throttle.
  TDLR_APP_TOKEN: z.string().optional(),

  // Stripe Connect
  STRIPE_CONNECT_RETURN_URL: z.string().min(1).default('reversemarket://seller/stripe/complete'),
  STRIPE_CONNECT_REFRESH_URL: z.string().min(1).default('reversemarket://seller/stripe/refresh'),

  // Firebase Cloud Messaging
  FCM_PROJECT_ID: z.string().optional(),
  FCM_CLIENT_EMAIL: z.string().optional(),
  FCM_PRIVATE_KEY: z.string().optional(),

  // Sentry
  SENTRY_DSN: z.string().url().optional(),

  // Sentry Performance (Phase 4 D-05)
  SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).optional(),

  // Better Stack centralized logging (Phase 4 D-07)
  BETTER_STACK_TOKEN: z.string().optional(),
  BETTER_STACK_INGEST_URL: z.string().url().optional(),

  // App URLs
  APP_URL: z.string().default('http://localhost:3000'),
  FRONTEND_URL: z.string().default('http://localhost:8080'),

  // Monitoring
  METRICS_TOKEN: z.string().optional(),

  // Feature flags
  ENABLE_SWAGGER: z.coerce.boolean().default(false),

  // Phase 4 D-08 — staging-only force-500 token gate
  TEST_FORCE_TOKEN: z.string().min(16).optional(),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment variables:');
    console.error(result.error.flatten().fieldErrors);
    process.exit(1);
  }
  return result.data;
}

export function validateProductionEnv(config: Env): void {
  if (config.NODE_ENV !== 'production') return;

  const warnings: string[] = [];
  const errors: string[] = [];

  if (!config.STRIPE_SECRET_KEY) errors.push('STRIPE_SECRET_KEY is required in production');
  if (!config.STRIPE_WEBHOOK_SECRET) errors.push('STRIPE_WEBHOOK_SECRET is required in production');

  if (!config.STRIPE_CONNECT_RETURN_URL || config.STRIPE_CONNECT_RETURN_URL === '') errors.push('STRIPE_CONNECT_RETURN_URL is required in production');
  if (config.STRIPE_CONNECT_RETURN_URL.startsWith('http://localhost')) errors.push('STRIPE_CONNECT_RETURN_URL still set to localhost — must be reversemarket:// deep-link in production');
  if (config.FRONTEND_URL === 'http://localhost:8080') errors.push('FRONTEND_URL still set to localhost — refusing to start in production');

  // Phase 4 D-07 — refuse start in production without centralized logging
  if (!config.BETTER_STACK_TOKEN) errors.push('BETTER_STACK_TOKEN is required in production');

  // Phase 4 D-08 — production must NOT carry a force-500 token (defense in depth)
  if (config.TEST_FORCE_TOKEN) errors.push('TEST_FORCE_TOKEN must NOT be set in production (staging-only)');

  if (!config.RESEND_API_KEY) warnings.push('RESEND_API_KEY not set — emails will be stubbed');
  if (!config.R2_ACCOUNT_ID) warnings.push('R2_ACCOUNT_ID not set — file uploads will fail');
  // #193 — when R2 is active, R2_PUBLIC_URL must be set or every uploaded image
  // URL is a dead link (the old bucket.r2.dev fallback is gone). Fail at boot.
  if (config.R2_ACCOUNT_ID && !config.R2_PUBLIC_URL) {
    errors.push('R2_PUBLIC_URL is required when R2_ACCOUNT_ID is set — without it, uploaded image/file URLs are dead links');
  }
  if (!config.FCM_PROJECT_ID) warnings.push('FCM_PROJECT_ID not set — push notifications will be stubbed');
  // Phase 4 D-05 — Sentry warn-only (DSN already optional; tracing simply disabled)
  if (!config.SENTRY_DSN) warnings.push('SENTRY_DSN not set — distributed tracing disabled');
  if (config.JWT_ACCESS_SECRET.length < 64) warnings.push('JWT_ACCESS_SECRET should be at least 64 characters in production');

  for (const w of warnings) console.warn(`[ENV WARNING] ${w}`);
  if (errors.length > 0) {
    for (const e of errors) console.error(`[ENV ERROR] ${e}`);
    process.exit(1);
  }
}

const env = loadEnv();
validateProductionEnv(env);
export { env };
