import Redis from 'ioredis';
import { env } from './env.js';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  retryStrategy(times) {
    if (times > 10) return null;
    return Math.min(times * 200, 5000);
  },
  reconnectOnError(err) {
    // Reconnect on READONLY errors (common during Redis failover)
    return err.message.includes('READONLY');
  },
});

redis.on('error', (err) => {
  console.error('[Redis] Connection error:', err.message);
});

redis.on('reconnecting', (ms: number) => {
  console.warn(`[Redis] Reconnecting in ${ms}ms...`);
});
