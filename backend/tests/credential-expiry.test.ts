import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { prisma } from '../src/config/database.js';
import { runCredentialExpirySweep } from '../src/modules/sellers/credential-expiry.service.js';

process.env.NODE_ENV = 'test';

// Unique email prefix so cleanup never touches another file's rows (tests run
// against a shared DB with file-level parallelism). Assertions are scoped to the
// seller/user created here, not to the sweep's global return counts.
const PREFIX = 'credexp-';
let seq = 0;

/** UTC-midnight date `days` away from `base`'s calendar day. */
function utcDay(base: Date, days: number): Date {
  return new Date(
    Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate() + days),
  );
}

async function makeSeller(opts: {
  licenseVerified?: boolean;
  insuranceVerified?: boolean;
  idVerified?: boolean;
  badges?: string[];
  tier?: number;
}): Promise<{ userId: string; sellerId: string }> {
  seq += 1;
  const user = await prisma.user.create({
    data: {
      email: `${PREFIX}${seq}@example.com`,
      passwordHash: 'x',
      accountType: 'seller',
      firstName: 'Cred',
      lastName: 'Exp',
      emailVerified: true,
      status: 'active',
    },
  });
  const seller = await prisma.sellerProfile.create({
    data: {
      userId: user.id,
      businessName: `Cred Exp ${seq}`,
      emailVerified: true,
      idVerified: opts.idVerified ?? false,
      licenseVerified: opts.licenseVerified ?? false,
      insuranceVerified: opts.insuranceVerified ?? false,
      verificationBadges: opts.badges ?? [],
      verificationTier: opts.tier ?? 1,
    },
  });
  return { userId: user.id, sellerId: seller.id };
}

async function makeRequest(
  sellerId: string,
  opts: {
    type?: 'license' | 'insurance' | 'background_check';
    status?: string;
    expiresAt?: Date | null;
    expiryReminderStage?: number | null;
    tier?: number;
  },
): Promise<string> {
  const req = await prisma.verificationRequest.create({
    data: {
      sellerId,
      verificationType: (opts.type ?? 'license') as never,
      tier: opts.tier ?? 3,
      documents: ['https://r2.example.com/doc.pdf'],
      status: (opts.status ?? 'approved') as never,
      expiresAt: opts.expiresAt ?? null,
      expiryReminderStage: opts.expiryReminderStage ?? null,
    },
  });
  return req.id;
}

function countNotifications(userId: string, type: string): Promise<number> {
  return prisma.notification.count({ where: { userId, type } });
}

async function cleanup(): Promise<void> {
  // Deleting users cascades to seller_profiles → verification_requests + notifications.
  await prisma.user.deleteMany({ where: { email: { startsWith: PREFIX } } });
}

beforeEach(cleanup);
afterAll(cleanup);

describe('runCredentialExpirySweep — lapse pass (#382 PR2)', () => {
  it('lapses a past-dated approved license: boolean false, badge stripped, tier drops, request expired, one notification', async () => {
    const now = new Date('2026-06-15T09:00:00Z');
    const { userId, sellerId } = await makeSeller({
      licenseVerified: true,
      badges: ['license_verified'],
      tier: 3,
    });
    const reqId = await makeRequest(sellerId, {
      type: 'license',
      status: 'approved',
      expiresAt: utcDay(now, -5),
    });

    await runCredentialExpirySweep(now);

    const seller = await prisma.sellerProfile.findUnique({ where: { id: sellerId } });
    expect(seller?.licenseVerified).toBe(false);
    expect(seller?.verificationBadges).toEqual([]);
    expect(seller?.verificationTier).toBe(1); // license was the only tier-3 credential
    const req = await prisma.verificationRequest.findUnique({ where: { id: reqId } });
    expect(req?.status).toBe('expired');
    expect(await countNotifications(userId, 'credential_expired')).toBe(1);
  });

  it('is idempotent — a second sweep is a no-op (no duplicate notification, no further change)', async () => {
    const now = new Date('2026-06-15T09:00:00Z');
    const { userId, sellerId } = await makeSeller({
      licenseVerified: true,
      badges: ['license_verified'],
      tier: 3,
    });
    await makeRequest(sellerId, { type: 'license', expiresAt: utcDay(now, -3) });

    await runCredentialExpirySweep(now);
    const second = await runCredentialExpirySweep(now);

    // The already-expired request is no longer 'approved', so the 2nd run ignores it.
    expect(second.lapsed).toBe(0);
    expect(await countNotifications(userId, 'credential_expired')).toBe(1);
  });

  it('does NOT lapse a credential expiring today — still valid on its expiry day', async () => {
    const now = new Date('2026-06-15T23:00:00Z');
    const { userId, sellerId } = await makeSeller({
      licenseVerified: true,
      badges: ['license_verified'],
      tier: 3,
    });
    const reqId = await makeRequest(sellerId, {
      type: 'license',
      expiresAt: utcDay(now, 0), // today (UTC midnight)
    });

    await runCredentialExpirySweep(now);

    const seller = await prisma.sellerProfile.findUnique({ where: { id: sellerId } });
    expect(seller?.licenseVerified).toBe(true); // not lapsed
    const req = await prisma.verificationRequest.findUnique({ where: { id: reqId } });
    expect(req?.status).toBe('approved');
    expect(await countNotifications(userId, 'credential_expired')).toBe(0);
    // Expiry-day should instead surface a same-day reminder.
    expect(await countNotifications(userId, 'credential_expiring')).toBe(1);
  });

  it('lapses two credentials for the same seller in one sweep without clobbering the badge array', async () => {
    const now = new Date('2026-06-15T09:00:00Z');
    const { sellerId } = await makeSeller({
      licenseVerified: true,
      insuranceVerified: true,
      badges: ['license_verified', 'insurance_verified'],
      tier: 3,
    });
    await makeRequest(sellerId, { type: 'license', expiresAt: utcDay(now, -2) });
    await makeRequest(sellerId, { type: 'insurance', expiresAt: utcDay(now, -1) });

    await runCredentialExpirySweep(now);

    const seller = await prisma.sellerProfile.findUnique({ where: { id: sellerId } });
    expect(seller?.licenseVerified).toBe(false);
    expect(seller?.insuranceVerified).toBe(false);
    // Both badges stripped — the 2nd flip must not restore the 1st from a stale snapshot.
    expect(seller?.verificationBadges).toEqual([]);
    expect(seller?.verificationTier).toBe(1);
  });

  it('leaves a still-verified credential alone (tier drops only for the lapsed one)', async () => {
    const now = new Date('2026-06-15T09:00:00Z');
    const { sellerId } = await makeSeller({
      idVerified: true,
      licenseVerified: true,
      badges: ['id_verified', 'license_verified'],
      tier: 3,
    });
    await makeRequest(sellerId, { type: 'license', expiresAt: utcDay(now, -1) });

    await runCredentialExpirySweep(now);

    const seller = await prisma.sellerProfile.findUnique({ where: { id: sellerId } });
    expect(seller?.licenseVerified).toBe(false);
    expect(seller?.idVerified).toBe(true); // untouched
    expect(seller?.verificationBadges).toEqual(['id_verified']);
    expect(seller?.verificationTier).toBe(2); // id keeps them at tier 2
  });
});

describe('runCredentialExpirySweep — reminder pass (#382 PR2)', () => {
  it('sends one credential_expiring per window (30 → 7 → 1) as the expiry approaches, deduped', async () => {
    const expiresAt = new Date(Date.UTC(2026, 7, 15)); // 2026-08-15
    const { userId, sellerId } = await makeSeller({
      licenseVerified: true,
      badges: ['license_verified'],
      tier: 3,
    });
    const reqId = await makeRequest(sellerId, { type: 'license', expiresAt });

    // 26 days out → 30-day window fires once.
    await runCredentialExpirySweep(new Date('2026-07-20T09:00:00Z'));
    expect(await countNotifications(userId, 'credential_expiring')).toBe(1);
    expect((await prisma.verificationRequest.findUnique({ where: { id: reqId } }))?.expiryReminderStage).toBe(30);

    // Still in the 30-day window next day → no duplicate.
    await runCredentialExpirySweep(new Date('2026-07-21T09:00:00Z'));
    expect(await countNotifications(userId, 'credential_expiring')).toBe(1);

    // 6 days out → 7-day window fires.
    await runCredentialExpirySweep(new Date('2026-08-09T09:00:00Z'));
    expect(await countNotifications(userId, 'credential_expiring')).toBe(2);
    expect((await prisma.verificationRequest.findUnique({ where: { id: reqId } }))?.expiryReminderStage).toBe(7);

    // 1 day out → 1-day window fires.
    await runCredentialExpirySweep(new Date('2026-08-14T09:00:00Z'));
    expect(await countNotifications(userId, 'credential_expiring')).toBe(3);
    expect((await prisma.verificationRequest.findUnique({ where: { id: reqId } }))?.expiryReminderStage).toBe(1);

    // Same 1-day window again → no duplicate.
    await runCredentialExpirySweep(new Date('2026-08-14T20:00:00Z'));
    expect(await countNotifications(userId, 'credential_expiring')).toBe(3);
  });

  it('re-arms reminders once expiryReminderStage is reset to null (the re-approval path)', async () => {
    const expiresAt = new Date(Date.UTC(2026, 7, 15));
    const { userId, sellerId } = await makeSeller({
      licenseVerified: true,
      badges: ['license_verified'],
      tier: 3,
    });
    const reqId = await makeRequest(sellerId, {
      type: 'license',
      expiresAt,
      expiryReminderStage: 1, // 1-day reminder already sent for the old expiry
    });

    // Already at the most-urgent window → no reminder while stage is 1.
    await runCredentialExpirySweep(new Date('2026-08-14T09:00:00Z'));
    expect(await countNotifications(userId, 'credential_expiring')).toBe(0);

    // reviewVerification resets the stage on re-approval; simulate that reset.
    await prisma.verificationRequest.update({
      where: { id: reqId },
      data: { expiryReminderStage: null },
    });

    await runCredentialExpirySweep(new Date('2026-08-14T09:00:00Z'));
    expect(await countNotifications(userId, 'credential_expiring')).toBe(1);
  });

  it('does not remind for a credential more than 30 days out', async () => {
    const { userId, sellerId } = await makeSeller({ licenseVerified: true, tier: 3 });
    await makeRequest(sellerId, {
      type: 'license',
      expiresAt: new Date(Date.UTC(2026, 11, 31)), // far future
    });

    await runCredentialExpirySweep(new Date('2026-06-15T09:00:00Z'));

    expect(await countNotifications(userId, 'credential_expiring')).toBe(0);
  });
});
