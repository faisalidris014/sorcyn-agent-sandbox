import { z } from 'zod';

export const listNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).describe('Page number'),
  limit: z.coerce.number().int().min(1).max(50).default(20).describe('Results per page'),
  unreadOnly: z.coerce.boolean().default(false).describe('Only show unread notifications'),
  type: z.string().max(50).optional().describe('Filter by type (e.g. offer_received, message_new)'),
});

export const notificationIdParamsSchema = z.object({
  notificationId: z.string().uuid('Invalid notification ID').describe('Notification UUID'),
});

// Internal schema — used by service, not by routes
export const createNotificationSchema = z.object({
  userId: z.string().uuid().describe('Target user UUID'),
  type: z.string().max(50).describe('Notification type (e.g. offer_received)'),
  title: z.string().max(255).describe('Notification title'),
  message: z.string().describe('Notification message body'),
  data: z.record(z.string(), z.any()).default({}).describe('Additional data payload'),
  channels: z.array(z.enum(['push', 'email', 'in_app'])).default(['push', 'in_app']).describe('Delivery channels'),
  actionUrl: z.string().optional().describe('URL to navigate to on tap'),
});

// Per-user notification preferences. All keys optional → omitted = default true.
// `types.{type}` gates insertion; legacy `push_messages` / `email_offers` /
// `sms_offers` keep gating channel-side delivery in deliverNotification().
export const notificationPreferencesSchema = z.object({
  push_messages: z.boolean().optional(),
  email_offers: z.boolean().optional(),
  sms_offers: z.boolean().optional(),
  types: z.record(z.string(), z.boolean()).optional(),
});

export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;
