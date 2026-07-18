import { redis } from '../../config/redis.js';

/**
 * Revoke every active session for a user: delete all stored refresh tokens and
 * bump the cached session version so in-flight access tokens are rejected on
 * their next request (see `authenticate` middleware, which compares the token's
 * `sessionVersion` against `auth:sv:{userId}`).
 *
 * Mirrors the private `invalidateAllSessions` / `invalidateUserSessions` helpers
 * in auth/admin services; extracted so moderation enforcement (#313) forces a
 * logout on suspend without duplicating the Redis key handling a third time.
 */
export async function revokeUserSessions(userId: string): Promise<void> {
  let cursor = '0';
  const keysToDelete: string[] = [];
  do {
    const [nextCursor, keys] = await redis.scan(
      cursor,
      'MATCH',
      `auth:refresh:${userId}:*`,
      'COUNT',
      100,
    );
    cursor = nextCursor;
    keysToDelete.push(...keys);
  } while (cursor !== '0');

  if (keysToDelete.length > 0) {
    await redis.del(...keysToDelete);
  }

  // Bump cached session version so in-flight access tokens are rejected
  await redis.incr(`auth:sv:${userId}`);
}
