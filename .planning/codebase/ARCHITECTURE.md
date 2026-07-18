# Architecture

**Analysis Date:** 2025-02-27

## Pattern Overview

**Overall:** Modular Monolith with Service-Oriented Design

**Key Characteristics:**
- Layered architecture (routes → services → data access)
- Domain-driven module organization (auth, posts, offers, payments, etc.)
- Zod-based request/response validation with automatic OpenAPI documentation
- Centralized error handling and middleware stack
- Redis-backed job queue for async operations
- Postgres database with Prisma ORM
- Prepared for microservices extraction (each module is independently testable)

## Layers

**HTTP/Routes Layer:**
- Purpose: Handle incoming HTTP requests, route to appropriate handlers, validate request schemas
- Location: `backend/src/modules/*/[module].routes.ts` (e.g., `backend/src/modules/auth/auth.routes.ts`)
- Contains: Fastify route handlers, request/response schema validation, security decorators (auth guards)
- Depends on: Service layer, Zod schemas, Fastify plugins
- Used by: Fastify app initialization in `backend/src/app.ts`

**Service Layer:**
- Purpose: Implement business logic, coordinate data access, manage state transitions
- Location: `backend/src/modules/*/[module].service.ts` (e.g., `backend/src/modules/posts/posts.service.ts`)
- Contains: Domain logic, authorization checks, calculation, orchestration between repositories
- Depends on: Data access (Prisma), external services (Stripe, SendGrid), utilities
- Used by: Routes layer for request handling

**Data Access/ORM Layer:**
- Purpose: Query and mutate database records with type safety
- Location: Prisma client (`backend/src/config/database.ts`) used directly in services
- Contains: Database schema in `backend/prisma/schema.prisma`, migrations in `backend/prisma/migrations/`
- Depends on: PostgreSQL, Prisma
- Used by: All services

**Infrastructure/Config Layer:**
- Purpose: Initialize and manage external service connections
- Location: `backend/src/config/` (database.ts, redis.ts, stripe.ts, env.ts, bullmq.ts, gemini.ts)
- Contains: Connection initialization, configuration validation, singleton instances
- Depends on: Environment variables, external services (Stripe, Google Gemini, SendGrid, Firebase)
- Used by: Services, middleware, job workers

**Middleware Layer:**
- Purpose: Cross-cutting concerns for all requests
- Location: `backend/src/common/middleware/`
- Contains: `authenticate.ts` (JWT validation + token blacklist check), `error-handler.ts` (unified error transformation)
- Depends on: Redis (for token blacklist), JWT, Zod error handling
- Used by: Fastify app during route registration

**Utilities/Helpers Layer:**
- Purpose: Reusable functions for common operations
- Location: `backend/src/common/utils/` and `backend/src/common/types/`
- Contains:
  - `errors.ts` - AppError base class and specific error types (NotFoundError, UnauthorizedError, etc.)
  - `storage.ts` - File upload/download to Cloudflare R2 (S3-compatible)
  - `email.ts` - SendGrid email sending (with fallback stub)
  - `push.ts` - Firebase Cloud Messaging push notifications
  - `fees.ts` - Fee calculation logic
  - `api.ts` - Response envelope types (ApiResponse, ApiError)
- Depends on: External service SDKs
- Used by: Services, routes

## Data Flow

**Standard Request Flow:**

1. HTTP Request arrives at Fastify app
2. CORS + Helmet + Rate Limit middleware process request
3. Route handler extracts and validates request (Zod schema)
4. Authentication middleware validates JWT + checks token blacklist (Redis)
5. Route handler calls Service method
6. Service implements business logic:
   - Validates permissions (user ownership, role checks)
   - Queries database via Prisma
   - Performs calculations/transformations
   - Calls external services if needed (Stripe, SendGrid, Google Gemini)
   - Raises AppError on validation failures
7. Service returns typed response object
8. Route handler returns HTTP response
9. Error Handler middleware catches any AppError and transforms to RFC 7807 Problem Details format

**Asynchronous Job Flow (via BullMQ):**

1. Service enqueues a job to Redis queue (e.g., `notificationQueue.add()`)
2. BullMQ Worker picks up job from queue
3. Worker imports and calls the corresponding service method
4. Service executes async work (sending notifications, processing reminders)
5. Worker marks job complete or failed

**Payment Flow (Stripe Connect):**

1. Buyer accepts offer → Service creates transaction record (status: "in_progress")
2. Buyer initiates payment → Service creates Stripe PaymentIntent
3. Buyer completes payment → Stripe webhook arrives at `backend/src/modules/payments/payments.webhook.ts`
4. Webhook handler updates transaction to capture payment status
5. Buyer confirms work completion → Service moves transaction to "approved"
6. Service releases escrow funds to seller Stripe account

**State Management:**

- **Database:** Primary source of truth for all domain data (users, posts, offers, transactions)
- **Redis:** Used for:
  - Token blacklist (during logout)
  - Job queue (BullMQ notifications, review reminders)
  - Rate limiting (Fastify rate-limit plugin)
- **In-Memory:** Only for Fastify decorators and service class instances

## Key Abstractions

**AppError Hierarchy:**
- Purpose: Unified error handling and API error response formatting
- Location: `backend/src/common/utils/errors.ts`
- Pattern: Base `AppError` class with statusCode and `toResponse()` method
- Subclasses: `NotFoundError` (404), `UnauthorizedError` (401), `ForbiddenError` (403), `ValidationError` (400), `ConflictError` (409)
- Usage: Services throw AppError subclasses → error handler middleware catches and formats as RFC 7807 Problem Details

**Zod Schemas:**
- Purpose: Validate and document API requests/responses
- Location: `backend/src/modules/*/[module].schemas.ts`
- Pattern: Export Zod schema and infer TypeScript types: `export const registerSchema = z.object({...}); type RegisterInput = z.infer<typeof registerSchema>;`
- Feature: Automatically generates OpenAPI documentation via `fastify-type-provider-zod`

**Service Classes:**
- Purpose: Encapsulate business logic per domain
- Pattern: Stateless classes instantiated per request
- Example: `PostsService`, `PaymentsService`, `TransactionsService`
- Methods are organized by operation (createPost, updatePost, listMyPosts, etc.)

**Prisma Models:**
- Purpose: Type-safe database access
- Location: Schema definitions in `backend/prisma/schema.prisma`
- Pattern: Soft deletes via `deletedAt` field, UUID primary keys, JSONB for flexible category data
- Example tables: `users`, `posts`, `offers`, `transactions`, `seller_profiles`, `reviews`

## Entry Points

**Server Start:**
- Location: `backend/src/server.ts`
- Triggers: `npm run dev` (development) or `npm start` (production)
- Responsibilities:
  1. Build Fastify app via `buildApp()` from `app.ts`
  2. Connect to PostgreSQL via Prisma
  3. Connect to Redis
  4. Start BullMQ workers for async jobs
  5. Listen on port (default 3000)
  6. Set up graceful shutdown handlers for SIGTERM/SIGINT

**HTTP Health Check:**
- Location: `backend/src/app.ts` line 100-104
- Endpoint: `GET /health`
- Response: `{ status: "ok", timestamp, version }`
- Purpose: Kubernetes/container orchestration probe

**API Routes:**
- Base prefix: `/api/v1/`
- Routes registered in `backend/src/app.ts` lines 107-120:
  - `/api/v1/auth/*` - Register, login, refresh, password reset
  - `/api/v1/users/*` - Profile management
  - `/api/v1/sellers/*` - Seller profile, onboarding
  - `/api/v1/categories/*` - Browse categories
  - `/api/v1/posts/*` - Create, list, search posts
  - `/api/v1/offers/*` - Submit, accept, decline offers
  - `/api/v1/transactions/*` - Track transaction status
  - `/api/v1/payments/*` - Create payment intent, webhook handler
  - `/api/v1/messages/*` - In-app messaging
  - `/api/v1/reviews/*` - Submit reviews, list seller reviews
  - `/api/v1/notifications/*` - Get notifications
  - `/api/v1/admin/*` - Admin-only endpoints
  - `/docs` - Swagger UI with auto-generated API docs

**Webhook Entry Point:**
- Location: `backend/src/modules/payments/payments.webhook.ts`
- Endpoint: POST `/api/v1/payments/webhook`
- Triggers: Stripe webhook events
- Responsibilities: Update transaction payment status, trigger next workflow steps

## Error Handling

**Strategy:** Fail fast with typed errors, transform to standard HTTP responses

**Patterns:**

1. **Service-level validation:**
```typescript
// In service method
if (!user) throw new NotFoundError('User');
if (user.emailVerified === false) throw new ForbiddenError('Email must be verified');
if (count >= limit) throw new ConflictError('Maximum posts reached');
```

2. **Error middleware transformation:**
```typescript
// Error handler catches AppError and transforms:
if (error instanceof AppError) {
  reply.status(error.statusCode).send({
    success: false,
    error: error.toResponse()  // Converts to RFC 7807 format
  });
}
```

3. **Zod validation errors:**
```typescript
// Caught by middleware and formatted with field-level errors
if (error instanceof ZodError) {
  // Transform to field errors: { "email": ["Invalid email format"] }
}
```

## Cross-Cutting Concerns

**Logging:**
- Framework: Pino (via Fastify)
- Level: Configured via `LOG_LEVEL` env var (default: "info")
- Pretty format in dev, structured JSON in production
- Usage: `app.log.info()`, `app.log.error()` in services

**Validation:**
- Framework: Zod 4
- Strategy: Schema-first - define request schema in `[module].schemas.ts`, Fastify automatically validates
- Error format: Field-level errors collected and returned in error response
- Location: Schemas in `backend/src/modules/*/[module].schemas.ts`

**Authentication:**
- Strategy: JWT Bearer tokens + Redis token blacklist
- Access token expiry: 15 minutes (default, configurable)
- Refresh token expiry: 30 days (default, configurable)
- Token invalidation: On logout, token ID added to blacklist in Redis
- Location: Service in `backend/src/modules/auth/auth.service.ts`, middleware in `backend/src/common/middleware/authenticate.ts`

**Authorization:**
- Pattern: Check `request.user.accountType` and ownership
- Example: Only buyer can create payment intent; only transaction parties can view details
- Implementation: Service-level checks before database queries

**Rate Limiting:**
- Framework: Fastify rate-limit plugin
- Default: 1000 requests per hour globally
- Per-endpoint: Some routes have stricter limits (e.g., login: 10/minute, register: 3/hour)
- Location: Configured in route handler via `config.rateLimit` option

---

*Architecture analysis: 2025-02-27*
