import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { redis } from '../../config/redis.js';
import {
  NotFoundError,
  ConflictError,
} from '../../common/utils/errors.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { getIO } from '../../config/socket.js';
import type { PaginationMeta } from '../../common/types/api.js';
import type {
  ListConversationsQuery,
  GetConversationMessagesQuery,
  SendMessageInput,
  ReportConversationInput,
} from './messages.schemas.js';

const RATE_LIMIT_MAX = 50;
const RATE_LIMIT_WINDOW = 3600; // 1 hour in seconds

// Detects mentions of external payment services
const PAYMENT_REGEX = /\b(venmo|cashapp|cash\s*app|zelle|paypal|send\s*money|pay\s*me)\b/i;

// Detects contact info sharing (phone, email, address)
const PHONE_REGEX = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const ADDRESS_REGEX = /\b\d{1,5}\s+(?:[A-Za-z]+\s+){1,4}(?:St|Street|Ave|Avenue|Blvd|Boulevard|Dr|Drive|Ln|Lane|Ct|Court|Rd|Road|Way|Pl|Place)\b/i;

// ── Deal-context derivation (inbox row) ──────────────────────
// Shapes the post/offer/transaction into a compact `deal` object the
// conversations list renders as: listing photo, amount, escrow state,
// and a 0..1 ring progress. Perspective-aware: a pending offer reads as
// "new_offer" to the buyer (needs a reply) and "offer_sent" to the seller.

type DealState = 'new_offer' | 'offer_sent' | 'in_escrow' | 'completed' | 'none';

const toNum = (d: Prisma.Decimal | null | undefined): number | null =>
  d == null ? null : Number(d);

// post.photos is Json — either ["url", ...] or [{ url }, ...]. Take the first.
function firstPhotoUrl(photos: unknown): string | null {
  if (!Array.isArray(photos) || photos.length === 0) return null;
  const first = photos[0];
  if (typeof first === 'string') return first;
  if (first && typeof first === 'object' && typeof (first as { url?: unknown }).url === 'string') {
    return (first as { url: string }).url;
  }
  return null;
}

// Coarse escrow progress by transaction lifecycle status (0..1) for the ring arc.
function escrowProgress(status: string): number {
  switch (status) {
    case 'in_progress':
    case 'scheduled':
    case 'pending_start':
    case 'preparing_shipment':
      return 0.2;
    case 'on_the_way':
    case 'started':
    case 'shipped':
    case 'in_transit':
    case 'meetup_scheduled':
    case 'in_progress_milestone':
      return 0.5;
    case 'changes_requested':
      return 0.6;
    case 'delivered':
    case 'qr_scanned':
    case 'meetup_complete':
    case 'awaiting_approval':
      return 0.85;
    case 'approved':
    case 'completed':
      return 1;
    default:
      return 0.35;
  }
}

function deriveDeal(
  post: { photos: unknown; budgetMin: Prisma.Decimal | null; budgetMax: Prisma.Decimal | null } | null,
  offer: { status: string; quoteAmount: Prisma.Decimal; counterAmount: Prisma.Decimal | null } | null,
  transaction: { status: string; escrowStatus: string; totalCharged: Prisma.Decimal | null; quoteAmount: Prisma.Decimal } | null,
  isBuyer: boolean,
) {
  const photoUrl = firstPhotoUrl(post?.photos);
  // Show the agreed deal price (quote), not the fee-inflated charge.
  const amount =
    toNum(offer?.counterAmount) ??
    toNum(offer?.quoteAmount) ??
    toNum(transaction?.quoteAmount) ??
    toNum(transaction?.totalCharged) ??
    toNum(post?.budgetMax) ??
    toNum(post?.budgetMin);

  let state: DealState = 'none';
  let progress: number | null = null;

  if (transaction) {
    const done =
      transaction.escrowStatus === 'released' ||
      transaction.status === 'completed' ||
      transaction.status === 'approved';
    state = done ? 'completed' : 'in_escrow';
    progress = escrowProgress(transaction.status);
  } else if (offer) {
    switch (offer.status) {
      case 'pending':
      case 'needs_reconfirmation':
        state = isBuyer ? 'new_offer' : 'offer_sent';
        break;
      case 'counter_offered':
        state = 'offer_sent';
        break;
      case 'accepted':
        state = 'in_escrow';
        progress = 0.1; // accepted, payment/escrow not yet funded
        break;
      default: // declined / withdrawn / expired
        state = 'none';
    }
  }

  return { photoUrl, amount, state, progress };
}

export class MessagesService {
  private notificationsService = new NotificationsService();

  // ── List Conversations ──────────────────────────────────────

  async listConversations(userId: string, query: ListConversationsQuery) {
    const where: Prisma.ConversationWhereInput = {
      // Match the caller as a participant AND exclude threads they've hidden
      // (Edit-mode Delete) from their own inbox only.
      OR: [
        { participant1Id: userId, hiddenAtP1: null },
        { participant2Id: userId, hiddenAtP2: null },
      ],
      deletedAt: null,
    };
    if (query.status) where.status = query.status;

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        orderBy: { lastMessageAt: { sort: 'desc', nulls: 'last' } },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          participant1: { select: { id: true, firstName: true, lastName: true, profilePhotoUrl: true } },
          participant2: { select: { id: true, firstName: true, lastName: true, profilePhotoUrl: true } },
          post: { select: { id: true, title: true, photos: true, budgetMin: true, budgetMax: true } },
          offer: { select: { status: true, quoteAmount: true, counterAmount: true } },
          transaction: { select: { status: true, escrowStatus: true, totalCharged: true, quoteAmount: true } },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { messageText: true, createdAt: true, senderId: true },
          },
        },
      }),
      prisma.conversation.count({ where }),
    ]);

    const mapped = conversations.map((c) => {
      const isP1 = c.participant1Id === userId;
      const otherParticipant = isP1 ? c.participant2 : c.participant1;
      const unreadCount = isP1 ? c.unreadCountP1 : c.unreadCountP2;
      const lastMessage = c.messages[0] ?? null;

      return {
        id: c.id,
        postId: c.postId,
        offerId: c.offerId,
        status: c.status,
        isLocked: c.lockedAt != null,
        otherParticipant,
        // The other participant's role in this thread, for the Buyers/Sellers
        // inbox filter. P1=buyer, P2=seller, so the counterpart is the opposite
        // of the caller's own role.
        otherRole: isP1 ? 'seller' : 'buyer',
        unreadCount,
        // Deal context for the inbox row (photo, amount, escrow state + ring progress).
        // isP1 === buyer (P1=buyer, P2=seller — see acceptOffer / findOrCreateOfferConversation).
        deal: deriveDeal(c.post, c.offer, c.transaction, isP1),
        lastMessage: lastMessage
          ? {
              text: lastMessage.messageText.substring(0, 100),
              sentAt: lastMessage.createdAt,
              isOwn: lastMessage.senderId === userId,
            }
          : null,
        lastMessageAt: c.lastMessageAt,
        createdAt: c.createdAt,
      };
    });

    const meta: PaginationMeta = {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    };

    return { conversations: mapped, meta };
  }

  // ── Get Conversation (with messages) ────────────────────────

  async getConversation(userId: string, conversationId: string, query: GetConversationMessagesQuery) {
    const convo = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ participant1Id: userId }, { participant2Id: userId }],
        deletedAt: null,
      },
      include: {
        participant1: { select: { id: true, firstName: true, lastName: true, profilePhotoUrl: true } },
        participant2: { select: { id: true, firstName: true, lastName: true, profilePhotoUrl: true } },
        post: { select: { id: true, title: true } },
      },
    });
    if (!convo) throw new NotFoundError('Conversation', conversationId);

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { conversationId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          sender: { select: { id: true, firstName: true, lastName: true, profilePhotoUrl: true } },
        },
      }),
      prisma.message.count({ where: { conversationId, deletedAt: null } }),
    ]);

    const meta: PaginationMeta = {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    };

    return {
      conversation: {
        id: convo.id,
        postId: convo.postId,
        offerId: convo.offerId,
        status: convo.status,
        isLocked: convo.lockedAt != null,
        participant1: convo.participant1,
        participant2: convo.participant2,
        post: convo.post,
      },
      messages: messages.reverse(), // oldest-first for display
      meta,
    };
  }

  // ── Send Message ────────────────────────────────────────────

  async sendMessage(userId: string, conversationId: string, input: SendMessageInput) {
    const convo = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ participant1Id: userId }, { participant2Id: userId }],
        deletedAt: null,
        status: 'active',
      },
    });
    if (!convo) throw new NotFoundError('Conversation', conversationId);

    // Locked once the transaction completes (buyer-approved or 7-day auto-release).
    // Thread stays visible/readable but no new messages may be sent. Reopened by the
    // future dispute-resolution flow (docs/dispute-reopen-design.md).
    if (convo.lockedAt) {
      throw new ConflictError('This conversation is closed because the transaction is complete');
    }

    // Rate limit: 50 messages/hour
    const rateKey = `msg:rate:${userId}`;
    const count = await redis.incr(rateKey);
    if (count === 1) await redis.expire(rateKey, RATE_LIMIT_WINDOW);
    if (count > RATE_LIMIT_MAX) throw new ConflictError('Message rate limit exceeded (50/hour)');

    // Check if contact sharing is allowed (transaction completed/approved)
    let contactSharingAllowed = false;
    if (convo.transactionId) {
      const tx = await prisma.transaction.findUnique({
        where: { id: convo.transactionId },
        select: { status: true },
      });
      if (tx && ['completed', 'approved', 'awaiting_approval'].includes(tx.status)) {
        contactSharingAllowed = true;
      }
    } else if (convo.offerId) {
      const tx = await prisma.transaction.findFirst({
        where: { offerId: convo.offerId, deletedAt: null },
        select: { status: true },
      });
      if (tx && ['completed', 'approved', 'awaiting_approval'].includes(tx.status)) {
        contactSharingAllowed = true;
      }
    }

    // Flag external payment mentions (always flagged regardless of transaction)
    const hasPaymentMention = PAYMENT_REGEX.test(input.messageText);
    // Flag contact info only when payment hasn't been made
    const hasContactInfo = !contactSharingAllowed && (
      PHONE_REGEX.test(input.messageText) ||
      EMAIL_REGEX.test(input.messageText) ||
      ADDRESS_REGEX.test(input.messageText)
    );

    const flagged = hasPaymentMention || hasContactInfo;
    const flagReason = hasPaymentMention
      ? 'external_payment'
      : hasContactInfo
        ? 'contact_info_before_payment'
        : null;

    const isP1 = convo.participant1Id === userId;
    const recipientId = isP1 ? convo.participant2Id : convo.participant1Id;

    // Create message + update conversation atomically
    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId,
          senderId: userId,
          messageText: input.messageText,
          attachments: input.attachments as unknown as Prisma.InputJsonValue,
          flagged,
          flagReason,
          moderationStatus: flagged ? 'pending' : 'approved',
        },
        include: {
          sender: { select: { id: true, firstName: true, lastName: true, profilePhotoUrl: true } },
        },
      }),
      prisma.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageAt: new Date(),
          // A new message resurfaces the thread for a recipient who had hidden it.
          ...(isP1
            ? { unreadCountP2: { increment: 1 }, hiddenAtP2: null }
            : { unreadCountP1: { increment: 1 }, hiddenAtP1: null }),
        },
      }),
    ]);

    // Notify recipient (async, non-blocking)
    this.notificationsService.createNotification({
      userId: recipientId,
      type: 'message_received',
      title: 'New Message',
      message: `${message.sender.firstName}: ${input.messageText.substring(0, 100)}`,
      data: { conversationId, messageId: message.id },
      channels: ['push', 'in_app'],
      actionUrl: `/conversations/${conversationId}`,
    }).catch((err) => console.error('[NOTIFY ERROR]', err));

    const messagePayload = {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      messageText: message.messageText,
      attachments: message.attachments,
      flagged: message.flagged,
      read: message.read,
      sender: message.sender,
      createdAt: message.createdAt,
    };

    // Emit real-time event via Socket.IO (graceful no-op if not initialized)
    const io = getIO();
    if (io) {
      io.to(`conv:${conversationId}`).emit('new_message', messagePayload);
      io.to(`user:${recipientId}`).emit('notification', {
        type: 'message_received',
        conversationId,
        message: messagePayload,
      });
    }

    return messagePayload;
  }

  // ── Mark Conversation Read ──────────────────────────────────

  async markRead(userId: string, conversationId: string): Promise<void> {
    const convo = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ participant1Id: userId }, { participant2Id: userId }],
        deletedAt: null,
      },
    });
    if (!convo) throw new NotFoundError('Conversation', conversationId);

    const isP1 = convo.participant1Id === userId;

    await prisma.$transaction([
      prisma.conversation.update({
        where: { id: conversationId },
        data: isP1 ? { unreadCountP1: 0 } : { unreadCountP2: 0 },
      }),
      prisma.message.updateMany({
        where: {
          conversationId,
          senderId: { not: userId },
          read: false,
        },
        data: { read: true, readAt: new Date() },
      }),
    ]);

    // Emit read receipt via Socket.IO
    const io = getIO();
    if (io) {
      io.to(`conv:${conversationId}`).emit('messages_read', {
        conversationId,
        readBy: userId,
        readAt: new Date().toISOString(),
      });
    }
  }

  // ── Mark Conversation Unread ────────────────────────────────

  // Edit-mode "Mark unread": bumps the caller's unread count to at least 1 and
  // flips the most recent inbound message back to unread so the row re-bolds.
  async markUnread(userId: string, conversationId: string): Promise<void> {
    const convo = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ participant1Id: userId }, { participant2Id: userId }],
        deletedAt: null,
      },
    });
    if (!convo) throw new NotFoundError('Conversation', conversationId);

    const isP1 = convo.participant1Id === userId;
    const currentUnread = isP1 ? convo.unreadCountP1 : convo.unreadCountP2;
    if (currentUnread > 0) return; // already unread — no-op

    const lastInbound = await prisma.message.findFirst({
      where: { conversationId, senderId: { not: userId }, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    await prisma.$transaction([
      prisma.conversation.update({
        where: { id: conversationId },
        data: isP1 ? { unreadCountP1: 1 } : { unreadCountP2: 1 },
      }),
      ...(lastInbound
        ? [
            prisma.message.update({
              where: { id: lastInbound.id },
              data: { read: false, readAt: null },
            }),
          ]
        : []),
    ]);
  }

  // ── Delete (hide) Conversation for the caller ───────────────

  // Edit-mode "Delete": hides the thread from the caller's inbox only by stamping
  // their per-participant hiddenAt. The other participant still sees it, and a new
  // message clears the flag (see sendMessage). Idempotent.
  async deleteConversation(userId: string, conversationId: string): Promise<void> {
    const convo = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ participant1Id: userId }, { participant2Id: userId }],
        deletedAt: null,
      },
    });
    if (!convo) throw new NotFoundError('Conversation', conversationId);

    const isP1 = convo.participant1Id === userId;
    await prisma.conversation.update({
      where: { id: conversationId },
      data: isP1 ? { hiddenAtP1: new Date() } : { hiddenAtP2: new Date() },
    });
  }

  // ── Report Conversation ─────────────────────────────────────

  async reportConversation(userId: string, conversationId: string, input: ReportConversationInput): Promise<void> {
    const convo = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ participant1Id: userId }, { participant2Id: userId }],
        deletedAt: null,
      },
    });
    if (!convo) throw new NotFoundError('Conversation', conversationId);

    await prisma.message.updateMany({
      where: { conversationId },
      data: {
        flagged: true,
        flagReason: input.reason.substring(0, 50),
        moderationStatus: 'pending',
      },
    });
  }

  // ── Resolve Conversation by Post (current user as participant) ──

  // Used by the seller's post-detail "Message" button to open the existing
  // buyer↔seller thread (created when the seller submitted an offer). Throws
  // NotFoundError (404) when no thread exists yet, which the client treats as
  // "submit an offer first".
  async getConversationByPost(userId: string, postId: string) {
    const convo = await prisma.conversation.findFirst({
      where: {
        postId,
        deletedAt: null,
        OR: [{ participant1Id: userId }, { participant2Id: userId }],
      },
      include: {
        participant1: { select: { id: true, firstName: true, lastName: true, profilePhotoUrl: true } },
        participant2: { select: { id: true, firstName: true, lastName: true, profilePhotoUrl: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { messageText: true, createdAt: true, senderId: true },
        },
      },
    });
    if (!convo) throw new NotFoundError('Conversation for post', postId);

    const isP1 = convo.participant1Id === userId;
    const lastMessage = convo.messages[0] ?? null;
    return {
      id: convo.id,
      postId: convo.postId,
      offerId: convo.offerId,
      status: convo.status,
      isLocked: convo.lockedAt != null,
      otherParticipant: isP1 ? convo.participant2 : convo.participant1,
      unreadCount: isP1 ? convo.unreadCountP1 : convo.unreadCountP2,
      lastMessage: lastMessage
        ? {
            text: lastMessage.messageText.substring(0, 100),
            sentAt: lastMessage.createdAt,
            isOwn: lastMessage.senderId === userId,
          }
        : null,
      lastMessageAt: convo.lastMessageAt,
      createdAt: convo.createdAt,
    };
  }

  // ── Find-or-Create the Offer Conversation (seeded with the pitch) ──

  // Called from OffersService.submitOffer. Creates the buyer↔seller thread for a
  // post on first offer and seeds it with the seller's "Message to Buyer" pitch.
  // Idempotent on the (post, participant pair) so resubmitting after a decline
  // reuses the existing thread (re-pointed at the live offer) instead of duplicating.
  async findOrCreateOfferConversation(params: {
    buyerUserId: string;
    sellerUserId: string;
    postId: string;
    offerId: string;
    firstMessage?: string | null;
  }): Promise<{ id: string; created: boolean }> {
    const { buyerUserId, sellerUserId, postId, offerId, firstMessage } = params;

    const existing = await prisma.conversation.findFirst({
      where: {
        postId,
        deletedAt: null,
        OR: [
          { participant1Id: buyerUserId, participant2Id: sellerUserId },
          { participant1Id: sellerUserId, participant2Id: buyerUserId },
        ],
      },
      select: { id: true },
    });
    if (existing) {
      await prisma.conversation.update({ where: { id: existing.id }, data: { offerId } });
      return { id: existing.id, created: false };
    }

    const convo = await prisma.conversation.create({
      data: {
        participant1Id: buyerUserId, // P1 = buyer, P2 = seller (matches acceptOffer)
        participant2Id: sellerUserId,
        postId,
        offerId,
        status: 'active',
      },
      select: { id: true },
    });

    const pitch = firstMessage?.trim();
    if (pitch) {
      // Seed the seller's pitch as the first message; buyer (P1) is the recipient.
      // Run the same moderation as a normal message for consistency.
      const flaggedPayment = PAYMENT_REGEX.test(pitch);
      const flaggedContact =
        PHONE_REGEX.test(pitch) || EMAIL_REGEX.test(pitch) || ADDRESS_REGEX.test(pitch);
      const flagged = flaggedPayment || flaggedContact;
      const flagReason = flaggedPayment
        ? 'external_payment'
        : flaggedContact
          ? 'contact_info_before_payment'
          : null;

      await prisma.$transaction([
        prisma.message.create({
          data: {
            conversationId: convo.id,
            senderId: sellerUserId,
            messageText: pitch,
            attachments: [] as unknown as Prisma.InputJsonValue,
            flagged,
            flagReason,
            moderationStatus: flagged ? 'pending' : 'approved',
          },
        }),
        prisma.conversation.update({
          where: { id: convo.id },
          data: { lastMessageAt: new Date(), unreadCountP1: { increment: 1 } },
        }),
      ]);
    }

    return { id: convo.id, created: true };
  }

  // ── Lock a Conversation on Transaction Completion ──────────────

  // Makes the thread read-only when its linked transaction completes (buyer-approved
  // or 7-day auto-release). Idempotent and never throws on a missing thread, so it is
  // safe to call from the completion hooks without risking the money path.
  async lockConversationByTransactionId(transactionId: string): Promise<void> {
    await prisma.conversation.updateMany({
      where: { transactionId, lockedAt: null, deletedAt: null },
      data: { lockedAt: new Date() },
    });
  }
}
