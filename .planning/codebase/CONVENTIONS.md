# Coding Conventions

**Analysis Date:** 2026-02-27

## Naming Patterns

**Files:**
- Route files: `{module}.routes.ts` (e.g., `auth.routes.ts`)
- Service files: `{module}.service.ts` (e.g., `auth.service.ts`)
- Schema/validation files: `{module}.schemas.ts` (e.g., `auth.schemas.ts`)
- Utility files: `{purpose}.ts` (e.g., `errors.ts`, `storage.ts`, `email.ts`)
- Middleware files: `{name}.ts` (e.g., `error-handler.ts`, `authenticate.ts`)
- Config files: `{service}.ts` (e.g., `env.ts`, `database.ts`, `redis.ts`)

**Functions:**
- Public async methods: camelCase (e.g., `createPaymentIntent`, `getUserById`, `verifyEmail`)
- Private methods: prefixed with `private`, camelCase (e.g., `private generateAccessToken`)
- Helper functions: camelCase (e.g., `hashToken`, `parseExpiry`, `authHeaders`)
- Email helper functions: `send{Purpose}Email` pattern (e.g., `sendVerificationEmail`, `sendPasswordResetEmail`)

**Variables:**
- Constants (uppercase with underscores): `BCRYPT_ROUNDS`, `EMAIL_VERIFY_TTL`, `MAX_LOGIN_ATTEMPTS`
- Object properties and local vars: camelCase (e.g., `accessToken`, `userEmail`, `isVerified`)
- Redux-style flags: camelCase booleans (e.g., `rememberMe`, `emailVerified`, `isAdmin`)
- Database/Prisma fields: snake_case in schema, camelCase in JavaScript (auto-converted by Prisma)

**Types & Interfaces:**
- Interfaces: PascalCase (e.g., `ApiResponse`, `TestUser`, `AuthTokens`, `AuthUser`)
- Enum variants: UPPER_SNAKE_CASE (defined in Zod enums or TypeScript enums)
- Branded types: PascalCase suffix `Input` or `Output` (e.g., `RegisterInput`, `CreatePostInput`)
- Inferred Zod types: use `z.infer<typeof schema>` with explicit type exports

**Classes:**
- Service classes: PascalCase ending in `Service` (e.g., `AuthService`, `UsersService`, `PostsService`)
- Error classes: PascalCase ending in `Error` (e.g., `AppError`, `NotFoundError`, `ValidationError`)

## Code Style

**Formatting:**
- No explicit formatter configured (ESLint installed but no .eslintrc in project root)
- TypeScript target: ES2022
- Module resolution: ESNext with ESM (`type: "module"` in package.json)
- Indentation: 2 spaces (inferred from codebase)

**Linting:**
- ESLint configured via `package.json` scripts: `lint` and `lint:fix`
- TypeScript strict mode enabled: `"strict": true` in tsconfig.json
- ESLint plugins: `@typescript-eslint/eslint-plugin` and `@typescript-eslint/parser`

**Line length:** No hard limit enforced; code examples show ~100-120 character average

## Import Organization

**Order:**
1. Node.js built-in modules (`import { randomBytes } from 'node:crypto'`)
2. Third-party dependencies (`import bcrypt from 'bcrypt'`)
3. Type imports (`import type { FastifyInstance } from 'fastify'`)
4. Local absolute imports using path aliases (`import { env } from '@config/env.js'`)
5. Local relative imports (rare; prefer aliases)

**Path Aliases:**
```
@/*        → ./src/*
@modules/* → ./src/modules/*
@common/*  → ./src/common/*
@config/*  → ./src/config/*
```

**Always include `.js` extension** in imports (ESM requirement):
```typescript
import { AuthService } from './auth.service.js';
import { buildApp } from '../src/app.js';
```

**Type imports:**
```typescript
import type { ApiResponse, ApiError } from '../common/types/api.js';
import type { CreatePostInput } from './posts.schemas.js';
```

## Error Handling

**Custom error class hierarchy:**
```typescript
AppError (base class with statusCode, type, errors)
├── NotFoundError
├── UnauthorizedError
├── ForbiddenError
├── ValidationError
└── ConflictError
```

**Throwing errors:**
```typescript
throw new NotFoundError('User', userId); // "User with id 'xyz' not found"
throw new ValidationError('Email already registered');
throw new ConflictError('Payment intent already exists');
```

**Error handler middleware** (`/src/common/middleware/error-handler.ts`):
- Catches `AppError` → RFC 7807 Problem Details format
- Catches `ZodError` → validation error with field-level details
- Catches Fastify built-in errors (rate limit, validation) → standardized response
- Unknown errors → 500 with safe message, logged to console

**Error response format:**
```typescript
{
  success: false,
  error: {
    type: "about:blank",
    title: "NotFoundError",
    status: 404,
    detail: "User with id 'xyz' not found",
    errors?: { field: ["error message"] } // Only for validation errors
  }
}
```

## Logging

**Framework:** Pino (configured with pino-pretty for development)

**Log level configuration:** Via `LOG_LEVEL` env var, default `'info'`

**When to log:**
- Console error only for unhandled exceptions: `console.error('Unhandled error:', error)`
- Use app logger for other cases (not yet deeply integrated; mostly uses error handler)

**Patterns observed:**
```typescript
// Pino is available via Fastify
app.log.info('message');
app.log.error('message');
// Direct console.error for emergencies only
console.error('Unhandled error:', error);
```

## Comments

**When to comment:**
- Section separators for method groupings: `// ── Register ──────────────────────────────────`
- Explaining non-obvious logic (e.g., timing-safe bcrypt compare, Redis key patterns)
- Security-related decisions (e.g., dummy hash to prevent enumeration)
- TTL constants with their purpose: `const EMAIL_VERIFY_TTL = 60 * 60 * 24; // 24 hours`

**JSDoc/TSDoc:**
- Used minimally in source code
- Schema fields have `.describe()` for Swagger docs
- Type definitions use inline comments for clarity

**Example:**
```typescript
// Timing-safe compare: always run bcrypt even if user not found
const hashToCompare = user?.passwordHash ?? DUMMY_HASH;
const isValid = await bcrypt.compare(password, hashToCompare);

const EMAIL_VERIFY_TTL = 60 * 60 * 24; // 24 hours
```

## Function Design

**Size:** Methods range 10–50 lines; service methods kept focused on single responsibility

**Parameters:**
- Pass typed objects when multiple related params exist
- Example: `async createPost(userId: string, input: CreatePostInput)` not `...input fields individually`
- Request/response wrapped in interface types (Zod-inferred when possible)

**Return values:**
- Async methods return `Promise<T>` with explicit type
- Void methods for side effects only (e.g., `logout`)
- Errors thrown rather than returned (no `Result<T, E>` pattern)
- Nullable returns wrapped in `T | null` explicitly

**Example:**
```typescript
async register(
  input: RegisterInput,
  ip: string,
): Promise<{ user: AuthUser; tokens: AuthTokens }> {
  // body
  return { user: this.toAuthUser(user), tokens };
}
```

## Module Design

**Exports:**
- Route file: `export default routeFunction` (default export as FastifyPluginAsync)
- Service/schemas: named exports (e.g., `export class AuthService`, `export const registerSchema`)
- Types: exported via `export type` or `export interface`

**Barrel files:**
- Not used; imports specify exact files
- Example: `import { AuthService } from './auth.service.js'` not from index

**Module structure within `src/modules/{name}/`:**
```
{name}/
├── {name}.routes.ts    # Route definitions and handlers
├── {name}.service.ts   # Business logic
└── {name}.schemas.ts   # Zod schemas + inferred types
```

**Service instantiation:**
```typescript
// In routes file
const authService = new AuthService(app);
const typedApp = app.withTypeProvider<ZodTypeProvider>();
```

## Request/Response Patterns

**Success responses:**
```typescript
return reply.status(201).send({ success: true, data: result });
return reply.send({ success: true, data: tokens });
return reply.send({
  success: true,
  data: { message: 'Email verified successfully' },
});
```

**Pagination:**
```typescript
{
  success: true,
  data: [...items],
  meta: {
    page: 1,
    limit: 10,
    total: 100,
    totalPages: 10
  }
}
```

**Endpoint rate limiting:** Configured per-route in handler options:
```typescript
config: { rateLimit: { max: 3, timeWindow: '1 hour' } }
```

## Constants and Configuration

**Environment variables:**
- Validated via Zod schema in `src/config/env.ts`
- Accessed as `env.VARIABLE_NAME`
- Type-safe with full intellisense
- Default values provided for non-critical vars

**Magic numbers:**
- Extracted to named constants at top of service/module
- Example: `const MAX_ACTIVE_POSTS = 10;`, `const EXTENSION_DAYS = 3;`

**TTLs in Redis:**
- Stored in seconds with comments indicating human-readable duration
- Consistent naming: `{PURPOSE}_TTL` (e.g., `EMAIL_VERIFY_TTL`, `LOGIN_LOCKOUT_TTL`)

---

*Convention analysis: 2026-02-27*
