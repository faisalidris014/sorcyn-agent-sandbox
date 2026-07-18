# Local Development Setup

> **TL;DR — Fastest path:** `bash scripts/install-sorcyn.sh && sorcyn bootstrap`.
> The launcher runs prerequisite checks, starts containers, installs deps, then
> hands the database off to `npm run db:bootstrap` (migrations, seed, and the
> derived test DB). The step-by-step guide below is the manual fallback.
>
> **Database specifics** are documented authoritatively in [DATABASE_CONFIG.md](DATABASE_CONFIG.md).
> To do the DB step by hand: `cd backend && cp .env.example .env` (edit
> `DATABASE_URL`), then `npm run db:bootstrap`. If login ever fails on the sim,
> run `npm run db:doctor`. For prerequisite/environment issues, run
> `npm run doctor`. Working as a pair? See [OPERATOR_SYNC.md](OPERATOR_SYNC.md).

## Prerequisites

- **Node.js** 20+ LTS — `nvm install 20 && nvm use 20`
- **Docker Desktop** — download from <https://www.docker.com/products/docker-desktop/>, **launch the app, and leave it running** before any `docker compose` command. The Docker daemon is what `docker compose up -d` actually talks to; if it isn't running you'll get a cryptic "Cannot connect to the Docker daemon" error.
- **npm** (ships with Node.js)

> If anything below fails, run `npm run doctor` from `backend/` — it checks Docker, Node, `.env`, and that Postgres/Redis are reachable, with a clear remediation message per failure.

## 1. Start Infrastructure

```bash
# Confirm Docker Desktop is running first
docker info > /dev/null && echo "Docker OK" || echo "Start Docker Desktop"

# From project root
docker compose up -d
```

This starts:
- **PostgreSQL 15** on port `5433` (container: `rm-postgres`)
- **Redis 7** on port `6379` (container: `rm-redis`)
- **MinIO** (S3-compatible object storage) on `9000` (API) / `9001` (console),
  container `rm-minio`. The one-shot `rm-minio-setup` creates the
  `reverse-marketplace` bucket with public-read access. This is the local
  stand-in for Cloudflare R2 so **file uploads work in dev with no shared
  secrets** — `storage.ts` falls back to MinIO when `R2_ACCOUNT_ID` is unset.
  Console UI: <http://localhost:9001> (`minioadmin` / `minioadmin`).

Port 5433 is used because local Mac PostgreSQL often occupies 5432.

Verify containers are running:
```bash
docker compose ps
```

## 2. Install Dependencies

```bash
cd backend
npm install
```

## 3. Configure Environment

```bash
cp .env.example .env
```

**Required variables** (minimum for local dev):

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/reverse_marketplace
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=<32+ char string>
JWT_REFRESH_SECRET=<32+ char string>
```

**Optional but recommended:**

```env
SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0  # Error tracking
```

Most other variables (Stripe, SendGrid, FCM, Gemini, Google Maps) are optional for local development — without them, those features operate as stubs (logging instead of sending).

**Exception — file uploads (R2/MinIO):** uploads do **not** stub; they need an S3 backend. Local dev uses the **MinIO** container above, and `.env.example` ships with `R2_PUBLIC_URL=http://localhost:9000/reverse-marketplace` and the R2 credential vars left unset so `storage.ts` uses the MinIO fallback. Do **not** set `R2_ACCOUNT_ID` to a placeholder — any truthy value disables the fallback and breaks dev uploads. Production sets real Cloudflare R2 credentials via Doppler.

Full list of environment variables is in `backend/.env.example`.

For Firebase Cloud Messaging setup, see [FCM_SETUP.md](FCM_SETUP.md).

## 4. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run migrations (creates all 15 tables)
npx prisma migrate dev

# Seed database (38 categories + 4 test users)
npx prisma db seed
```

After seeding, apply the full-text search trigger:

```bash
# Connect to PostgreSQL and run the custom migration
docker exec -i rm-postgres psql -U postgres -d reverse_marketplace < prisma/custom-migrations/001_search_vector_trigger.sql
```

## 5. Start Development Server

```bash
npm run dev
```

Server starts at `http://localhost:3000` with:
- Health check: `GET /health`
- Swagger UI: `http://localhost:3000/docs`
- Socket.IO: auto-attached to the same HTTP server (no separate port)
- Pretty-printed logs (pino-pretty) in development mode

### Socket.IO (Real-time Messaging)

Socket.IO starts automatically with the dev server — no additional configuration needed. It attaches to the HTTP server on port 3000 alongside the REST API.

CORS is configured to allow all origins in development mode. In production, set the `FRONTEND_URL` environment variable to restrict WebSocket origins.

## 6. Flutter Mobile App Setup

### Prerequisites

- **Flutter SDK** 3.16+ (Dart 3.2+)
- Xcode (for iOS), Android Studio (for Android), or Chrome (for web)

```bash
# Install Flutter dependencies
cd mobile
flutter pub get

# Generate JSON serialization code (required after model changes)
dart run build_runner build --delete-conflicting-outputs

# Verify setup
flutter analyze    # Should show 0 errors
flutter build web  # Should compile successfully
```

### Running the App

> **The backend dev server (Section 5) must be running in another terminal.** The Flutter app makes HTTP calls to it on every screen — without it, login and every other action fails with `Unable to connect. Check your internet connection.` See [Troubleshooting → Connection errors](#connection-errors-on-login-or-any-api-call) below.

`--dart-define=API_BASE_URL` is **optional** on the iOS simulator, Android emulator, and web — `EnvConfig` (`mobile/lib/core/config/env_config.dart`) picks the right URL for each platform automatically. It's only required on physical devices, where the simulator-host trick doesn't apply.

```bash
# Web — defaults to http://localhost:3000/api/v1
flutter run -d chrome

# iOS Simulator — defaults to http://localhost:3000/api/v1
flutter run -d "iPhone 17 Pro"

# Android Emulator — defaults to http://10.0.2.2:3000/api/v1 (special host alias)
flutter run -d android

# Physical device — override with your Mac's LAN IP (Mac and device on the same network)
MAC_IP=$(ipconfig getifaddr en0)                # Wi-Fi interface
flutter run -d <device-udid> --dart-define=API_BASE_URL=http://${MAC_IP}:3000/api/v1
# Get the UDID from `flutter devices`. Use the UDID, not the device name —
# names often contain a curly apostrophe that breaks shell quoting.
# Requirements: same Wi-Fi network, macOS firewall allows inbound on node,
# backend listens on *:3000 (default for `npm run dev`).
```

### Environment Configuration

The API base URL is configured at compile time via `--dart-define`. Defaults are platform-aware:

| Platform | Default `API_BASE_URL` | Notes |
|---|---|---|
| Web (Chrome) | `http://localhost:3000/api/v1` | Browser shares host network |
| iOS Simulator | `http://localhost:3000/api/v1` | Simulator shares host network |
| Android Emulator | `http://10.0.2.2:3000/api/v1` | `10.0.2.2` is the emulator's alias for the host loopback |
| Physical device | _(must override via `--dart-define`)_ | Use the Mac's LAN IP, e.g. `http://192.168.1.42:3000/api/v1` |

### Testing on a physical iOS / Android device

The backend binds to `0.0.0.0:3000` (see `backend/src/config/env.ts`), so it serves both `localhost` (for the sim/emulator/web) and the Mac's LAN IP (for the physical phone) **at the same time** — you can run the simulator and the physical device side-by-side against one backend.

The only friction is that the phone has to point at the Mac's LAN IP, which changes when you change Wi-Fi networks. Use the helper:

```bash
# Phone and Mac on the same Wi-Fi, backend already running
./mobile/scripts/run-device.sh                  # auto-resolves Mac LAN IP, runs Flutter
./mobile/scripts/run-device.sh -d <device-id>   # target a specific device
```

The script resolves `ipconfig getifaddr en0` (falls back to `en1`) and passes the result as `--dart-define=API_BASE_URL=http://<lan-ip>:3000/api/v1`. If it can't find an IP, plug into Wi-Fi or run `ipconfig getifaddr en0` manually to debug.

**If requests time out but Safari on the phone can load `http://<mac-lan-ip>:3000/health`** → macOS firewall is blocking inbound on port 3000. Open *System Settings → Network → Firewall → Options* and either allow `node` or turn the firewall off for testing.

**Production safety.** `--dart-define` is a build-time flag scoped to the current `flutter run` invocation. It does not change `EnvConfig` defaults, the backend, or any release artifact. Running `flutter build ipa` for production uses whatever `API_BASE_URL` the release pipeline passes (typically the prod API URL), so dev LAN-IP usage is fully decoupled from production builds. The verbose dev-mode error message in `dio_client.dart` is also gated on `EnvConfig.isProduction` (driven by `dart.vm.product`), so release builds keep the generic user-facing string.

### Flutter Dependencies

Key packages used (see `mobile/pubspec.yaml`):

| Package | Purpose |
|---|---|
| `flutter_riverpod` | State management |
| `dio` | HTTP client |
| `go_router` | Declarative routing with auth guards |
| `flutter_secure_storage` | Encrypted token storage |
| `json_annotation` + `json_serializable` | JSON model generation |
| `intl` | Date/currency formatting + i18n |
| `socket_io_client` | Real-time WebSocket communication (Socket.IO) |
| `flutter_localizations` | i18n/localization support (10 languages) |
| `url_launcher` | External links (Stripe onboarding) |
| `logger` | Dev logging |

### After Model Changes

If you modify any `@JsonSerializable()` model, regenerate the `.g.dart` files:

```bash
cd mobile
dart run build_runner build --delete-conflicting-outputs
```

## Available Scripts

| Script | Command | Description |
|---|---|---|
| `npm run dev` | `tsx watch src/server.ts` | Dev server with hot reload |
| `npm run build` | `tsc` | Compile TypeScript |
| `npm start` | `node dist/server.js` | Run compiled output |
| `npm test` | `vitest` | Run tests in watch mode |
| `npm run test:run` | `vitest run` | Run tests once |
| `npm run test:ci` | `vitest run --reporter=verbose` | Run tests with verbose output (for CI) |
| `npm run test:coverage` | `vitest run --coverage` | Run tests with coverage report |
| `npm run typecheck` | `tsc --noEmit` | Type-check without emitting |
| `npm run start:prod` | `NODE_ENV=production node dist/server.js` | Run compiled output in production mode |
| `npm run validate` | `typecheck && test:run` | Run typecheck + tests (pre-push check) |
| `npm run db:migrate` | `prisma migrate dev` | Run pending migrations |
| `npm run db:seed` | `tsx prisma/seed.ts` | Seed the database |
| `npm run db:studio` | `prisma studio` | Open Prisma Studio GUI |
| `npm run db:generate` | `prisma generate` | Regenerate Prisma client |
| `npm run doctor` | `../scripts/check-prereqs.sh` | Verify Docker daemon, Node version, `.env`, and Postgres/Redis reachability |
| `npm run bootstrap` | doctor → install → migrate → seed | One-command first-time setup for new contributors |

## Test Users (After Seeding)

| Email | Password | Role | Location |
|---|---|---|---|
| `buyer@test.com` | `TestPassword123!` | Buyer | Dallas, TX |
| `seller@test.com` | `TestPassword123!` | Seller | Fort Worth, TX |
| `both@test.com` | `TestPassword123!` | Both | Arlington, TX |
| `admin@reversemarketplace.com` | `AdminSecure456!` | Admin | Dallas, TX |

## API Testing

For a complete step-by-step guide to testing all API endpoints via Swagger UI, see [API_TESTING_GUIDE.md](API_TESTING_GUIDE.md).

**Note:** Stripe onboarding checks are bypassed in development mode (`NODE_ENV=development`), so you can test the full buyer-seller flow (post → offer → accept → transaction → complete → review) without a real Stripe account.

### API Test Scripts (Shell-based, Session 13)

A comprehensive curl-based test suite is available for testing all API endpoints against a running server.

**Prerequisites:** `curl`, `jq` (install with: `brew install jq`), server running at localhost:3000, Docker containers running.

```bash
cd backend/scripts/api-tests

# Run all 14 test suites in order
./run-all.sh

# Run a single suite
./run-all.sh 06-posts.sh

# Run all + clean up test data after
./run-all.sh --clean
```

**14 test suites:** health, auth, categories, users, sellers, posts, offers, transactions, messages, payments, reviews, notifications, admin, search.

State is preserved across suites via `_state.sh` (tokens, user IDs, resource IDs), so suites can depend on data created by earlier suites.

## Troubleshooting

### Connection errors on login (or any API call)

If the Flutter app shows `Unable to connect. Check your internet connection.` (or, in dev builds after PR #81, `Cannot reach API at <url>. Is the backend running?`), the simulator/emulator/browser cannot reach the Fastify dev server. Run through this checklist in order:

1. **Is the backend running?** In another terminal: `cd backend && npm run dev`. Wait for `Server listening at http://0.0.0.0:3000`. If you see `EADDRINUSE`, something else is bound to port 3000 — find it with `lsof -i :3000`.
2. **Does the backend answer locally?** From the Mac host: `curl -sS http://localhost:3000/health` should print JSON with `"status":"ok"` (or similar). If this fails, the backend never started cleanly — re-check step 1's log for stack traces.
3. **Can the simulator/emulator reach it?**
   - iOS Simulator: open Safari inside the sim and visit `http://localhost:3000/health` — should render the JSON.
   - Android Emulator: open the emulator's Chrome and visit `http://10.0.2.2:3000/health`.
   - Physical device: visit `http://<your-mac-lan-ip>:3000/health` from the device's browser. If that fails, the Mac firewall or LAN isolation is blocking inbound port 3000.
4. **Is the Flutter app pointing at the right URL?** Defaults handle iOS sim / Android emulator / web. Physical devices need `--dart-define=API_BASE_URL=http://<mac-lan-ip>:3000/api/v1`. The resolved value is `EnvConfig.apiBaseUrl` in `mobile/lib/core/config/env_config.dart`.

### Port conflicts
If PostgreSQL fails to start, another process may be using port 5433:
```bash
lsof -i :5433
```

### Prisma client issues
If you see "PrismaClient is not generated", regenerate:
```bash
npx prisma generate
```

### Docker volumes
To completely reset the database:
```bash
docker compose down -v
docker compose up -d
npx prisma migrate dev
npx prisma db seed
```

## Running Tests

```bash
cd backend

# Vitest — watch mode
npm test

# Vitest — run once
npm run test:run

# curl-based API scripts (requires running server + Docker)
cd scripts/api-tests
./run-all.sh
```

**233+ tests** across 14 Vitest test files + 14 curl-based API suites. See [TESTING.md](TESTING.md) for the complete testing guide, patterns, helper function reference, and per-file breakdown.

## Verifying the Database is Seeded

```bash
# Option 1: Prisma Studio (web GUI)
npx prisma studio
# Check User table (4 rows) and Category table (38 rows)

# Option 2: Direct SQL
docker exec -i rm-postgres psql -U postgres -d reverse_marketplace -c "SELECT COUNT(*) FROM users;"
docker exec -i rm-postgres psql -U postgres -d reverse_marketplace -c "SELECT COUNT(*) FROM categories;"
```

## Production Deployment (Docker)

### Prerequisites

- Docker Engine 24+
- A `.env.production` file in `backend/` (copy from `.env.example`, set all production values including `DATABASE_URL`, `REDIS_URL`, JWT secrets, Stripe keys, `NODE_ENV=production`)

### Build and Run

```bash
# Start all services (PostgreSQL 15 + Redis 7 + API)
docker compose -f docker-compose.production.yml up -d --build

# Run database migrations
docker compose -f docker-compose.production.yml exec api npx prisma migrate deploy

# Seed database (first deploy only)
docker compose -f docker-compose.production.yml exec api npx prisma db seed

# Verify
curl http://localhost:3000/health
```

### Services

| Service | Image | Port | Health Check |
|---|---|---|---|
| PostgreSQL 15 | `postgres:15-alpine` | Internal only | `pg_isready` every 10s |
| Redis 7 | `redis:7-alpine` | Internal only | `redis-cli ping` every 10s |
| API | `backend/Dockerfile` | 3000 (host) | `GET /health` every 30s |

Data is persisted via Docker volumes (`pgdata`, `redisdata`).

## CI/CD Pipeline

Pull requests to `main` automatically run:
1. **Typecheck** — `tsc --noEmit` (catches type errors before slower test job)
2. **Tests** — Full Vitest suite against PostgreSQL 15 + Redis 7 service containers

On merge to `main`:
3. **Docker Build** — Validates the production Docker image builds successfully (no push)

The pipeline is defined in `.github/workflows/ci.yml`. No manual setup required for contributors.

### Running CI Checks Locally

```bash
cd backend
npm run validate   # runs typecheck + tests
```

## Built In

- **Session 1:** Infrastructure setup, database, seed data
- **Session 2:** JWT env vars, test suite setup
- **Session 3:** 31 additional tests (users + sellers), R2 storage env vars (optional for local dev)
- **Session 4:** 32 additional tests (categories + posts), full-text search trigger setup
- **Session 5:** 41 additional tests (offers + transactions)
- **Session 6:** 18 payment tests (Stripe SDK mocked), Stripe env vars (optional for local dev)
- **Session 7:** 42 additional tests (notifications + messages + reviews), SendGrid/FCM env vars (optional for local dev)
- **Session 8:** 13 AI assist tests (Gemini SDK mocked), `GEMINI_API_KEY` env var (optional for local dev)
- **Session 9:** 26 admin tests, shared test helpers (`tests/helpers.ts`)
- **Session 10:** Flutter project setup, dependencies, core layer, auth screens, build_runner generation
- **Session 11:** Added `intl` package, 4 data models + repositories + providers, 12 new screens
- **Session 12:** Added `url_launcher` package, seller data layer, feed feature, 10 new screens, mode toggle
- **Session 13:** Added `socket.io` + `socket_io_client` + `flutter_localizations` packages, Socket.IO integration tests, API test scripts (14 curl-based suites)
- **Post-Session 13:** Docker multi-stage production build, `docker-compose.production.yml`, CI/CD pipeline (GitHub Actions), request-id tracing middleware, `test:ci` and `validate` scripts
