import Fastify from 'fastify';
import * as Sentry from '@sentry/node';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import compress from '@fastify/compress';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import {
  serializerCompiler,
  validatorCompiler,
  jsonSchemaTransform,
} from 'fastify-type-provider-zod';
import { env } from './config/env.js';
import { getLogger } from './config/logtail.js';
import { prisma } from './config/database.js';
import { redis } from './config/redis.js';
import { errorHandler } from './common/middleware/error-handler.js';
import { registerAuthenticate } from './common/middleware/authenticate.js';
import { registerRequestContext } from './common/middleware/locale.js';
import { registerRequestId } from './common/middleware/request-id.js';
import { registerMetrics } from './common/middleware/metrics.js';
import { notificationQueue, autoReleaseQueue } from './config/bullmq.js';
import authRoutes from './modules/auth/auth.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import sellersRoutes from './modules/sellers/sellers.routes.js';
import categoriesRoutes from './modules/categories/categories.routes.js';
import postsRoutes from './modules/posts/posts.routes.js';
import searchRoutes from './modules/search/search.routes.js';
import offersRoutes from './modules/offers/offers.routes.js';
import transactionsRoutes from './modules/transactions/transactions.routes.js';
import paymentsRoutes from './modules/payments/payments.routes.js';
import paymentsWebhook from './modules/payments/payments.webhook.js';
import messagesRoutes from './modules/messages/messages.routes.js';
import reviewsRoutes from './modules/reviews/reviews.routes.js';
import notificationsRoutes from './modules/notifications/notifications.routes.js';
import uploadsRoutes from './modules/uploads/uploads.routes.js';
import disputesRoutes from './modules/disputes/disputes.routes.js';
import payoutsRoutes from './modules/payouts/payouts.routes.js';
import savedSearchesRoutes from './modules/saved-searches/saved-searches.routes.js';
import savedSellersRoutes from './modules/saved-sellers/saved-sellers.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import healthRoutes from './modules/health/health.routes.js';
import {
  announcementsRoutes,
  adminAnnouncementsRoutes,
} from './modules/announcements/announcements.routes.js';
import { testRoutes } from './modules/test/test.routes.js';
import { providerRegistry } from './modules/sellers/category-verification.js';
import { TdlrProvider } from './modules/sellers/providers/tdlr-provider.js';

export async function buildApp() {
  // Phase 4 D-07 — Fastify uses the lazy-singleton logger from
  // backend/src/config/logtail.ts so structured logs flow to Better Stack
  // when BETTER_STACK_TOKEN is set (production), and stdout-only in dev/test.
  const app = Fastify({
    loggerInstance: getLogger(),
    trustProxy: true,
  });

  // Phase 4 D-05 — wire Sentry Fastify error handler. Safe no-op when
  // SENTRY_DSN is unset (initSentry short-circuits before init runs).
  Sentry.setupFastifyErrorHandler(app);

  // #337 (epic #334 Phase 3) — register the TX TDLR license adapter so
  // electrical/hvac category requests auto-decide via the Texas Open Data API.
  // Off by default; an empty registry falls back to the manual queue
  // (escrow-safe, never optimistic-unlock).
  if (env.TDLR_VERIFICATION_ENABLED && !providerRegistry.has('TX_TDLR')) {
    providerRegistry.set('TX_TDLR', new TdlrProvider());
  }

  // Zod type provider (auto-validates requests + generates Swagger docs)
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Custom JSON parser — gracefully handles empty bodies for POST/DELETE
  // routes that have no body schema (e.g. extend, mark-filled, archive).
  // Must remove the default parser first, then re-add.
  app.removeContentTypeParser('application/json');
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (_req, body, done) => {
    if (!body || (typeof body === 'string' && body.trim() === '')) {
      done(null, undefined);
      return;
    }
    try {
      done(null, JSON.parse(body as string));
    } catch (err) {
      done(err as Error, undefined);
    }
  });

  // Security
  const isProd = env.NODE_ENV === 'production';
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        // Swagger UI needs 'unsafe-inline' — only allow in non-production
        scriptSrc: isProd ? ["'self'"] : ["'self'", "'unsafe-inline'"],
        styleSrc: isProd ? ["'self'"] : ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        ...(isProd ? { upgradeInsecureRequests: [] } : {}),
      },
    },
    crossOriginEmbedderPolicy: false,
  });
  await app.register(compress, { threshold: 1024 });
  await app.register(cors, {
    origin: env.NODE_ENV === 'production'
      ? [env.FRONTEND_URL]
      : true,
    credentials: true,
  });
  if (env.NODE_ENV !== 'test') {
    await app.register(rateLimit, {
      max: 1000,
      timeWindow: '1 hour',
      keyGenerator: (request) => {
        // Per-user limiting when authenticated, per-IP otherwise
        const user = (request as any).user;
        return user?.sub ?? request.ip;
      },
    });
  }

  // Auth
  await app.register(jwt, {
    secret: env.JWT_ACCESS_SECRET,
    sign: { expiresIn: env.JWT_ACCESS_EXPIRY },
  });
  await app.register(cookie);

  // Authenticate decorator (must be after jwt + cookie)
  registerAuthenticate(app);

  // Request ID (x-request-id header for tracing)
  registerRequestId(app);

  // Request context (locale + marketplace context)
  registerRequestContext(app);

  // Prometheus metrics (/metrics endpoint + request duration tracking)
  registerMetrics(app);

  // API Documentation — disabled in production unless ENABLE_SWAGGER=true
  if (!isProd || env.ENABLE_SWAGGER) {
    await app.register(swagger, {
      openapi: {
        info: {
          title: 'Reverse Marketplace API',
          description: 'API for the Reverse Marketplace platform',
          version: '1.0.0',
        },
        servers: [{ url: env.APP_URL }],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            },
          },
        },
      },
      transform: jsonSchemaTransform,
    });
    await app.register(swaggerUi, {
      routePrefix: '/docs',
    });
  }

  // Error handler
  app.setErrorHandler(errorHandler);

  // Health check
  app.get('/health', async (_request, reply) => {
    const checks: Record<string, 'ok' | 'error'> = {};
    let healthy = true;

    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = 'ok';
    } catch {
      checks.database = 'error';
      healthy = false;
    }

    try {
      await redis.ping();
      checks.redis = 'ok';
    } catch {
      checks.redis = 'error';
      healthy = false;
    }

    // Queue health (non-critical — degraded, not down)
    try {
      const [notifWaiting, notifActive, releaseWaiting, releaseActive] = await Promise.all([
        notificationQueue.getWaitingCount(),
        notificationQueue.getActiveCount(),
        autoReleaseQueue.getWaitingCount(),
        autoReleaseQueue.getActiveCount(),
      ]);
      (checks as any).queues = 'ok';
      (checks as any).queueMetrics = {
        notifications: { waiting: notifWaiting, active: notifActive },
        autoRelease: { waiting: releaseWaiting, active: releaseActive },
      };
    } catch {
      (checks as any).queues = 'error';
    }

    const status = healthy ? 'ok' : 'degraded';
    return reply.status(healthy ? 200 : 503).send({
      status,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: Math.floor(process.uptime()),
      memoryMB: Math.floor(process.memoryUsage().rss / 1024 / 1024),
      checks,
    });
  });

  // Liveness probe (TICKET-001) — dependency-free /healthz, registered at root
  // alongside the /health readiness probe above.
  await app.register(healthRoutes);

  // API routes
  await app.register(authRoutes, { prefix: '/api/v1/auth' });
  await app.register(usersRoutes, { prefix: '/api/v1/users' });
  await app.register(sellersRoutes, { prefix: '/api/v1/sellers' });
  await app.register(categoriesRoutes, { prefix: '/api/v1/categories' });
  await app.register(postsRoutes, { prefix: '/api/v1/posts' });
  await app.register(searchRoutes, { prefix: '/api/v1/search' });
  await app.register(offersRoutes, { prefix: '/api/v1/offers' });
  await app.register(transactionsRoutes, { prefix: '/api/v1/transactions' });
  await app.register(paymentsRoutes, { prefix: '/api/v1/payments' });
  await app.register(paymentsWebhook, { prefix: '/api/v1/payments' });
  await app.register(messagesRoutes, { prefix: '/api/v1/messages' });
  await app.register(reviewsRoutes, { prefix: '/api/v1/reviews' });
  await app.register(notificationsRoutes, { prefix: '/api/v1/notifications' });
  await app.register(uploadsRoutes, { prefix: '/api/v1/uploads' });
  await app.register(disputesRoutes, { prefix: '/api/v1/disputes' });
  await app.register(payoutsRoutes, { prefix: '/api/v1/payouts' });
  await app.register(savedSearchesRoutes, { prefix: '/api/v1/saved-searches' });
  await app.register(savedSellersRoutes, { prefix: '/api/v1/saved-sellers' });
  await app.register(adminRoutes, { prefix: '/api/v1/admin' });
  await app.register(announcementsRoutes, { prefix: '/api/v1/announcements' });
  await app.register(adminAnnouncementsRoutes, { prefix: '/api/v1/admin/announcements' });

  // Phase 4 D-08 — staging-only chaos endpoint (primary gate: NODE_ENV check at registration;
  // belt-and-suspenders: module-level guard inside testRoutes plugin)
  if (env.NODE_ENV !== 'production') {
    await app.register(testRoutes, { prefix: '/api/v1' });
  }

  return app;
}
