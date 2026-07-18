import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';
import { redis } from '../../config/redis.js';

// Extend Fastify types for JWT payload
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      sub: string;
      email: string;
      accountType: string;
      emailVerified: boolean;
      isAdmin: boolean;
      jti: string;
      sv?: number; // sessionVersion — absent in tokens issued before this change
    };
    user: {
      sub: string;
      email: string;
      accountType: string;
      emailVerified: boolean;
      isAdmin: boolean;
      jti: string;
      sv?: number;
    };
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

// FastifyInstance is widened with `any` generics so the helper accepts the
// concrete instance produced by Fastify({ loggerInstance: pino(...) }), whose
// Logger generic narrows past the default FastifyBaseLogger. Only `decorate`
// is used, which is invariant over the Logger generic.
export function registerAuthenticate(app: FastifyInstance<any, any, any, any, any>): void {
  app.decorate(
    'authenticate',
    async (request: FastifyRequest, _reply: FastifyReply) => {
      try {
        // Verify JWT signature and expiry
        await request.jwtVerify();

        // Check if token has been blacklisted (logout) or session invalidated
        // Fail-open: if Redis is unreachable, allow the request through
        // since access tokens are short-lived (15min) and the JWT itself is valid
        try {
          const pipeline = redis.pipeline();
          pipeline.exists(`auth:blacklist:${request.user.jti}`);
          if (request.user.sv !== undefined) {
            pipeline.get(`auth:sv:${request.user.sub}`);
          }
          const results = await pipeline.exec();

          // Check blacklist
          const isBlacklisted = results?.[0]?.[1] as number;
          if (isBlacklisted) {
            throw new UnauthorizedError('Token has been revoked');
          }

          // Check session version — reject if stale (privilege changed since token issued)
          if (request.user.sv !== undefined && results?.[1]) {
            const currentSv = results[1][1] as string | null;
            if (currentSv !== null && Number(currentSv) > request.user.sv) {
              throw new UnauthorizedError('Session invalidated due to account changes. Please log in again.');
            }
          }
        } catch (redisErr) {
          if (redisErr instanceof UnauthorizedError) throw redisErr;
          request.log.warn('Redis unavailable for blacklist check — allowing valid JWT');
        }
      } catch (err) {
        if (err instanceof UnauthorizedError) throw err;
        throw new UnauthorizedError('Invalid or expired token');
      }
    },
  );

  app.decorate(
    'requireAdmin',
    async (request: FastifyRequest, _reply: FastifyReply) => {
      if (!request.user.isAdmin) {
        throw new ForbiddenError('Admin access required');
      }
    },
  );
}
