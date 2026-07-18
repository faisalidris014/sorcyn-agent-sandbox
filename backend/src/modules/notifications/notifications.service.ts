import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { NotFoundError } from '../../common/utils/errors.js';
import { sendEmail } from '../../common/utils/email.js';
import { sendPush } from '../../common/utils/push.js';
import { notificationQueue } from '../../config/bullmq.js';
import type { PaginationMeta } from '../../common/types/api.js';
import type {
  CreateNotificationInput,
  ListNotificationsQuery,
  NotificationPreferences,
} from './notifications.schemas.js';

const DEFAULT_PREFERENCES: NotificationPreferences = {
  push_messages: true,
  email_offers: true,
  sms_offers: false,
  types: {},
};

export class NotificationsService {
  // ── Create & Queue ──────────────────────────────────────────

  async createNotification(input: CreateNotificationInput): Promise<{ id: string } | null> {
    // Per-type opt-out: skip insert if the user has explicitly disabled this type.
    // Channel-side gating (push_messages / email_offers) still happens in
    // deliverNotification(); this gate prevents the in-app row from being created.
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { notificationPreferences: true },
    });
    // The user may no longer exist (e.g. a stale BullMQ job referencing a
    // deleted/reseeded user). Skip the insert rather than letting the
    // notifications_user_id_fkey foreign-key constraint reject it. See #216.
    if (!user) {
      return null;
    }
    const prefs = (user.notificationPreferences ?? {}) as NotificationPreferences;
    if (prefs.types && prefs.types[input.type] === false) {
      return null;
    }

    const notification = await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        data: input.data as Prisma.InputJsonValue,
        channels: input.channels as unknown as Prisma.InputJsonValue,
        actionUrl: input.actionUrl ?? null,
      },
    });

    // Queue async delivery for push/email
    if (input.channels.includes('push') || input.channels.includes('email')) {
      await notificationQueue.add('deliver', {
        notificationId: notification.id,
        userId: input.userId,
        channels: input.channels,
      });
    }

    return { id: notification.id };
  }

  // ── Unread Count ────────────────────────────────────────────

  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await prisma.notification.count({
      where: { userId, read: false, deletedAt: null },
    });
    return { count };
  }

  // ── Preferences ─────────────────────────────────────────────

  async getPreferences(userId: string): Promise<NotificationPreferences> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { notificationPreferences: true },
    });
    if (!user) throw new NotFoundError('User', userId);
    const stored = (user.notificationPreferences ?? {}) as NotificationPreferences;
    return { ...DEFAULT_PREFERENCES, ...stored, types: { ...(stored.types ?? {}) } };
  }

  async updatePreferences(
    userId: string,
    input: NotificationPreferences,
  ): Promise<NotificationPreferences> {
    const existing = await this.getPreferences(userId);
    const merged: NotificationPreferences = {
      ...existing,
      ...input,
      types: { ...(existing.types ?? {}), ...(input.types ?? {}) },
    };
    await prisma.user.update({
      where: { id: userId },
      data: { notificationPreferences: merged as unknown as Prisma.InputJsonValue },
    });
    return merged;
  }

  // ── Deliver (called by BullMQ worker) ───────────────────────

  async deliverNotification(notificationId: string): Promise<void> {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            fcmToken: true,
            notificationPreferences: true,
          },
        },
      },
    });
    if (!notification) return;

    const channels = notification.channels as string[];
    const prefs = (notification.user.notificationPreferences as Record<string, boolean>) ?? {};

    // Push notification
    if (channels.includes('push') && notification.user.fcmToken && prefs.push_messages !== false) {
      const result = await sendPush({
        token: notification.user.fcmToken,
        title: notification.title,
        body: notification.message,
        data: {
          notificationId: notification.id,
          type: notification.type,
          actionUrl: notification.actionUrl ?? '',
        },
      });
      if (result.sent) {
        await prisma.notification.update({
          where: { id: notificationId },
          data: { pushSent: true, pushSentAt: new Date() },
        });
      } else if (result.invalidToken) {
        // Clear stale FCM token so we stop trying to send to it
        console.warn(`[NOTIFICATIONS] Clearing invalid FCM token for user ${notification.userId}`);
        await prisma.user.update({
          where: { id: notification.userId },
          data: { fcmToken: null },
        });
      }
    }

    // Email notification
    if (channels.includes('email') && prefs.email_offers !== false) {
      await sendEmail({
        to: notification.user.email,
        subject: notification.title,
        text: notification.message,
      });
      await prisma.notification.update({
        where: { id: notificationId },
        data: { emailSent: true, emailSentAt: new Date() },
      });
    }
  }

  // ── List Notifications ──────────────────────────────────────

  async listNotifications(userId: string, query: ListNotificationsQuery) {
    const where: Prisma.NotificationWhereInput = {
      userId,
      deletedAt: null,
    };
    if (query.unreadOnly) where.read = false;
    if (query.type) where.type = query.type;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.notification.count({ where }),
    ]);

    const meta: PaginationMeta = {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    };

    return { notifications, meta };
  }

  // ── Mark Read ───────────────────────────────────────────────

  async markRead(userId: string, notificationId: string): Promise<void> {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId, deletedAt: null },
    });
    if (!notification) throw new NotFoundError('Notification', notificationId);

    await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true, readAt: new Date() },
    });
  }

  // ── Mark All Read ───────────────────────────────────────────

  async markAllRead(userId: string): Promise<{ count: number }> {
    const result = await prisma.notification.updateMany({
      where: { userId, read: false, deletedAt: null },
      data: { read: true, readAt: new Date() },
    });
    return { count: result.count };
  }

  // ── Delete Notification ─────────────────────────────────────

  async deleteNotification(userId: string, notificationId: string): Promise<void> {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId, deletedAt: null },
    });
    if (!notification) throw new NotFoundError('Notification', notificationId);

    await prisma.notification.update({
      where: { id: notificationId },
      data: { deletedAt: new Date() },
    });
  }
}
