import { Server as SocketIOServer } from 'socket.io';
import type { Server as HttpServer } from 'node:http';
import jwt from 'jsonwebtoken';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { env } from './env.js';
import { redis } from './redis.js';

let _io: SocketIOServer | null = null;

export interface SocketUser {
  sub: string;
  email: string;
  accountType: string;
  emailVerified: boolean;
  isAdmin: boolean;
  jti: string;
}

/**
 * Initialize Socket.IO server attached to the HTTP server.
 * Must be called after Fastify's app.listen() so the HTTP server exists.
 */
export function initSocketIO(httpServer: HttpServer): SocketIOServer {
  _io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.NODE_ENV === 'production'
        ? [env.FRONTEND_URL]
        : true,
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 20000,
    transports: ['websocket', 'polling'],
  });

  // Redis adapter for horizontal scaling (skip in test to avoid connection interference)
  if (env.NODE_ENV !== 'test') {
    const pubClient = new Redis(env.REDIS_URL);
    const subClient = pubClient.duplicate();
    _io.adapter(createAdapter(pubClient, subClient));
  }

  // JWT authentication middleware
  _io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as SocketUser;

      // Check blacklist
      const isBlacklisted = await redis.exists(`auth:blacklist:${decoded.jti}`);
      if (isBlacklisted) {
        return next(new Error('Token has been revoked'));
      }

      socket.data.user = decoded;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  return _io;
}

/**
 * Get the Socket.IO server instance.
 * Returns null if not initialized (safe for tests and service imports).
 */
export function getIO(): SocketIOServer | null {
  return _io;
}

/**
 * Reset the Socket.IO singleton. Used in tests to prevent
 * cross-contamination between parallel test files.
 */
export function resetIO(): void {
  _io = null;
}

// ── Presence helpers ──────────────────────────────────────────

const PRESENCE_TTL = 300; // 5 minutes

export async function setUserOnline(userId: string, socketId: string): Promise<void> {
  await redis.pipeline()
    .set(`presence:${userId}`, socketId, 'EX', PRESENCE_TTL)
    .set(`presence:socket:${socketId}`, userId, 'EX', PRESENCE_TTL)
    .exec();
}

export async function setUserOffline(socketId: string): Promise<void> {
  const userId = await redis.get(`presence:socket:${socketId}`);
  if (userId) {
    await redis.pipeline()
      .del(`presence:${userId}`)
      .del(`presence:socket:${socketId}`)
      .exec();
  }
}

export async function refreshPresence(userId: string, socketId: string): Promise<void> {
  await redis.pipeline()
    .expire(`presence:${userId}`, PRESENCE_TTL)
    .expire(`presence:socket:${socketId}`, PRESENCE_TTL)
    .exec();
}

export async function isUserOnline(userId: string): Promise<boolean> {
  return (await redis.exists(`presence:${userId}`)) === 1;
}
