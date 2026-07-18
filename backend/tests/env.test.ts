import { describe, it, expect, vi, afterEach } from 'vitest';
import { validateProductionEnv } from '../src/config/env.js';
import type { Env } from '../src/config/env.js';

// Shared minimal production-valid env fixture (no localhost, no unset Stripe URL)
const baseProductionEnv: Env = {
  PORT: 3000,
  HOST: '0.0.0.0',
  NODE_ENV: 'production',
  LOG_LEVEL: 'info',
  DATABASE_URL: 'postgresql://user:pass@db.example.com:5432/prod',
  REDIS_URL: 'redis://redis.example.com:6379',
  JWT_ACCESS_SECRET: 'a'.repeat(64),
  JWT_REFRESH_SECRET: 'b'.repeat(64),
  JWT_ACCESS_EXPIRY: '15m',
  JWT_REFRESH_EXPIRY: '30d',
  STRIPE_SECRET_KEY: 'sk_live_abc',
  STRIPE_WEBHOOK_SECRET: 'whsec_abc',
  STRIPE_CONNECT_RETURN_URL: 'reversemarket://seller/stripe/complete',
  STRIPE_CONNECT_REFRESH_URL: 'reversemarket://seller/stripe/refresh',
  R2_BUCKET_NAME: 'reverse-marketplace',
  RESEND_FROM_EMAIL: 'noreply@sorcyn.com',
  RESEND_FROM_NAME: 'Sorcyn',
  APP_URL: 'http://app.example.com:3000',
  FRONTEND_URL: 'https://app.example.com',
  ENABLE_SWAGGER: false,
  BETTER_STACK_TOKEN: 'logs_test_token',
};

describe('validateProductionEnv', () => {
  let exitSpy: ReturnType<typeof vi.spyOn>;
  let stderrSpy: ReturnType<typeof vi.spyOn>;

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not call process.exit when NODE_ENV is test', () => {
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    stderrSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    validateProductionEnv({ ...baseProductionEnv, NODE_ENV: 'test' });

    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('does not call process.exit when NODE_ENV is development', () => {
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    stderrSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    validateProductionEnv({ ...baseProductionEnv, NODE_ENV: 'development' });

    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('exits with code 1 when STRIPE_CONNECT_RETURN_URL is missing in production', () => {
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    stderrSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Simulate unset: value is the default deep-link but the field itself is
    // technically always set because of the Zod default. The check is on
    // FRONTEND_URL still being localhost AND STRIPE_CONNECT_RETURN_URL unset.
    // To test the "required" guard we pass an empty string (edge case).
    validateProductionEnv({
      ...baseProductionEnv,
      // Cast to bypass TS type for the empty-string edge case
      STRIPE_CONNECT_RETURN_URL: '' as unknown as string,
    });

    expect(exitSpy).toHaveBeenCalledWith(1);
    const errorCalls = stderrSpy.mock.calls.map((c) => c[0] as string);
    expect(errorCalls.some((msg) => msg.includes('STRIPE_CONNECT_RETURN_URL'))).toBe(true);
  });

  it('exits with code 1 when FRONTEND_URL is localhost in production', () => {
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    stderrSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    validateProductionEnv({
      ...baseProductionEnv,
      FRONTEND_URL: 'http://localhost:8080',
    });

    expect(exitSpy).toHaveBeenCalledWith(1);
    const errorCalls = stderrSpy.mock.calls.map((c) => c[0] as string);
    expect(errorCalls.some((msg) => msg.includes('FRONTEND_URL'))).toBe(true);
  });

  it('succeeds in production when STRIPE_CONNECT_RETURN_URL is the reversemarket deep-link', () => {
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    stderrSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    validateProductionEnv({
      ...baseProductionEnv,
      STRIPE_CONNECT_RETURN_URL: 'reversemarket://seller/stripe/complete',
      FRONTEND_URL: 'https://app.sorcyn.com',
    });

    expect(exitSpy).not.toHaveBeenCalled();
  });
});
