/**
 * Unit tier — pure verification helpers (#382).
 *
 * tests/unit/ → no DB/Redis/network. Exercises deriveCredentialStatus and
 * startOfDayUTC from src/common/utils/verification.ts.
 */
import { describe, it, expect } from 'vitest';
import {
  deriveCredentialStatus,
  startOfDayUTC,
} from '../../src/common/utils/verification.js';

const NOW = new Date('2026-07-15T15:30:00.000Z'); // mid-afternoon UTC

describe('startOfDayUTC', () => {
  it('truncates to UTC midnight regardless of time-of-day', () => {
    expect(startOfDayUTC(NOW).toISOString()).toBe('2026-07-15T00:00:00.000Z');
  });

  it('is idempotent on an already-midnight date', () => {
    const midnight = new Date('2026-07-15T00:00:00.000Z');
    expect(startOfDayUTC(midnight).getTime()).toBe(midnight.getTime());
  });
});

describe('deriveCredentialStatus (#382)', () => {
  it('returns null for a never-earned credential', () => {
    expect(deriveCredentialStatus(false, null, null, NOW)).toBeNull();
  });

  it('returns "verified" when verified with no expiry on file', () => {
    expect(deriveCredentialStatus(true, null, 'approved', NOW)).toBe('verified');
  });

  it('returns "verified" for a far-future expiry', () => {
    const expiry = new Date('2028-01-01T00:00:00.000Z');
    expect(deriveCredentialStatus(true, expiry, 'approved', NOW)).toBe('verified');
  });

  it('returns "expiring" within the default 30-day window', () => {
    const expiry = new Date('2026-08-01T00:00:00.000Z'); // 17 days out
    expect(deriveCredentialStatus(true, expiry, 'approved', NOW)).toBe('expiring');
  });

  it('treats an expiry exactly on the window edge as "expiring"', () => {
    const expiry = new Date('2026-08-14T00:00:00.000Z'); // exactly 30 days out
    expect(deriveCredentialStatus(true, expiry, 'approved', NOW)).toBe('expiring');
  });

  it('treats today (day-granular) as still valid, not expired', () => {
    const expiry = new Date('2026-07-15T00:00:00.000Z'); // today at UTC midnight
    // now is 15:30 UTC same day — must NOT read as expired (off-by-one guard).
    expect(deriveCredentialStatus(true, expiry, 'approved', NOW)).toBe('expiring');
  });

  it('returns "expired" once the expiry day has fully passed', () => {
    const expiry = new Date('2026-07-14T00:00:00.000Z'); // yesterday
    expect(deriveCredentialStatus(true, expiry, 'approved', NOW)).toBe('expired');
  });

  it('returns "expired" (renew) when the sweep flipped the boolean false but the request is expired', () => {
    // The lapse sweep sets boolean=false AND request status='expired'. Reading
    // only the boolean would render this as null ("never earned") — wrong.
    expect(deriveCredentialStatus(false, null, 'expired', NOW)).toBe('expired');
  });

  it('honours a custom window', () => {
    const expiry = new Date('2026-07-25T00:00:00.000Z'); // 10 days out
    expect(deriveCredentialStatus(true, expiry, 'approved', NOW, 7)).toBe('verified');
    expect(deriveCredentialStatus(true, expiry, 'approved', NOW, 14)).toBe('expiring');
  });
});
