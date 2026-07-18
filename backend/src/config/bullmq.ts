import { Queue, Worker, type Job } from 'bullmq';
import { env } from './env.js';

const connection = (() => {
  const url = new URL(env.REDIS_URL);
  return {
    host: url.hostname || 'localhost',
    port: Number(url.port) || 6379,
    ...(url.password ? { password: decodeURIComponent(url.password) } : {}),
  };
})();

// Default job options: retry with exponential backoff, cap stored jobs
const defaultJobOptions = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 5000 },
  removeOnComplete: { count: 1000 },
  removeOnFail: { count: 5000 },
};

// ── Queues ──────────────────────────────────────────────────
export const notificationQueue = new Queue('notifications', { connection, defaultJobOptions });
export const reviewReminderQueue = new Queue('review-reminders', { connection, defaultJobOptions });
export const autoReleaseQueue = new Queue('auto-release', { connection, defaultJobOptions });
export const postExpiryQueue = new Queue('post-expiry', { connection, defaultJobOptions });
export const offerExpiryQueue = new Queue('offer-expiry', { connection, defaultJobOptions });
export const exclusivityExpiryQueue = new Queue('exclusivity-expiry', { connection, defaultJobOptions });
// Daily sweep: greys lapsed license/insurance/background-check badges + sends
// 30/7/1-day renewal reminders (issue #382 PR2).
export const credentialExpiryQueue = new Queue('credential-expiry', { connection, defaultJobOptions });
// Drains queued payment intents once the payment processor recovers (issue #84)
export const stripeRetryQueue = new Queue('stripe-retry', { connection, defaultJobOptions });
// Copyright staydown: server-side perceptual-hash scan of newly uploaded post
// images against the takedown blocklist (issue #313). Presigned uploads mean the
// server never sees the bytes at upload time, so it reads them back from R2 here.
export const imageScanQueue = new Queue('image-scan', { connection, defaultJobOptions });

// ── Job Types ───────────────────────────────────────────────
export interface NotificationJobData {
  notificationId: string;
  userId: string;
  channels: string[];
}

export interface ImageScanJobData {
  postId: string;
  imageUrl: string;
  uploaderUserId: string;
}

export interface ReviewReminderJobData {
  transactionId: string;
  buyerId: string;
  sellerId: string;
  reminderType: 'day_7' | 'day_30' | 'day_60' | 'auto_review';
}

export interface SweepJobData {
  triggeredAt: string;
}

/**
 * Enqueue a staydown scan for each newly attached post image (#313). Fire-and-
 * forget: enqueue failures must never block post creation/editing, so errors are
 * swallowed (the worst case is an unscanned image, caught on the next edit).
 */
export async function enqueueImageScan(
  imageUrls: string[],
  uploaderUserId: string,
  opts: { postId: string },
): Promise<void> {
  if (env.NODE_ENV === 'test' || imageUrls.length === 0) return;
  try {
    await Promise.all(
      imageUrls.map((imageUrl) =>
        imageScanQueue.add('scan', {
          postId: opts.postId,
          imageUrl,
          uploaderUserId,
        } satisfies ImageScanJobData),
      ),
    );
  } catch (err) {
    console.error('[IMAGE-SCAN ENQUEUE ERROR]', err);
  }
}

// ── Scheduled Jobs (repeatable sweeps) ─────────────────────

export async function registerScheduledJobs() {
  if (env.NODE_ENV === 'test') return;

  // Auto-release escrow: every 15 minutes
  await autoReleaseQueue.upsertJobScheduler(
    'auto-release-sweep',
    { every: 15 * 60 * 1000 },
    { data: { triggeredAt: new Date().toISOString() } },
  );

  // Post expiry: every hour
  await postExpiryQueue.upsertJobScheduler(
    'post-expiry-sweep',
    { every: 60 * 60 * 1000 },
    { data: { triggeredAt: new Date().toISOString() } },
  );

  // Offer expiry: every hour
  await offerExpiryQueue.upsertJobScheduler(
    'offer-expiry-sweep',
    { every: 60 * 60 * 1000 },
    { data: { triggeredAt: new Date().toISOString() } },
  );

  // Exclusivity expiry: every hour
  await exclusivityExpiryQueue.upsertJobScheduler(
    'exclusivity-expiry-sweep',
    { every: 60 * 60 * 1000 },
    { data: { triggeredAt: new Date().toISOString() } },
  );

  // Stripe-degrade retry: every minute. The worker no-ops while
  // STRIPE_DEGRADED=true and drains the backlog once the flag is cleared.
  await stripeRetryQueue.upsertJobScheduler(
    'stripe-retry-sweep',
    { every: 60 * 1000 },
    { data: { triggeredAt: new Date().toISOString() } },
  );

  // Credential expiry: daily. Greys lapsed license/insurance/bg-check badges and
  // sends 30/7/1-day renewal reminders (#382 PR2). Daily is enough — a @db.Date
  // expiry has day granularity and the sweep recomputes from the live date.
  await credentialExpiryQueue.upsertJobScheduler(
    'credential-expiry-sweep',
    { every: 24 * 60 * 60 * 1000 },
    { data: { triggeredAt: new Date().toISOString() } },
  );
}

// ── Workers ─────────────────────────────────────────────────
let workersStarted = false;
const workers: Worker[] = [];

function attachWorkerErrorHandlers(worker: Worker, name: string) {
  worker.on('failed', async (job, err) => {
    const { captureException } = await import('./sentry.js');
    captureException(err, { worker: name, jobId: job?.id, data: job?.data });
    console.error(`[WORKER:${name}] Job ${job?.id} failed (attempt ${job?.attemptsMade}/${job?.opts?.attempts ?? '?'}):`, err.message);
  });
  worker.on('error', (err) => {
    console.error(`[WORKER:${name}] Worker error:`, err.message);
  });
}

export function startWorkers() {
  if (workersStarted || env.NODE_ENV === 'test') return;
  workersStarted = true;

  const notificationWorker = new Worker<NotificationJobData>(
    'notifications',
    async (job: Job<NotificationJobData>) => {
      const { NotificationsService } = await import(
        '../modules/notifications/notifications.service.js'
      );
      const svc = new NotificationsService();
      await svc.deliverNotification(job.data.notificationId);
    },
    { connection, concurrency: 5 },
  );
  attachWorkerErrorHandlers(notificationWorker, 'notifications');
  workers.push(notificationWorker);

  const reviewReminderWorker = new Worker<ReviewReminderJobData>(
    'review-reminders',
    async (job: Job<ReviewReminderJobData>) => {
      const { ReviewsService } = await import(
        '../modules/reviews/reviews.service.js'
      );
      const svc = new ReviewsService();
      await svc.processReviewReminder(job.data);
    },
    { connection, concurrency: 2 },
  );
  attachWorkerErrorHandlers(reviewReminderWorker, 'review-reminders');
  workers.push(reviewReminderWorker);

  // ── Auto-Release Escrow Worker ─────────────────────────────
  const autoReleaseWorker = new Worker<SweepJobData>(
    'auto-release',
    async (job: Job<SweepJobData>) => {
      const { prisma } = await import('../config/database.js');
      const { PaymentsService } = await import(
        '../modules/payments/payments.service.js'
      );
      const { NotificationsService } = await import(
        '../modules/notifications/notifications.service.js'
      );
      const { ReviewsService } = await import(
        '../modules/reviews/reviews.service.js'
      );

      const now = new Date();
      const transactions = await prisma.transaction.findMany({
        where: {
          autoReleaseAt: { lte: now },
          escrowStatus: 'held',
          status: 'awaiting_approval',
          deletedAt: null,
          // SEC-C1 (#255): only auto-complete transactions that were actually funded.
          // A card transaction is funded once `stripeChargeId` is set by the verified
          // `payment_intent.succeeded` webhook. `product_local_cash` settles offline (no
          // Stripe charge) and still auto-completes. This prevents an unfunded card
          // transaction — seller marked it complete, buyer never paid — from being swept
          // to `completed` by the 7-day timer.
          OR: [
            { stripeChargeId: { not: null } },
            { transactionType: 'product_local_cash' },
          ],
        },
        include: {
          post: { select: { id: true, title: true } },
          seller: {
            select: {
              id: true,
              user: { select: { id: true, firstName: true } },
            },
          },
        },
      });

      job.log(`Found ${transactions.length} transactions to auto-release`);

      for (const tx of transactions) {
        try {
          // 1. Release escrow via Stripe (must run BEFORE status update so guard passes).
          // SEC-M1 (#261): releaseEscrow atomically claims escrowStatus 'held'→'released'. If a
          // buyer refunded/cancelled between this sweep's query and now it returns false — skip
          // the transaction rather than marking it completed/released over a refund.
          if (tx.stripePaymentIntentId && tx.transactionType !== 'product_local_cash') {
            const paymentsService = new PaymentsService();
            const released = await paymentsService.releaseEscrow(tx.id, 'auto_release');
            if (!released) {
              job.log(`Skipped ${tx.id}: escrow no longer held (refunded/cancelled)`);
              continue;
            }
          }

          // 2. Update transaction status to completed
          const timeline = Array.isArray(tx.timeline) ? [...(tx.timeline as any[])] : [];
          timeline.push({
            event: 'auto_released',
            timestamp: now.toISOString(),
            actorId: 'system',
            note: 'Funds auto-released after 7-day approval window expired',
          });

          await prisma.transaction.update({
            where: { id: tx.id },
            data: {
              status: 'completed',
              completedAt: now,
              escrowStatus: 'released',
              escrowReleasedAt: new Date(),
              releaseReason: 'auto_release',
              autoReleaseAt: null,
              timeline: timeline as any,
            },
          });

          // 3. Increment seller's totalCompleted
          await prisma.sellerProfile.update({
            where: { id: tx.sellerId },
            data: { totalCompleted: { increment: 1 } },
          });

          // 3b. Lock the conversation — thread stays visible but read-only (#305).
          try {
            const { MessagesService } = await import(
              '../modules/messages/messages.service.js'
            );
            await new MessagesService().lockConversationByTransactionId(tx.id);
          } catch (err) {
            console.error('[CONVO LOCK ERROR]', err);
          }

          // 4. Notify buyer
          const notifSvc = new NotificationsService();
          await notifSvc.createNotification({
            userId: tx.buyerId,
            type: 'escrow_auto_released',
            title: 'Payment Auto-Released',
            message: `Payment for "${tx.post.title}" was automatically released after 7 days.`,
            data: { transactionId: tx.id, postId: tx.postId },
            channels: ['push', 'email', 'in_app'],
            actionUrl: `/transactions/${tx.id}`,
          });

          // 5. Notify seller
          await notifSvc.createNotification({
            userId: tx.seller.user.id,
            type: 'escrow_auto_released',
            title: 'Payment Received',
            message: `Payment for "${tx.post.title}" has been released to your account.`,
            data: { transactionId: tx.id, postId: tx.postId },
            channels: ['push', 'email', 'in_app'],
            actionUrl: `/transactions/${tx.id}`,
          });

          // 6. Schedule review reminders
          const reviewsSvc = new ReviewsService();
          await reviewsSvc.scheduleReviewReminders(tx.id, tx.buyerId, tx.sellerId);

          job.log(`Auto-released transaction ${tx.id}`);
        } catch (err) {
          const { captureException } = await import('./sentry.js');
          captureException(err, { worker: 'auto-release', transactionId: tx.id });
          console.error(`[AUTO-RELEASE ERROR] Transaction ${tx.id}:`, err);
          job.log(`FAILED to auto-release transaction ${tx.id}: ${(err as Error).message}`);
        }
      }
    },
    { connection, concurrency: 1 },
  );
  attachWorkerErrorHandlers(autoReleaseWorker, 'auto-release');
  workers.push(autoReleaseWorker);

  // ── Post Expiry Worker ─────────────────────────────────────
  const postExpiryWorker = new Worker<SweepJobData>(
    'post-expiry',
    async (job: Job<SweepJobData>) => {
      const { prisma } = await import('../config/database.js');
      const { NotificationsService } = await import(
        '../modules/notifications/notifications.service.js'
      );

      const now = new Date();
      const expiredPosts = await prisma.post.findMany({
        where: {
          expiresAt: { lte: now },
          status: 'active',
          deletedAt: null,
        },
        select: { id: true, buyerId: true, title: true },
      });

      job.log(`Found ${expiredPosts.length} posts to expire`);

      if (expiredPosts.length > 0) {
        await prisma.post.updateMany({
          where: { id: { in: expiredPosts.map((p) => p.id) } },
          data: { status: 'expired' },
        });

        const notifSvc = new NotificationsService();
        for (const post of expiredPosts) {
          try {
            await notifSvc.createNotification({
              userId: post.buyerId,
              type: 'post_expired',
              title: 'Post Expired',
              message: `Your post "${post.title}" has expired. You can repost it anytime.`,
              data: { postId: post.id },
              channels: ['push', 'in_app'],
              actionUrl: `/posts/${post.id}`,
            });
          } catch (err) {
            const { captureException } = await import('./sentry.js');
            captureException(err, { worker: 'post-expiry', postId: post.id });
            console.error(`[POST-EXPIRY NOTIFY ERROR] Post ${post.id}:`, err);
          }
        }
      }
    },
    { connection, concurrency: 1 },
  );
  attachWorkerErrorHandlers(postExpiryWorker, 'post-expiry');
  workers.push(postExpiryWorker);

  // ── Offer Expiry Worker ────────────────────────────────────
  const offerExpiryWorker = new Worker<SweepJobData>(
    'offer-expiry',
    async (job: Job<SweepJobData>) => {
      const { prisma } = await import('../config/database.js');
      const { NotificationsService } = await import(
        '../modules/notifications/notifications.service.js'
      );

      const now = new Date();

      // Query expiring offers BEFORE updating to capture seller/post info
      const expiringOffers = await prisma.offer.findMany({
        where: {
          expiresAt: { lte: now },
          status: 'pending',
          deletedAt: null,
        },
        select: {
          id: true,
          postId: true,
          seller: {
            select: {
              id: true,
              user: { select: { id: true, firstName: true } },
            },
          },
          post: { select: { id: true, title: true } },
        },
      });

      if (expiringOffers.length > 0) {
        await prisma.offer.updateMany({
          where: { id: { in: expiringOffers.map((o) => o.id) } },
          data: { status: 'expired' },
        });

        // Notify sellers about expired offers
        const notifSvc = new NotificationsService();
        for (const offer of expiringOffers) {
          try {
            await notifSvc.createNotification({
              userId: offer.seller.user.id,
              type: 'offer_expired',
              title: 'Offer Expired',
              message: `Your offer on "${offer.post.title}" has expired.`,
              data: { offerId: offer.id, postId: offer.postId },
              channels: ['push', 'in_app'],
              actionUrl: `/offers/${offer.id}`,
            });
          } catch (err) {
            const { captureException } = await import('./sentry.js');
            captureException(err, { worker: 'offer-expiry', offerId: offer.id });
            console.error(`[OFFER-EXPIRY NOTIFY ERROR] Offer ${offer.id}:`, err);
          }
        }
      }

      job.log(`Expired ${expiringOffers.length} offers`);
    },
    { connection, concurrency: 1 },
  );
  attachWorkerErrorHandlers(offerExpiryWorker, 'offer-expiry');
  workers.push(offerExpiryWorker);

  // ── Exclusivity Expiry Worker ─────────────────────────────────
  const exclusivityExpiryWorker = new Worker<SweepJobData>(
    'exclusivity-expiry',
    async (job: Job<SweepJobData>) => {
      const { prisma } = await import('../config/database.js');
      const { NotificationsService } = await import(
        '../modules/notifications/notifications.service.js'
      );

      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Find posts where exclusivity just ended (publicAfter within the last hour)
      const transitionedPosts = await prisma.post.findMany({
        where: {
          publicAfter: { lte: now, gt: oneHourAgo },
          status: 'active',
          deletedAt: null,
        },
        select: { id: true, buyerId: true, title: true },
      });

      job.log(`Found ${transitionedPosts.length} posts transitioning to public`);

      if (transitionedPosts.length > 0) {
        const notifSvc = new NotificationsService();
        for (const post of transitionedPosts) {
          try {
            await notifSvc.createNotification({
              userId: post.buyerId,
              type: 'exclusivity_ended',
              title: 'Your Post is Now Public',
              message: `Your post "${post.title}" is now visible to all sellers. Expect more offers!`,
              data: { postId: post.id },
              channels: ['push', 'in_app'],
              actionUrl: `/posts/${post.id}`,
            });
          } catch (err) {
            const { captureException } = await import('./sentry.js');
            captureException(err, { worker: 'exclusivity-expiry', postId: post.id });
            console.error(`[EXCLUSIVITY-EXPIRY NOTIFY ERROR] Post ${post.id}:`, err);
          }
        }
      }
    },
    { connection, concurrency: 1 },
  );
  attachWorkerErrorHandlers(exclusivityExpiryWorker, 'exclusivity-expiry');
  workers.push(exclusivityExpiryWorker);

  // ── Stripe-Degrade Retry Worker ───────────────────────────────
  // Drains payment_intent_queue once the payment processor recovers
  // (STRIPE_DEGRADED=false). No-ops while still degraded so the backlog only
  // flushes when it is safe to call the processor again (issue #84).
  const stripeRetryWorker = new Worker<SweepJobData>(
    'stripe-retry',
    async (job: Job<SweepJobData>) => {
      const { drainPaymentIntentQueue } = await import(
        '../modules/payments/payments.degrade.js'
      );
      const { drained, failed } = await drainPaymentIntentQueue((m) => job.log(m));
      job.log(`stripe-retry drain complete: ${drained} drained, ${failed} failed`);
    },
    { connection, concurrency: 1 },
  );
  attachWorkerErrorHandlers(stripeRetryWorker, 'stripe-retry');
  workers.push(stripeRetryWorker);

  // ── Credential Expiry Worker (#382 PR2) ───────────────────────
  // Daily sweep: greys lapsed license/insurance/bg-check badges + drops tier +
  // marks the request expired + sends 30/7/1-day reminders. The body lives in
  // credential-expiry.service.ts so Vitest can drive it without Redis.
  const credentialExpiryWorker = new Worker<SweepJobData>(
    'credential-expiry',
    async (job: Job<SweepJobData>) => {
      const { runCredentialExpirySweep } = await import(
        '../modules/sellers/credential-expiry.service.js'
      );
      const result = await runCredentialExpirySweep(new Date());
      job.log(
        `credential-expiry sweep: ${result.lapsed} lapsed, ${result.remindersSent} reminders sent`,
      );
    },
    { connection, concurrency: 1 },
  );
  attachWorkerErrorHandlers(credentialExpiryWorker, 'credential-expiry');
  workers.push(credentialExpiryWorker);

  // ── Copyright Staydown Scan Worker (#313) ─────────────────────
  // Fetches each newly uploaded post image from R2, computes its perceptual hash,
  // and — on a blocklist match within the Hamming threshold — detaches it, deletes
  // the object, and strikes the uploader (suspending at the strike threshold).
  const imageScanWorker = new Worker<ImageScanJobData>(
    'image-scan',
    async (job: Job<ImageScanJobData>) => {
      const { postId, imageUrl, uploaderUserId } = job.data;
      const { urlToKey, getObjectBuffer } = await import('../common/utils/storage.js');
      const { computeDhash } = await import('../common/utils/phash.js');
      const { TakedownsService } = await import('../modules/admin/takedowns.service.js');

      const key = urlToKey(imageUrl);
      if (!key) {
        job.log(`Skipped ${imageUrl}: could not resolve storage key`);
        return;
      }

      let perceptualHash: string;
      try {
        const buf = await getObjectBuffer(key);
        perceptualHash = await computeDhash(buf);
      } catch (err) {
        // Object not yet uploaded, gone, or not a decodable image — nothing to scan.
        job.log(`Skipped ${key}: ${(err as Error).message}`);
        return;
      }

      const svc = new TakedownsService();
      const match = await svc.checkBlocklist(perceptualHash);
      if (!match) {
        job.log(`Clean: ${key}`);
        return;
      }

      const result = await svc.applyStaydownBlock({
        postId,
        imageUrl,
        imageKey: key,
        uploaderUserId,
        perceptualHash,
        matchedAdminId: match.takenDownBy,
      });
      job.log(
        `Staydown blocked ${key} (strike ${result.strikeCount}${result.suspended ? ', suspended' : ''})`,
      );
    },
    { connection, concurrency: 3 },
  );
  attachWorkerErrorHandlers(imageScanWorker, 'image-scan');
  workers.push(imageScanWorker);
}

/** Gracefully close all workers (waits for active jobs to finish). */
export async function closeWorkers(): Promise<void> {
  await Promise.allSettled(workers.map((w) => w.close()));
}
