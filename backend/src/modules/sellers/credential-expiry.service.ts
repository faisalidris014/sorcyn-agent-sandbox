import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import {
  calculateVerificationTier,
  getBadgeField,
  isCredentialExpired,
  removeBadge,
  startOfDayUTC,
} from '../../common/utils/verification.js';

/**
 * Daily credential-expiry sweep (#382 PR2).
 *
 * Two passes over the seller's approved dated credentials:
 *   1. LAPSE  — expiry fully passed → flip the profile boolean false, strip the
 *      badge, drop the verification tier, mark the request `expired`, and notify.
 *   2. REMIND — expiring within 30/7/1 days → one `credential_expiring` per window,
 *      deduped via `VerificationRequest.expiryReminderStage`.
 *
 * Design notes:
 *  - **Idempotent.** The lapse pass only selects `status='approved'`; flipping the
 *    request to `expired` is the guard, so re-running the sweep is a no-op.
 *  - **Sweep-computed, not per-record delayed jobs.** Admins/sellers move the
 *    expiry date, so a daily recompute self-heals; a `queue.add(..., {delay})` job
 *    would fire on a stale date and sit for ~2 years in Redis for a long license.
 *  - **Category-access revocation on lapse is NOT here** — that riskier downgrade
 *    is isolated in PR3 (`revokeCategoryAccess`). This pass only greys badges.
 *  - `now` is injected so Vitest can drive the sweep directly without Redis.
 */

/** Credentials that carry a dated expiry and can lapse. */
const LAPSING_TYPES = ['license', 'insurance', 'background_check'] as const;

/** Reminder windows in days (checked smallest-first for the applicable one). */
const REMINDER_WINDOW_DAYS = 30;

const DAY_MS = 86_400_000;

/** Human label for a credential type, for notification copy. */
function typeLabel(verificationType: string): string {
  switch (verificationType) {
    case 'license':
      return 'License';
    case 'insurance':
      return 'Insurance';
    case 'background_check':
      return 'Background check';
    default:
      return 'Credential';
  }
}

/**
 * Smallest reminder window (30/7/1 days) that `daysUntil` currently falls into, or
 * null if the credential is further out than 30 days. Smaller window = more urgent.
 */
function reminderWindow(daysUntil: number): number | null {
  if (daysUntil <= 1) return 1;
  if (daysUntil <= 7) return 7;
  if (daysUntil <= REMINDER_WINDOW_DAYS) return 30;
  return null;
}

export interface CredentialExpirySweepResult {
  /** Credentials lapsed this run (badge greyed, request → expired). */
  lapsed: number;
  /** `credential_expiring` reminders sent this run. */
  remindersSent: number;
}

export async function runCredentialExpirySweep(
  now: Date,
): Promise<CredentialExpirySweepResult> {
  const notifications = new NotificationsService();
  const today = startOfDayUTC(now);
  let lapsed = 0;
  let remindersSent = 0;

  // ── Pass 1: lapse ──────────────────────────────────────────────
  // Strictly before today (see isCredentialExpired) so a credential is still valid
  // ON its expiry day and lapses the day after — matching deriveCredentialStatus.
  const lapseCandidates = await prisma.verificationRequest.findMany({
    where: {
      status: 'approved',
      verificationType: { in: [...LAPSING_TYPES] },
      expiresAt: { lt: today },
      deletedAt: null,
    },
    select: {
      id: true,
      sellerId: true,
      verificationType: true,
      expiresAt: true,
      seller: { select: { userId: true } },
    },
  });

  for (const req of lapseCandidates) {
    // Defensive re-check against the TZ boundary — never lapse a still-valid cred.
    if (!isCredentialExpired(req.expiresAt, now)) continue;

    const badgeField = getBadgeField(req.verificationType); // e.g. 'licenseVerified'
    const badgeName = `${req.verificationType}_verified`;

    try {
      // Re-read the seller INSIDE the transaction so two credentials lapsing for the
      // same seller in one sweep compose (the 2nd sees the 1st's committed flip)
      // instead of each writing back a stale badge array / boolean set.
      await prisma.$transaction(async (tx) => {
        const seller = await tx.sellerProfile.findUnique({
          where: { id: req.sellerId },
          select: {
            emailVerified: true,
            idVerified: true,
            einVerified: true,
            salesTaxVerified: true,
            licenseVerified: true,
            insuranceVerified: true,
            backgroundCheckVerified: true,
            verificationBadges: true,
          },
        });
        if (!seller) return;

        const badges = Array.isArray(seller.verificationBadges)
          ? (seller.verificationBadges as string[])
          : [];

        const flipped = {
          emailVerified: seller.emailVerified,
          idVerified: seller.idVerified,
          einVerified: seller.einVerified,
          salesTaxVerified: seller.salesTaxVerified,
          licenseVerified: seller.licenseVerified,
          insuranceVerified: seller.insuranceVerified,
          backgroundCheckVerified: seller.backgroundCheckVerified,
        };
        (flipped as Record<string, boolean>)[badgeField] = false;

        await tx.sellerProfile.update({
          where: { id: req.sellerId },
          data: {
            [badgeField]: false,
            verificationBadges: removeBadge(badges, badgeName) as Prisma.InputJsonValue,
            verificationTier: calculateVerificationTier(flipped),
          },
        });
        await tx.verificationRequest.update({
          where: { id: req.id },
          data: { status: 'expired' }, // idempotency guard — next sweep skips it
        });
      });
    } catch (err) {
      console.error(
        `[CREDENTIAL-EXPIRY LAPSE ERROR] request ${req.id}:`,
        (err as Error).message,
      );
      continue;
    }

    lapsed++;

    // Notify after the state change commits. createNotification is best-effort;
    // a notify failure must not abort the sweep or undo the lapse.
    try {
      const label = typeLabel(req.verificationType);
      await notifications.createNotification({
        userId: req.seller.userId,
        type: 'credential_expired',
        title: `${label} verification expired`,
        message: `Your ${label} verification has expired. Re-submit your document to restore the badge.`,
        data: { verificationType: req.verificationType, verificationId: req.id },
        channels: ['push', 'email', 'in_app'],
        actionUrl: '/seller/verification',
      });
    } catch (err) {
      console.error(
        `[CREDENTIAL-EXPIRY NOTIFY ERROR] request ${req.id}:`,
        (err as Error).message,
      );
    }
  }

  // ── Pass 2: remind ─────────────────────────────────────────────
  // Not-yet-lapsed dated credentials (expiresAt >= today); the lapse pass owns the
  // strictly-past ones, so the two passes never touch the same row in a run.
  const remindCandidates = await prisma.verificationRequest.findMany({
    where: {
      status: 'approved',
      verificationType: { in: [...LAPSING_TYPES] },
      expiresAt: { gte: today },
      deletedAt: null,
    },
    select: {
      id: true,
      verificationType: true,
      expiresAt: true,
      expiryReminderStage: true,
      seller: { select: { userId: true } },
    },
  });

  for (const req of remindCandidates) {
    if (!req.expiresAt) continue;
    const daysUntil = Math.round(
      (startOfDayUTC(req.expiresAt).getTime() - today.getTime()) / DAY_MS,
    );
    const window = reminderWindow(daysUntil);
    if (window === null) continue;

    // Send only when we've entered a MORE urgent (smaller) window than last sent.
    const stage = req.expiryReminderStage;
    if (stage !== null && window >= stage) continue;

    try {
      await prisma.verificationRequest.update({
        where: { id: req.id },
        data: { expiryReminderStage: window },
      });
      const label = typeLabel(req.verificationType);
      await notifications.createNotification({
        userId: req.seller.userId,
        type: 'credential_expiring',
        title: `${label} verification expiring soon`,
        message:
          daysUntil <= 0
            ? `Your ${label} verification expires today. Renew it to keep your badge.`
            : `Your ${label} verification expires in ${daysUntil} day${daysUntil === 1 ? '' : 's'}. Renew it to keep your badge.`,
        data: {
          verificationType: req.verificationType,
          expiresAt: req.expiresAt.toISOString(),
          daysUntil,
        },
        channels: ['push', 'email', 'in_app'],
        actionUrl: '/seller/verification',
      });
      remindersSent++;
    } catch (err) {
      console.error(
        `[CREDENTIAL-EXPIRY REMIND ERROR] request ${req.id}:`,
        (err as Error).message,
      );
    }
  }

  return { lapsed, remindersSent };
}
