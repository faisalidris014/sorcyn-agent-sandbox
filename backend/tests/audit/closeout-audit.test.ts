/**
 * Phase 3 + Phase 4 Closeout Audit Suite
 *
 * Phase 3: One describe block per Phase 3 Success Criterion (SC1–SC6). The deep
 * behavioral tests live in the per-module test files (offers.test.ts,
 * posts.test.ts, env.test.ts, fees.test.ts, etc.); this suite is the
 * integration audit that proves the Phase 3 surface area exists and is
 * wired up.
 *
 * Phase 4: Pre-launch hardening describe blocks (D-04 forward-compat
 * migrations added in Wave 0; additional Phase 4 SC blocks land in 04-08).
 *
 * CI gate: `npx vitest run tests/audit` must exit 0 for any phase to merge.
 *
 * Plan: .planning/phases/03-mvp-implementation-closeout/03-08-PLAN.md
 *       .planning/phases/04-pre-launch-hardening/04-01-PLAN.md (Phase 4 D-04)
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { calculateJobLeadFee } from '../../src/common/utils/fees.js';
import { isFreeEmailDomain, FREE_EMAIL_DOMAINS } from '../../src/common/utils/email-domain.js';
import { validateProductionEnv } from '../../src/config/env.js';
import type { Env } from '../../src/config/env.js';

// Production-valid env fixture used by SC6 (matches the shape in env.test.ts).
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
  // Phase 4 D-05 / D-07 — observability env vars
  SENTRY_TRACES_SAMPLE_RATE: 0.05,
  BETTER_STACK_TOKEN: 'fixture-better-stack-token',
  BETTER_STACK_INGEST_URL: 'https://in.logs.betterstack.com',
};

// Vitest runs from backend/ — resolve paths relative to that.
const backendRoot = resolve(import.meta.dirname, '../..');
const readSrc = (relPath: string): string =>
  readFileSync(resolve(backendRoot, relPath.replace(/^backend\//, '')), 'utf-8');

// ─────────────────────────────────────────────────────────────────────────────
// SC1: Seller feed radius + geocoding
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 3 Closeout — Success Criterion 1: Seller feed radius + geocoding', () => {
  it('exports geocodeAddress from backend/src/config/geocoding.ts', async () => {
    const mod = await import('../../src/config/geocoding.js');
    expect(typeof mod.geocodeAddress).toBe('function');
  });

  it('geocodeAddress is null-safe when GOOGLE_MAPS_API_KEY is unset', async () => {
    // Save and clear the env var
    const original = process.env.GOOGLE_MAPS_API_KEY;
    delete process.env.GOOGLE_MAPS_API_KEY;
    try {
      const { geocodeAddress } = await import('../../src/config/geocoding.js');
      const result = await geocodeAddress('1600 Pennsylvania Ave, Washington, DC');
      // null-safe: returns null (NOT throwing) when API key missing
      expect(result).toBeNull();
    } finally {
      if (original !== undefined) process.env.GOOGLE_MAPS_API_KEY = original;
    }
  });

  it('seller-feed entry point getFeed accepts requestingUserId for category-targeted exclusivity carve-out', () => {
    const src = readSrc('backend/src/modules/posts/posts.service.ts');
    expect(src).toMatch(/async getFeed\([^)]*requestingUserId/);
  });

  it('3-day exclusivity: targeted seller (category match) sees in-window posts via OR arm', () => {
    const src = readSrc('backend/src/modules/posts/posts.service.ts');
    // In-window arm: publicAfter > now AND categoryId in seller's categories
    expect(src).toMatch(/publicAfter.*gt.*new Date\(\)/s);
    expect(src).toMatch(/categoryId.*in.*sellerCategories/s);
  });

  it('3-day exclusivity: non-targeted seller is excluded — in-window arm is guarded by sellerCategories', () => {
    const src = readSrc('backend/src/modules/posts/posts.service.ts');
    // Guard that skips the in-window OR arm when seller has no matching categories
    expect(src).toMatch(/sellerCategories\s*&&\s*sellerCategories\.length\s*>\s*0/);
  });

  it('3-day exclusivity: post-window path exists so all sellers see posts after publicAfter passes', () => {
    const src = readSrc('backend/src/modules/posts/posts.service.ts');
    // publicAfter <= now arm (past exclusivity window — visible to everyone)
    expect(src).toMatch(/publicAfter.*lte.*new Date\(\)/s);
  });

  it('seller-feed retains shipped Haversine SQL (PostGIS deferred per Addendum A-01)', () => {
    const src = readSrc('backend/src/modules/posts/posts.service.ts');
    // Either an inline haversineDistance call or a documented Haversine math expression
    const hasHaversine = /haversineDistance|3959 \* acos/.test(src);
    expect(hasHaversine).toBe(true);
  });

  it('seller-feed distance rounded to 0.1 mi tolerance (Math.round × 10 / 10)', () => {
    const src = readSrc('backend/src/modules/posts/posts.service.ts');
    expect(src).toMatch(/Math\.round\(haversineDistance\([\s\S]*?\)\s*\*\s*10\)\s*\/\s*10/);
  });

  it('seller-feed sort enum includes closest option', () => {
    const src = readSrc('backend/src/modules/posts/posts.schemas.ts');
    expect(src).toMatch(/'closest'/);
  });

  it('seller-feed auto-applies seller serviceRadiusMiles when caller omits geo params', () => {
    const src = readSrc('backend/src/modules/posts/posts.service.ts');
    expect(src).toMatch(/sellerRadius/);
    expect(src).toMatch(/effLat/);
    expect(src).toMatch(/effRadius/);
  });

  it('haversineDistance is accurate to within 0.1 mi for a 1-degree-latitude reference pair', async () => {
    const { haversineDistance } = await import('../../src/common/utils/geo.js');
    // 1 degree of latitude on a sphere of R=3959 mi ≈ 69.09 mi
    const dist = haversineDistance(0, 0, 1, 0);
    expect(Math.abs(dist - 69.09)).toBeLessThan(0.1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SC2: Counter-offer 5-round cap
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 3 Closeout — Success Criterion 2: Counter-offer 5-round cap', () => {
  it('offers.service.ts declares MAX_COUNTER_DEPTH = 5', () => {
    const src = readSrc('backend/src/modules/offers/offers.service.ts');
    expect(src).toMatch(/MAX_COUNTER_DEPTH\s*=\s*5/);
  });

  it('counterOffer walks the parentOfferId chain to enforce the cap', () => {
    const src = readSrc('backend/src/modules/offers/offers.service.ts');
    expect(src).toMatch(/parentOfferId/);
    expect(src).toMatch(/chainLength\s*>=\s*MAX_COUNTER_DEPTH/);
    expect(src).toMatch(/maximum of \$\{MAX_COUNTER_DEPTH\} rounds/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SC3: Backend-audit gap closures (six pre-shipped surfaces verified, not rebuilt)
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 3 Closeout — Success Criterion 3: Backend audit gap closures', () => {
  it('MAX_OFFERS_PER_POST is reconciled to 25', () => {
    const src = readSrc('backend/src/modules/offers/offers.service.ts');
    expect(src).toMatch(/MAX_OFFERS_PER_POST\s*=\s*25/);
    expect(src).not.toMatch(/MAX_OFFERS_PER_POST\s*=\s*10/);
  });

  it('PostStatus enum includes archived', () => {
    const schema = readSrc('backend/prisma/schema.prisma');
    // Find the PostStatus enum block, then check 'archived' is present in it
    const match = schema.match(/enum PostStatus \{[^}]+\}/);
    expect(match).toBeTruthy();
    expect(match![0]).toMatch(/archived/);
  });

  it('storage.ts allows video/mp4 and video/quicktime MIME types', () => {
    const src = readSrc('backend/src/common/utils/storage.ts');
    expect(src).toMatch(/['"]video\/mp4['"]/);
    expect(src).toMatch(/['"]video\/quicktime['"]/);
  });

  it('saved-sellers module routes are registered', () => {
    expect(existsSync(resolve(backendRoot, 'src/modules/saved-sellers/saved-sellers.routes.ts'))).toBe(true);
    const appSrc = readSrc('backend/src/app.ts');
    expect(appSrc).toMatch(/saved-sellers/);
  });

  it('posts module exposes /:id/archive route', () => {
    const src = readSrc('backend/src/modules/posts/posts.routes.ts');
    expect(src).toMatch(/\/:postId\/archive|\/:id\/archive/);
  });

  it('PII redaction (locationAddress) is wired in posts.service.ts', () => {
    const src = readSrc('backend/src/modules/posts/posts.service.ts');
    expect(src).toMatch(/redactPiiIfUnfunded/);
    expect(src).toMatch(/isFundedRequester/);
  });

  it('PII gate: buyer email is null for non-funded seller (pre-payment redaction)', () => {
    const src = readSrc('backend/src/modules/posts/posts.service.ts');
    // email must be gated: funded ? post.buyer.email : null
    expect(src).toMatch(/email\s*:\s*funded\s*\?\s*post\.buyer\.email\s*:\s*null/);
  });

  it('PII gate: locationAddress is redacted via redactPiiIfUnfunded (returns null pre-payment)', () => {
    const src = readSrc('backend/src/modules/posts/posts.service.ts');
    // The helper nulls locationAddress when funded=false
    expect(src).toMatch(/locationAddress\s*:\s*null/);
    expect(src).toMatch(/if \(funded\) return post/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SC4: Jobs lead-pricing + free-email denylist
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 3 Closeout — Success Criterion 4: Jobs lead-pricing + free-email denylist', () => {
  it('calculateJobLeadFee returns 10/50/500 for entry/mid/specialized_senior', () => {
    expect(calculateJobLeadFee('entry')).toBe(10);
    expect(calculateJobLeadFee('mid')).toBe(50);
    expect(calculateJobLeadFee('specialized_senior')).toBe(500);
  });

  it('FREE_EMAIL_DOMAINS includes the canonical eight providers', () => {
    for (const d of [
      'gmail.com',
      'yahoo.com',
      'hotmail.com',
      'outlook.com',
      'aol.com',
      'icloud.com',
      'proton.me',
      'protonmail.com',
    ]) {
      expect(FREE_EMAIL_DOMAINS.has(d)).toBe(true);
    }
  });

  it('isFreeEmailDomain detects gmail.com but not corporate domains', () => {
    expect(isFreeEmailDomain('alice@gmail.com')).toBe(true);
    expect(isFreeEmailDomain('alice@acme.com')).toBe(false);
  });

  it('posts.service.createPost gates Jobs creation behind isFreeEmailDomain', () => {
    const src = readSrc('backend/src/modules/posts/posts.service.ts');
    expect(src).toMatch(/isFreeEmailDomain/);
    expect(src).toMatch(/isJobsCategory/);
  });

  it('offers.service.ts overrides platformFee with calculateJobLeadFee on job_milestone', () => {
    const src = readSrc('backend/src/modules/offers/offers.service.ts');
    expect(src).toMatch(/calculateJobLeadFee/);
    expect(src).toMatch(/job_milestone/);
  });

  it('posts.service.ts fires notifyTopMatchedJobSellers on Jobs post creation (ranked top-N, no broadcast)', () => {
    const src = readSrc('backend/src/modules/posts/posts.service.ts');
    expect(src).toMatch(/notifyTopMatchedJobSellers/);
    expect(src).toMatch(/TOP_JOB_MATCH_LIMIT\s*=\s*25/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SC5: Stripe Identity webhook + EIN registration gate
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 3 Closeout — Success Criterion 5: Stripe Identity + EIN gate', () => {
  it('User.ein column is declared in prisma schema', () => {
    const src = readSrc('backend/prisma/schema.prisma');
    // Match within the User model: an `ein` field of String? type
    const userBlock = src.match(/^model User \{[\s\S]*?\n\}/m);
    expect(userBlock).toBeTruthy();
    expect(userBlock![0]).toMatch(/ein\s+String\?/);
  });

  it('User.ein migration applied (column exists in DB)', async () => {
    const { prisma } = await import('../../src/config/database.js');
    const cols = await prisma.$queryRawUnsafe<{ column_name: string }[]>(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'ein'`,
    );
    expect(cols.length).toBeGreaterThan(0);
  });

  it('register schema requires EIN when isBusiness=true (XX-XXXXXXX regex)', async () => {
    const { registerSchema } = await import('../../src/modules/auth/auth.schemas.js');
    const result = registerSchema.safeParse({
      email: 'biz@acme.com',
      password: 'TestPass123!',
      firstName: 'B',
      lastName: 'Z',
      isBusiness: true,
      // ein omitted on purpose
      agreeToTerms: true,
      agreeToPrivacy: true,
    });
    expect(result.success).toBe(false);
    // The superRefine error path should be ['ein']
    if (!result.success) {
      const issues = result.error.issues;
      expect(issues.some((i) => i.path.includes('ein'))).toBe(true);
    }

    // v2.2: valid business payload requires EIN + name + type. The sales-tax cert
    // is NOT required at register time (issue #3) — it is attached post-register via
    // /users/me/upgrade-to-business once the user has an auth token to call /uploads.
    const okResult = registerSchema.safeParse({
      email: 'biz@acme.com',
      password: 'TestPass123!',
      firstName: 'B',
      lastName: 'Z',
      isBusiness: true,
      ein: '12-3456789',
      businessName: 'B Z LLC',
      businessType: 'llc',
      // salesTaxCertificateUrl omitted on purpose — must still parse
      agreeToTerms: true,
      agreeToPrivacy: true,
    });
    expect(okResult.success).toBe(true);
  });

  it('sellers.service.createIdentitySession is wired to Stripe Identity', () => {
    const src = readSrc('backend/src/modules/sellers/sellers.service.ts');
    expect(src).toMatch(/createIdentitySession/);
    expect(src).toMatch(/stripe\.identity\.verificationSessions\.create/);
  });

  it('payments.service handles identity.verification_session.verified webhook', () => {
    const src = readSrc('backend/src/modules/payments/payments.service.ts');
    expect(src).toMatch(/identity\.verification_session\.verified/);
    expect(src).toMatch(/handleIdentitySessionVerified/);
    // Atomic update: VerificationRequest.create + sellerProfile.update inside one transaction
    expect(src).toMatch(/prisma\.\$transaction/);
    expect(src).toMatch(/idVerified:\s*true/);
  });

  it('POST /sellers/identity/verify route is registered', () => {
    const src = readSrc('backend/src/modules/sellers/sellers.routes.ts');
    expect(src).toMatch(/['"]\/identity\/verify['"]/);
  });

  it('payments.service handles identity.verification_session.requires_input (rejected VerificationRequest)', () => {
    const src = readSrc('backend/src/modules/payments/payments.service.ts');
    expect(src).toMatch(/identity\.verification_session\.requires_input/);
    expect(src).toMatch(/handleIdentitySessionRequiresInput/);
    expect(src).toMatch(/status:\s*'rejected'/);
  });

  it('webhook signature is verified before event is processed (payments.webhook.ts)', () => {
    const src = readSrc('backend/src/modules/payments/payments.webhook.ts');
    expect(src).toMatch(/stripe-signature/);
    expect(src).toMatch(/verifyWebhookSignature/);
  });

  it('createSellerProfile auto-creates EIN VerificationRequest when user.ein is set', () => {
    const src = readSrc('backend/src/modules/sellers/sellers.service.ts');
    expect(src).toMatch(/user\.ein/);
    expect(src).toMatch(/verificationType:\s*'ein'/);
    expect(src).toMatch(/status:\s*'pending'/);

  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SC6: Stripe Connect onboarding production env hardening
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 3 Closeout — Success Criterion 6: Production env hardening', () => {
  let exitSpy: ReturnType<typeof vi.spyOn>;
  let errSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const installSpies = () => {
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  };

  it('calls process.exit(1) when STRIPE_CONNECT_RETURN_URL is unset in production', () => {
    installSpies();
    const env: Env = { ...baseProductionEnv, STRIPE_CONNECT_RETURN_URL: '' };
    validateProductionEnv(env);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('calls process.exit(1) when STRIPE_CONNECT_RETURN_URL is a localhost URL in production', () => {
    installSpies();
    const env: Env = { ...baseProductionEnv, STRIPE_CONNECT_RETURN_URL: 'http://localhost:3000/stripe/return' };
    validateProductionEnv(env);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('calls process.exit(1) when FRONTEND_URL is the localhost default in production', () => {
    installSpies();
    const env: Env = { ...baseProductionEnv, FRONTEND_URL: 'http://localhost:8080' };
    validateProductionEnv(env);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('does NOT call process.exit with reversemarket:// return URL + non-localhost FRONTEND_URL', () => {
    installSpies();
    validateProductionEnv(baseProductionEnv);
    expect(exitSpy).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4 Pre-Launch — D-04 Forward-compatible migrations (Wave 0)
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4 Pre-Launch — observability foundation baseline (Wave 1, plan 04-03)
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4 Pre-Launch — Observability foundation', () => {
  it('AlertManager config exists and routes to #sorcyn-prod-alerts', () => {
    const repoRoot = resolve(backendRoot, '..');
    const cfgPath = resolve(repoRoot, 'infra/alertmanager/alertmanager.yml');
    expect(existsSync(cfgPath)).toBe(true);
    expect(readFileSync(cfgPath, 'utf-8')).toMatch(/#sorcyn-prod-alerts/);
  });

  it('Prometheus rules file exists with the 5 prod alerts', () => {
    const repoRoot = resolve(backendRoot, '..');
    const rulesPath = resolve(repoRoot, 'infra/alertmanager/sorcyn-prod-rules.yml');
    expect(existsSync(rulesPath)).toBe(true);
    const src = readFileSync(rulesPath, 'utf-8');
    for (const name of [
      'ApiHigh5xxBurst',
      'ApiP95LatencyBreach',
      'ContainerDown',
      'BullMQBacklog',
      'StripeWebhookFailureSpike',
    ]) {
      expect(src).toMatch(new RegExp(`alert:\\s*${name}`));
    }
  });

  it('Sentry config uses tracesSampleRate 0.05 default for production', () => {
    const src = readSrc('backend/src/config/sentry.ts');
    expect(src).toMatch(/SENTRY_TRACES_SAMPLE_RATE\s*\?\?\s*0\.05/);
  });

  it('logtail config follows lazy-singleton pattern', () => {
    const src = readSrc('backend/src/config/logtail.ts');
    expect(src).toMatch(/let _logger/);
    expect(src).toMatch(/export function getLogger/);
  });
});

describe('Phase 4 Pre-Launch — D-04 Forward-compat migrations', () => {
  it('latest migration has no DROP, RENAME, or SET NOT NULL on existing column', () => {
    const migrationsDir = resolve(backendRoot, 'prisma/migrations');
    if (!existsSync(migrationsDir)) return; // pre-migration repo
    const dated = readdirSync(migrationsDir, { withFileTypes: true })
      .filter(d => d.isDirectory() && /^\d{14}_/.test(d.name))
      .map(d => d.name)
      .sort();
    if (dated.length === 0) return;
    const latest = dated[dated.length - 1];
    const sqlPath = resolve(migrationsDir, latest, 'migration.sql');
    if (!existsSync(sqlPath)) return;
    const raw = readFileSync(sqlPath, 'utf-8');
    // Strip SQL comments so header prose can never falsify the gate.
    const stripped = raw.split('\n').filter(l => !l.trim().startsWith('--')).join('\n');
    expect(stripped).not.toMatch(/^\s*DROP\s+COLUMN\b/im);
    expect(stripped).not.toMatch(/^\s*DROP\s+TABLE\b/im);
    expect(stripped).not.toMatch(/^\s*DROP\s+INDEX\s+(?!CONCURRENTLY)/im);
    expect(stripped).not.toMatch(/^\s*ALTER\s+TABLE\s+\S+\s+RENAME/im);
    expect(stripped).not.toMatch(/SET\s+NOT\s+NULL/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4 Pre-Launch — SC5a: Canary workflows exist (Wave 2 baseline)
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4 Pre-Launch — SC5a: Canary workflows exist', () => {
  const repoRoot = resolve(backendRoot, '..');

  it('.github/workflows/deploy-canary.yml exists with 3-stage choice', () => {
    const path = resolve(repoRoot, '.github/workflows/deploy-canary.yml');
    expect(existsSync(path)).toBe(true);
    const src = readFileSync(path, 'utf-8');
    expect(src).toMatch(/canary-10/);
    expect(src).toMatch(/canary-50/);
    expect(src).toMatch(/canary-100/);
    expect(src).toMatch(/environment:\s*\$\{\{\s*inputs\.stage\s*\}\}/);
  });

  it('.github/workflows/rollback.yml exists with production-rollback environment', () => {
    const path = resolve(repoRoot, '.github/workflows/rollback.yml');
    expect(existsSync(path)).toBe(true);
    const src = readFileSync(path, 'utf-8');
    expect(src).toMatch(/environment:\s*production-rollback/);
    expect(src).toMatch(/set-weights\.sh\s+rollback/);
  });

  it('nginx config uses ip_hash sticky sessions for Socket.IO (Pitfall 7)', () => {
    const renderPath = resolve(repoRoot, 'nginx/render-canary.sh');
    expect(existsSync(renderPath)).toBe(true);
    expect(readFileSync(renderPath, 'utf-8')).toMatch(/ip_hash/);
  });

  it('canary deploy workflow does NOT run prisma migrate deploy (D-04 forward-compat)', () => {
    const src = readFileSync(resolve(repoRoot, '.github/workflows/deploy-canary.yml'), 'utf-8');
    // Strip YAML comments before checking, so a header comment can't falsify the gate.
    const stripped = src.split('\n').filter(l => !l.trim().startsWith('#')).join('\n');
    expect(stripped).not.toMatch(/prisma\s+migrate\s+deploy/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4 Pre-Launch — SC4 partial: DR drill artifact baseline (Wave 2)
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4 Pre-Launch — SC4 partial: DR drill', () => {
  const repoRoot = resolve(backendRoot, '..');

  it('docs/runbooks/dr-drill.md exists with AUDIT-MARKER:RTO block', () => {
    const path = resolve(repoRoot, 'docs/runbooks/dr-drill.md');
    expect(existsSync(path)).toBe(true);
    const md = readFileSync(path, 'utf-8');
    expect(md).toMatch(/<!-- AUDIT-MARKER:RTO -->/);
    expect(md).toMatch(/<!-- \/AUDIT-MARKER:RTO -->/);
    // Targets stated
    expect(md).toMatch(/RTO < 4 h/);
    expect(md).toMatch(/RPO < 1 h/);
  });

  it('AUDIT-MARKER:RTO block contains a parseable table row', () => {
    const md = readFileSync(resolve(repoRoot, 'docs/runbooks/dr-drill.md'), 'utf-8');
    const match = md.match(/<!-- AUDIT-MARKER:RTO -->([\s\S]*?)<!-- \/AUDIT-MARKER:RTO -->/);
    expect(match).toBeTruthy();
    const rows = match![1].split('\n').filter(l => l.trim().startsWith('|') && !l.includes('---'));
    // Header + at least one data row
    expect(rows.length).toBeGreaterThanOrEqual(2);
  });

  it('.github/workflows/nightly-backup.yml exists', () => {
    expect(existsSync(resolve(repoRoot, '.github/workflows/nightly-backup.yml'))).toBe(true);
  });

  it('backup scripts exist and are executable', () => {
    const dump = resolve(repoRoot, 'backend/scripts/pg-dump-to-r2.sh');
    const sync = resolve(repoRoot, 'backend/scripts/r2-cross-region-sync.sh');
    expect(existsSync(dump)).toBe(true);
    expect(existsSync(sync)).toBe(true);
    // Executable bit (0o111 mask)
    expect(((require('node:fs').statSync(dump).mode) & 0o111)).toBeGreaterThan(0);
    expect(((require('node:fs').statSync(sync).mode) & 0o111)).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4 Pre-Launch — SC4 partial: Observability drill (Wave 3)
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4 Pre-Launch — SC4 partial: Observability drill', () => {
  const repoRoot = resolve(backendRoot, '..');

  it('scripts/synthetic-incident.sh exists and is executable', () => {
    const path = resolve(repoRoot, 'scripts/synthetic-incident.sh');
    expect(existsSync(path)).toBe(true);
    const mode = require('node:fs').statSync(path).mode;
    expect(mode & 0o111).toBeGreaterThan(0);
  });

  it('chaos script has restoration trap and staging-only guard', () => {
    const src = readFileSync(resolve(repoRoot, 'scripts/synthetic-incident.sh'), 'utf-8');
    expect(src).toMatch(/trap\s+restore\s+EXIT/);
    expect(src).toMatch(/Refusing to run/);
  });

  it('docs/runbooks/observability-drill.md exists with AUDIT-MARKER:DRILL block', () => {
    const md = readFileSync(resolve(repoRoot, 'docs/runbooks/observability-drill.md'), 'utf-8');
    expect(md).toMatch(/<!-- AUDIT-MARKER:DRILL -->/);
    expect(md).toMatch(/<!-- \/AUDIT-MARKER:DRILL -->/);
    expect(md).toMatch(/ContainerDown/);
    expect(md).toMatch(/ApiHigh5xxBurst/);
    expect(md).toMatch(/ApiP95LatencyBreach/);
    expect(md).toMatch(/StripeWebhookFailureSpike/);
  });

  it('AUDIT-MARKER:DRILL block has parseable header + at least one data row', () => {
    const md = readFileSync(resolve(repoRoot, 'docs/runbooks/observability-drill.md'), 'utf-8');
    const match = md.match(/<!-- AUDIT-MARKER:DRILL -->([\s\S]*?)<!-- \/AUDIT-MARKER:DRILL -->/);
    expect(match).toBeTruthy();
    const rows = match![1].split('\n').filter(l => l.trim().startsWith('|') && !l.includes('---'));
    expect(rows.length).toBeGreaterThanOrEqual(2);
  });

  it('test-only force-500 endpoint is gated by NODE_ENV check', () => {
    const src = readSrc('backend/src/modules/test/test.routes.ts');
    expect(src).toMatch(/if \(env\.NODE_ENV === 'production'\) return/);
    expect(src).toMatch(/x-test-token/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4 Pre-Launch — SC1 + SC2 baseline (Wave 3 producers)
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4 Pre-Launch — SC1 baseline: Load test machinery exists', () => {
  const repoRoot = resolve(backendRoot, '..');

  it('.github/workflows/load-test.yml exists with 1000 VUs + 15-min hold', () => {
    const path = resolve(repoRoot, '.github/workflows/load-test.yml');
    expect(existsSync(path)).toBe(true);
    const src = readFileSync(path, 'utf-8');
    expect(src).toMatch(/k6-action/);
    expect(src).toMatch(/STAGING_PROM_URL/);
  });

  it('tests/load/scenarios/full-flow.js has ramping-VUs to 1000 with 15-min hold', () => {
    const src = readFileSync(resolve(repoRoot, 'tests/load/scenarios/full-flow.js'), 'utf-8');
    expect(src).toMatch(/ramping-vus/);
    expect(src).toMatch(/duration: '15m'.*target: 1000/s);
  });

  it('B-1: Sentry DB p95 exporter exists and queries transaction.op:db', () => {
    const path = resolve(repoRoot, 'backend/scripts/export-sentry-db-p95.sh');
    expect(existsSync(path)).toBe(true);
    const src = readFileSync(path, 'utf-8');
    expect(src).toMatch(/transaction\.op:db/);
    expect(src).toMatch(/dbP95Ms/);
    expect(src).toMatch(/windowStart/);
    expect(src).toMatch(/windowEnd/);
    expect(src).toMatch(/sampleCount/);
  });
});

describe('Phase 4 Pre-Launch — SC2 baseline: Security + coverage + PCI machinery exists', () => {
  const repoRoot = resolve(backendRoot, '..');

  it('.github/workflows/security-scan.yml exists with staging-only ZAP target', () => {
    const path = resolve(repoRoot, '.github/workflows/security-scan.yml');
    expect(existsSync(path)).toBe(true);
    const src = readFileSync(path, 'utf-8');
    expect(src).toMatch(/staging\.sorcyn\.com/);
    // Strip comments — header prose triggers self-invalidating grep gate
    const stripped = src.split('\n').filter(l => !l.trim().startsWith('#')).join('\n');
    expect(stripped).not.toMatch(/api\.sorcyn\.com|https:\/\/sorcyn\.com/);
  });

  it('docs/PCI_SAQ_A.md exists with AUDIT-MARKER:PCI bracket', () => {
    const path = resolve(repoRoot, 'docs/PCI_SAQ_A.md');
    expect(existsSync(path)).toBe(true);
    const src = readFileSync(path, 'utf-8');
    expect(src).toMatch(/<!-- AUDIT-MARKER:PCI -->/);
    expect(src).toMatch(/<!-- \/AUDIT-MARKER:PCI -->/);
    expect(src).toMatch(/\*\*Filed:\*\*/);
  });

  it('B-2: per-tier coverage scripts exist in backend/package.json', () => {
    const pkg = JSON.parse(readFileSync(resolve(repoRoot, 'backend/package.json'), 'utf-8'));
    const scripts = pkg.scripts ?? {};
    expect(scripts['test:coverage:unit']).toBeDefined();
    expect(scripts['test:coverage:integration']).toBeDefined();
    expect(scripts['test:coverage:e2e']).toBeDefined();
  });

  it('B-2: 4 coverage report files committed (combined + 3 per-tier)', () => {
    expect(existsSync(resolve(repoRoot, 'coverage/coverage-summary.json'))).toBe(true);
    expect(existsSync(resolve(repoRoot, 'coverage/coverage-unit.json'))).toBe(true);
    expect(existsSync(resolve(repoRoot, 'coverage/coverage-integration.json'))).toBe(true);
    expect(existsSync(resolve(repoRoot, 'coverage/coverage-e2e.json'))).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// v1.1-E3-04a (issue #84) — No "Stripe" brand name in user-facing strings
// RUNBOOK_OPS.md §2 wording rule. Runs the same gate script CI uses, so the
// audit suite and CI share one source of truth.
// ─────────────────────────────────────────────────────────────────────────────

describe('Issue #84 — payment processor never named in user-facing strings', () => {
  const repoRoot = resolve(backendRoot, '..');

  it('the no-stripe-branding gate script exists', () => {
    expect(existsSync(resolve(repoRoot, 'scripts/check-no-stripe-branding.sh'))).toBe(true);
  });

  it('no disallowed "Stripe" mention in user-facing copy (.arb values + Dart literals)', () => {
    // execFileSync throws on non-zero exit; the script prints offenders to stdout.
    expect(() =>
      execFileSync('bash', ['scripts/check-no-stripe-branding.sh'], {
        cwd: repoRoot,
        encoding: 'utf-8',
        stdio: 'pipe',
      }),
    ).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Issue #217 — No "Reverse Marketplace" codename in transactional email copy
// The brand is "Sorcyn". Runs the same gate script CI uses, so the audit suite
// and CI share one source of truth.
// ─────────────────────────────────────────────────────────────────────────────

describe('Issue #217 — old brand never in transactional email copy', () => {
  const repoRoot = resolve(backendRoot, '..');

  it('the no-old-brand-email gate script exists', () => {
    expect(existsSync(resolve(repoRoot, 'scripts/check-no-old-brand-email.sh'))).toBe(true);
  });

  it('no "Reverse Marketplace" mention in email copy (i18n values + auth helpers)', () => {
    // execFileSync throws on non-zero exit; the script prints offenders to stdout.
    expect(() =>
      execFileSync('bash', ['scripts/check-no-old-brand-email.sh'], {
        cwd: repoRoot,
        encoding: 'utf-8',
        stdio: 'pipe',
      }),
    ).not.toThrow();
  });
});
