import type { Server as SocketIOServer, Socket } from 'socket.io';
import { prisma } from '../../config/database.js';
import {
  setUserOnline,
  setUserOffline,
  refreshPresence,
  type SocketUser,
} from '../../config/socket.js';

// ── Per-socket rate limiter ────────────────────────────────
// Tracks event counts in sliding windows per socket.
// Returns true if the event should be allowed, false if rate-limited.

interface RateBucket { count: number; resetAt: number }
const socketBuckets = new WeakMap<Socket, Map<string, RateBucket>>();

const EVENT_LIMITS: Record<string, { max: number; windowMs: number }> = {
  join_conversation: { max: 10, windowMs: 60_000 },   // 10/min
  typing_start:      { max: 30, windowMs: 60_000 },   // 30/min
  typing_stop:       { max: 30, windowMs: 60_000 },   // 30/min
  heartbeat:         { max: 12, windowMs: 60_000 },   // 12/min
};

function checkSocketRateLimit(socket: Socket, event: string): boolean {
  const limit = EVENT_LIMITS[event];
  if (!limit) return true;

  let buckets = socketBuckets.get(socket);
  if (!buckets) {
    buckets = new Map();
    socketBuckets.set(socket, buckets);
  }

  const now = Date.now();
  let bucket = buckets.get(event);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + limit.windowMs };
    buckets.set(event, bucket);
  }

  bucket.count++;
  return bucket.count <= limit.max;
}

// ── Track violations for disconnection ��───────────────────
const violationCounts = new WeakMap<Socket, number>();
const MAX_VIOLATIONS = 5;

function handleRateLimitViolation(socket: Socket, event: string): void {
  const count = (violationCounts.get(socket) ?? 0) + 1;
  violationCounts.set(socket, count);
  socket.emit('error', { message: `Rate limit exceeded for ${event}` });

  if (count >= MAX_VIOLATIONS) {
    socket.disconnect(true);
  }
}

/**
 * Register all messaging-related WebSocket event handlers.
 * Called once after Socket.IO is initialized.
 */
export function registerMessagesGateway(io: SocketIOServer): void {
  io.on('connection', async (socket: Socket) => {
    const user = socket.data.user as SocketUser;
    const userId = user.sub;

    // Join user's personal room for direct notifications
    socket.join(`user:${userId}`);

    // Register all event handlers SYNCHRONOUSLY before any `await` below.
    // The client emits (e.g. `join_conversation`) immediately after its
    // `connect` event fires. If we awaited anything first, those emits could
    // arrive before the listeners exist and Socket.IO would silently drop
    // them — surfacing as flaky "Timeout waiting for joined_conversation"
    // failures under load (slower Redis widens the gap). Presence tracking
    // is awaited only after all handlers are wired up.

    socket.on('join_conversation', async (conversationId: string) => {
      if (!checkSocketRateLimit(socket, 'join_conversation')) {
        return handleRateLimitViolation(socket, 'join_conversation');
      }
      if (typeof conversationId !== 'string') return;

      try {
        // Verify the user is a participant
        const convo = await prisma.conversation.findFirst({
          where: {
            id: conversationId,
            OR: [
              { participant1Id: userId },
              { participant2Id: userId },
            ],
            deletedAt: null,
          },
          select: { id: true },
        });

        if (!convo) {
          socket.emit('error', { message: 'Conversation not found or access denied' });
          return;
        }

        socket.join(`conv:${conversationId}`);
        socket.emit('joined_conversation', { conversationId });
      } catch (err) {
        socket.emit('error', { message: 'Failed to join conversation' });
      }
    });

    socket.on('leave_conversation', (conversationId: string) => {
      if (typeof conversationId !== 'string') return;
      socket.leave(`conv:${conversationId}`);
    });

    socket.on('typing_start', (conversationId: string) => {
      if (!checkSocketRateLimit(socket, 'typing_start')) {
        return handleRateLimitViolation(socket, 'typing_start');
      }
      if (typeof conversationId !== 'string') return;
      // Broadcast to everyone in the conversation except the sender
      socket.to(`conv:${conversationId}`).emit('typing_start', {
        conversationId,
        userId,
        firstName: user.email.split('@')[0], // Fallback; client should use cached name
      });
    });

    socket.on('typing_stop', (conversationId: string) => {
      if (!checkSocketRateLimit(socket, 'typing_stop')) {
        return handleRateLimitViolation(socket, 'typing_stop');
      }
      if (typeof conversationId !== 'string') return;
      socket.to(`conv:${conversationId}`).emit('typing_stop', {
        conversationId,
        userId,
      });
    });

    // Heartbeat to refresh presence TTL
    socket.on('heartbeat', async () => {
      if (!checkSocketRateLimit(socket, 'heartbeat')) return;
      await refreshPresence(userId, socket.id);
    });

    socket.on('disconnect', async () => {
      await setUserOffline(socket.id);
    });

    // Track online presence. Done last so handler registration above is never
    // delayed behind this Redis round-trip (see comment at top of handler).
    await setUserOnline(userId, socket.id);
  });
}
