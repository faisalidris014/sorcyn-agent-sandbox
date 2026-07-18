# Phase 4: Pre-Launch Hardening — Pattern Map

**Mapped:** 2026-04-30
**Files analyzed:** 32 (10 modify + 22 new)
**Analogs found:** 27 / 32 (5 net-new with no codebase analog — k6 scripts, OWASP/Snyk YAML, A11Y/UAT/PCI markdown, infra/canary-state.json — these inherit RESEARCH.md skeletons)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `.planning/intel/decisions.md` | docs (ADR registry) | append-only markdown | `.planning/intel/decisions.md` (existing 73 entries, lines 12–110) | EXACT (same file, append) |
| `CLAUDE.md` | docs (project rules) | append/edit markdown | `CLAUDE.md` "Critical Design Patterns" block (lines 189–199) | EXACT (same file, append) |
| `backend/tests/audit/closeout-audit.test.ts` | test (audit-as-CI-gate) | filesystem read + regex assertion | itself — Phase 3 26-assertion suite (lines 1–305) | EXACT (extend with new describe blocks) |
| `mobile/lib/features/sellers/presentation/screens/identity_verify_screen.dart` | NEW code (Flutter screen) | url_launcher + AppLifecycleState resume hook | `mobile/lib/features/sellers/presentation/screens/stripe_onboard_screen.dart` (lines 19–83) | EXACT (Phase 3 Stripe Onboard pattern, identical lifecycle shape) |
| `mobile/lib/features/sellers/providers/seller_provider.dart` | MODIFY code (Riverpod notifier) | repository call + state.copyWith | itself — `startStripeOnboarding` (lines 187–200) | EXACT (same file, append `startIdentityVerification` action mirroring Stripe) |
| `mobile/lib/features/sellers/data/repositories/seller_repository.dart` | MODIFY code (Dio repository) | POST → JSON unwrap | itself — `startStripeOnboarding` (lines 101–105) | EXACT (same file, append POST `/sellers/identity/verify`) |
| `mobile/lib/features/auth/presentation/screens/register_screen.dart` | MODIFY code (Flutter form) | conditional form field + Validators.regex | itself — `_AccountTypeSelector` toggle (lines 272–275, 397–500) and `AppInputField` block (lines 152–170) | EXACT (same file, gate EIN field on isBusiness toggle) |
| `mobile/lib/app.dart` | MODIFY code (GoRouter route table) | GoRoute registration with springPage | itself — `/seller/stripe-onboard` (lines 368–375) | EXACT (same file, copy stripe-onboard route shape) |
| `mobile/lib/features/posts/presentation/screens/manual_post_creation_screen.dart` | MODIFY code (Flutter form) | conditional UI gated on category type | itself — `_selectedCategory!.isProducts` ProductConditionPicker (lines 64, 75, 335) | EXACT (same file, mirror isProducts pattern with isJobs check) |
| `backend/tests/sellers.test.ts` | MODIFY test (Vitest integration) | app.inject HTTP + auth | `backend/tests/auth.test.ts` (any existing `describe('POST /api/v1/auth/...'` block via `helpers.ts`) | role-match (test pattern uniform across tests/*.test.ts per TESTING.md) |
| `backend/tests/auth.test.ts` | MODIFY test (Vitest integration) | app.inject HTTP + Zod negative case | itself — existing register tests + `closeout-audit.test.ts` lines 213–244 (registerSchema parse) | EXACT (same file pattern + audit suite already exercises EIN regex) |
| `backend/src/config/sentry.ts` | MODIFY config (lazy init) | SDK.init w/ tracesSampleRate + integrations | itself (lines 6–29) | EXACT (extend existing initSentry) |
| `mobile/lib/main.dart` | MODIFY config (Flutter SDK init) | SentryFlutter.init w/ tracesSampleRate | itself (lines 36–51) | EXACT (lower tracesSampleRate to 0.05) |
| `backend/src/config/logtail.ts` | NEW config (lazy singleton) | pino transport factory | `backend/src/config/stripe.ts` (lines 1–16, `getStripe()` lazy singleton) | EXACT (same lazy-init shape per CLAUDE.md "Lazy SDK init" rule) |
| `backend/src/config/env.ts` | MODIFY config (Zod validator) | env schema + validateProductionEnv gate | itself (lines 28–34 Stripe block + lines 86–109 prod-startup gate) | EXACT (same file, Phase 3 03-02 STRIPE_CONNECT_RETURN_URL pattern) |
| `.github/workflows/deploy-canary.yml` | NEW infra (GitHub Actions) | workflow_dispatch → SSH → docker compose | `.github/workflows/ci.yml` (lines 106–139, deploy job using appleboy/ssh-action@v1) | EXACT (extend existing SSH-deploy shape with environment gate) |
| `.github/workflows/rollback.yml` | NEW infra (GitHub Actions) | workflow_dispatch → SSH → nginx -s reload | `.github/workflows/ci.yml` (lines 113–123, SSH script block) | role-match (NEW file, copy SSH step shape) |
| `nginx/nginx.conf` | MODIFY infra (Nginx config) | upstream → ip_hash → weighted servers | itself (lines 40–43, current `upstream api { server api:3000; keepalive 32; }`) | EXACT (same file, extend single-server upstream to weighted pool) |
| `nginx/canary-state.json` | NEW infra (state file) | JSON read by render script | none — RESEARCH.md §1 skeleton | NO ANALOG (use research skeleton verbatim) |
| `nginx/render-canary.sh` | NEW infra (shell script) | jq → envsubst → nginx config | `backend/scripts/backup.sh` (lines 1–40, set -euo pipefail + env-var defaults pattern) | role-match (script pattern; not pg_dump, but same bash style) |
| `docs/runbooks/rollback.md` | NEW docs (runbook) | freeform markdown | `docs/DEPLOYMENT.md` (lines 1–100, sections + bash code blocks) | role-match (NEW dir `docs/runbooks/`; reuse DEPLOYMENT.md structure) |
| `docs/runbooks/dr-drill.md` | NEW docs (runbook) | RTO/RPO timestamp table | `docs/DEPLOYMENT.md` + RESEARCH.md §11 skeleton | role-match (NEW file, RESEARCH.md provides RTO/RPO table) |
| `docs/runbooks/observability-drill.md` | NEW docs (runbook) | quarterly chaos-drill checklist | `docs/DEPLOYMENT.md` + RESEARCH.md §7 skeleton | role-match (NEW file) |
| `scripts/synthetic-incident.sh` | NEW infra (chaos script) | SSH → docker stop / curl burst | `backend/scripts/test-stripe-webhooks.sh` + `backend/scripts/backup.sh` (set -euo pipefail; SSH cmd patterns) | role-match (NEW dir `scripts/` at repo root; backend/scripts/ has the closest bash style) |
| `tests/load/scenarios/full-flow.js` | NEW test (k6 script) | k6 ramping-VUs scenario + thresholds | none — RESEARCH.md §5 skeleton (lines 393–425) | NO ANALOG (k6 is net-new tool; use RESEARCH.md skeleton + k6 docs) |
| `tests/load/thresholds.json` | NEW test config (k6 threshold) | JSON consumed by k6 | none | NO ANALOG (RESEARCH.md `thresholds:` block lines 411–418) |
| `.github/workflows/load-test.yml` | NEW infra (GitHub Actions) | workflow_dispatch + cron + k6 image | `.github/workflows/ci.yml` (whole file, especially `test` job lines 32–78 services pattern) | role-match (extend existing CI shape with k6 step) |
| `.github/workflows/security-scan.yml` | NEW infra (GitHub Actions) | Snyk + ZAP baseline | `.github/workflows/ci.yml` (lines 32–78 test job + RESEARCH.md §13 lines 791–812 4th-job shape) | role-match (extend CI with 4th job; RESEARCH.md provides ZAP+Snyk YAML) |
| `mobile/test/a11y/a11y_test.dart` | NEW test (Flutter widget test) | meetsGuideline assertions | none — Flutter built-in `meetsGuideline` API; RESEARCH.md §8 lines 565–581 skeleton | NO ANALOG (Phase 1 widget_test.dart is empty boilerplate; RESEARCH.md skeleton is canonical) |
| `docs/A11Y_AUDIT.md` | NEW docs (per-screen audit table) | markdown table parsed by audit suite | none — RESEARCH.md §8 lines 597–603 skeleton | NO ANALOG (RESEARCH.md provides table format) |
| `docs/UAT_SCRIPT.md` | NEW docs (UAT script) | freeform markdown | none — RESEARCH.md §6 + Phase 3 closeout surfaces | NO ANALOG |
| `docs/UAT_REPORT.md` | NEW docs (sign-off table) | markdown table parsed by audit suite | none — RESEARCH.md SC#5b row + audit-suite parser pattern | NO ANALOG |
| `docs/PCI_SAQ_A.md` | NEW docs (attestation form) | freeform markdown | none — RESEARCH.md §12 lines 745–763 template | NO ANALOG (RESEARCH.md provides full template) |

---

## Pattern Assignments

### Wave 0 — D-04 ADR Lock + Audit Suite Extension

#### `.planning/intel/decisions.md` (docs, append-only)

**Analog:** itself — every existing ADR entry follows the same 4-key shape.

**Append-block pattern** (lines 12–17, `DEC-fastify-framework`):
```markdown
### DEC-forward-compatible-migrations
- **scope:** Database migration policy during canary windows
- **decision:** Every Prisma migration must be additive-only during canary deploys: nullable new columns, new tables, no DROPs, no `NOT NULL` on existing columns, no RENAMEs, no enum value removals. Destructive migrations ship in a follow-up release after the prior version has fully drained (expand → migrate → contract).
- **status:** locked
- **rationale:** During a 10/90 canary split, both versions run simultaneously against the same database. A destructive migration would break the still-serving stable version. Forward-compatible-only is the simplest forcing function that prevents data corruption without a two-phase deploy.
- **enforcement:** CI gate via regex assertion in `backend/tests/audit/closeout-audit.test.ts` (forbids DROP / RENAME / SET NOT NULL on existing columns in latest migration).
- **source:** Phase 4 CONTEXT.md D-04, Phase 4 RESEARCH.md §2
```

**Notes:** Insert under a new `## Migrations` heading or under existing `## Database & ORM` section after `DEC-fts-postgres-mvp`. Match the existing 4-bullet shape (scope / decision / status / source) and add `rationale` + `enforcement` since this is a high-stakes new ADR.

---

#### `CLAUDE.md` (docs, append to "Critical Design Patterns")

**Analog:** itself — bullet block at lines 189–199.

**Existing pattern** (line 197 — closest in spirit, single-line bullet):
```markdown
- **Lazy SDK init** — Stripe, Gemini, and Sentry initialized on first call, not on import (prevents test crashes)
```

**New bullet to add** (insert before the "Seed data" bullet to keep the block alphabetical-by-importance):
```markdown
- **Forward-compatible-only migrations during canary** — Every Prisma migration must be additive (nullable columns, new tables). No DROP / RENAME / SET NOT NULL on existing columns. Destructive changes ship in a follow-up release after the prior version drains. See `DEC-forward-compatible-migrations` in `.planning/intel/decisions.md`. CI-enforced via `backend/tests/audit/closeout-audit.test.ts`.
```

---

#### `backend/tests/audit/closeout-audit.test.ts` (test, extend describe blocks)

**Analog:** itself — 26-assertion Phase 3 baseline.

**Imports + helpers pattern** (lines 13–48):
```typescript
import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
// Vitest runs from backend/ — resolve paths relative to that.
const backendRoot = resolve(import.meta.dirname, '../..');
const readSrc = (relPath: string): string =>
  readFileSync(resolve(backendRoot, relPath.replace(/^backend\//, '')), 'utf-8');
```

**Per-SC describe block pattern** (lines 87–103, SC2 counter-offer cap — perfect template):
```typescript
// ─────────────────────────────────────────────────────────────────────────────
// SC2: Counter-offer 5-round cap
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 3 Closeout — Success Criterion 2: Counter-offer 5-round cap', () => {
  it('offers.service.ts declares MAX_COUNTER_DEPTH = 5', () => {
    const src = readSrc('backend/src/modules/offers/offers.service.ts');
    expect(src).toMatch(/MAX_COUNTER_DEPTH\s*=\s*5/);
  });

  it('counterOffer walks the parentOfferId chain to enforce the cap', () => {
    const src = readSrc('backend/src/modules/offers/offers.service.ts');
    expect(src).toMatch(/parentOfferId/);
    expect(src).toMatch(/chainLength\s*>=\s*MAX_COUNTER_DEPTH/);
  });
});
```

**File-existence assertion pattern** (lines 130–134, SC3 saved-sellers):
```typescript
it('saved-sellers module routes are registered', () => {
  expect(existsSync(resolve(backendRoot, 'src/modules/saved-sellers/saved-sellers.routes.ts'))).toBe(true);
  const appSrc = readSrc('backend/src/app.ts');
  expect(appSrc).toMatch(/saved-sellers/);
});
```

**JSON-artifact parse pattern** (RESEARCH.md §14 skeleton, applied to k6 / coverage / A11Y / UAT):
```typescript
describe('Phase 4 Pre-Launch — SC1: Load test thresholds', () => {
  it('docs/load-test-summary.json asserts API p95 < 500ms', () => {
    const summary = JSON.parse(
      readFileSync(resolve(backendRoot, '../docs/load-test-summary.json'), 'utf-8')
    );
    expect(summary.metrics['http_req_duration{type:api}'].values['p(95)']).toBeLessThan(500);
  });
});
```

**D-04 enforcement assertion** (RESEARCH.md §2 lines 234–242, the highest-stakes assertion in the phase):
```typescript
describe('Phase 4 Pre-Launch — D-04 Forward-compat migrations', () => {
  it('latest migration has no DROP, RENAME, or SET NOT NULL on existing column', () => {
    // Find the latest dated migration directory under prisma/migrations/
    const migrationsDir = resolve(backendRoot, 'prisma/migrations');
    // ... read latest migration.sql ...
    const latestMigration = readFileSync(latestSqlPath, 'utf-8');
    expect(latestMigration).not.toMatch(/^\s*DROP\s+(COLUMN|TABLE|INDEX(?!\s+CONCURRENTLY))/im);
    expect(latestMigration).not.toMatch(/^\s*ALTER\s+TABLE\s+\S+\s+RENAME/im);
    expect(latestMigration).not.toMatch(/SET\s+NOT\s+NULL/i);
  });
});
```

**Required new describe blocks (Phase 4 SCs):**
1. `'Phase 4 Pre-Launch — SC1: Load test thresholds'` (k6 JSON parse)
2. `'Phase 4 Pre-Launch — SC2a: Test coverage thresholds'` (coverage-summary.json)
3. `'Phase 4 Pre-Launch — SC2b: Security scan zero-HIGH'` (zap + snyk JSON exists + parse)
4. `'Phase 4 Pre-Launch — SC2c: PCI-DSS SAQ-A filed'` (file existence + date present)
5. `'Phase 4 Pre-Launch — SC3: A11Y per-screen pass'` (markdown table parse, every row PASS)
6. `'Phase 4 Pre-Launch — SC4: DR + observability drills'` (runbook files exist + RTO/RPO under target)
7. `'Phase 4 Pre-Launch — SC5a: Canary workflows exist'` (deploy-canary.yml + rollback.yml exist)
8. `'Phase 4 Pre-Launch — SC5b: UAT signed off'` (UAT_REPORT.md sign-off count >= 20)
9. `'Phase 4 Pre-Launch — D-04 Forward-compat migrations'` (regex on latest migration)

**Notes:**
- CI gate stays single-command: `npx vitest run tests/audit`.
- File path comment at top (lines 1–12) MUST be updated to reference `04-PLAN.md` numbering.
- Use `<!-- AUDIT-MARKER -->` HTML comments around parseable fields in markdown artifacts (RESEARCH.md Pitfall 10) — strict templates prevent format drift.

---

### Wave 1 — Mobile Shell Carry-Over + Observability Foundation

#### `mobile/lib/features/sellers/presentation/screens/identity_verify_screen.dart` (NEW)

**Analog:** `mobile/lib/features/sellers/presentation/screens/stripe_onboard_screen.dart` — exact lifecycle shape.

**Imports + class shape** (stripe_onboard_screen.dart lines 1–20):
```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/section_card.dart';
import '../../../../shared/widgets/styled_app_bar.dart';
import '../../data/models/seller_profile_model.dart';
import '../../providers/seller_provider.dart';

class IdentityVerifyScreen extends ConsumerStatefulWidget {
  const IdentityVerifyScreen({super.key});

  @override
  ConsumerState<IdentityVerifyScreen> createState() =>
      _IdentityVerifyScreenState();
}

class _IdentityVerifyScreenState extends ConsumerState<IdentityVerifyScreen>
    with WidgetsBindingObserver {
```

**`url_launcher` + error-state pattern** (lines 24–52, `_startOnboarding`):
```dart
Future<void> _startOnboarding() async {
  setState(() {
    _isLoading = true;
    _error = null;
  });
  try {
    final result = await ref
        .read(sellerProfileProvider.notifier)
        .startStripeOnboarding();
    if (result != null && mounted) {
      final uri = Uri.parse(result.url);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } else {
        setState(() => _error = 'Could not open Stripe onboarding URL');
      }
    } else if (mounted) {
      setState(() => _error = ref.read(sellerProfileProvider).error
          ?? 'Failed to start onboarding');
    }
  } catch (e) {
    if (mounted) setState(() => _error = e.toString());
  } finally {
    if (mounted) setState(() => _isLoading = false);
  }
}
```

**WidgetsBindingObserver lifecycle pattern** (lines 61–83):
```dart
@override
void initState() {
  super.initState();
  WidgetsBinding.instance.addObserver(this);
  Future.microtask(() {
    ref.read(sellerProfileProvider.notifier).loadStripeStatus();
    ref.read(sellerProfileProvider.notifier).loadProfile();
  });
}

@override
void dispose() {
  WidgetsBinding.instance.removeObserver(this);
  super.dispose();
}

@override
void didChangeAppLifecycleState(AppLifecycleState state) {
  if (state == AppLifecycleState.resumed) {
    ref.read(sellerProfileProvider.notifier).loadStripeStatus();
    ref.read(sellerProfileProvider.notifier).loadProfile();
  }
}
```

**Notes:**
- Replace `startStripeOnboarding` calls with `startIdentityVerification` (new action — see `seller_provider.dart` below).
- Replace `loadStripeStatus` with `loadProfile` only (Identity verification status lives on `SellerProfile.idVerified` — no separate status object).
- Reuse Phase 2 design tokens: `AppColors.primaryGradient`, gradient hero icon, `SectionCard`, `StyledAppBar`, 56-px `GradientButton`, 24-px border radius.
- CTA label: "Verify Identity" (not "Set Up Stripe"); success-state text: "Identity verified".

---

#### `mobile/lib/features/sellers/providers/seller_provider.dart` (MODIFY)

**Analog:** itself — `startStripeOnboarding` (lines 187–200).

**Existing pattern to mirror:**
```dart
Future<StripeOnboardingResult?> startStripeOnboarding() async {
  state = state.copyWith(isLoading: true, clearError: true);
  try {
    final result = await _repository.startStripeOnboarding();
    state = state.copyWith(isLoading: false);
    return result;
  } catch (e) {
    state = state.copyWith(
      isLoading: false,
      error: _extractError(e),
    );
    return null;
  }
}
```

**New action to append (mirror exactly):**
```dart
Future<StripeIdentitySession?> startIdentityVerification() async {
  state = state.copyWith(isLoading: true, clearError: true);
  try {
    final result = await _repository.startIdentityVerification();
    state = state.copyWith(isLoading: false);
    return result;
  } catch (e) {
    state = state.copyWith(
      isLoading: false,
      error: _extractError(e),
    );
    return null;
  }
}
```

**Notes:**
- New return type `StripeIdentitySession` — likely a `{ url: string, sessionId: string }` shape; add to `seller_profile_model.dart` mirroring `StripeOnboardingResult`.
- `_extractError` helper (lines 206–211) is already in place; reuse without modification.

---

#### `mobile/lib/features/sellers/data/repositories/seller_repository.dart` (MODIFY)

**Analog:** itself — `startStripeOnboarding` (lines 101–105).

**Existing pattern:**
```dart
Future<StripeOnboardingResult> startStripeOnboarding() async {
  final response = await _dio.post('/payments/seller/onboard');
  return StripeOnboardingResult.fromJson(
      response.data['data'] as Map<String, dynamic>);
}
```

**New method to append:**
```dart
Future<StripeIdentitySession> startIdentityVerification() async {
  final response = await _dio.post('/sellers/identity/verify');
  return StripeIdentitySession.fromJson(
      response.data['data'] as Map<String, dynamic>);
}
```

**Notes:**
- Path matches the backend route already verified in audit suite (closeout-audit.test.ts line 263: `expect(src).toMatch(/['"]\/identity\/verify['"]/)`).
- Response unwrap follows the standard `response.data['data'] as Map<String, dynamic>` shape used everywhere in this file.

---

#### `mobile/lib/features/auth/presentation/screens/register_screen.dart` (MODIFY)

**Analog:** itself — existing `AppInputField` pattern (lines 152–170) and `_AccountTypeSelector` toggle (lines 272–275).

**`AppInputField` pattern with custom `Validators.regex`** (lines 152–159):
```dart
AppInputField(
  controller: _firstNameController,
  label: 'First Name',
  hint: 'Jane',
  prefixIcon: Icons.person_outline_rounded,
  textInputAction: TextInputAction.next,
  validator: (v) => Validators.name(v, 'First name'),
),
```

**Conditional render based on `isBusiness` toggle** — mirror the existing `_AccountTypeSelector` (lines 397–500) and add a Switch + EIN field gated on its state:
```dart
// Add to State:
bool _isBusiness = false;
final _einController = TextEditingController();

// Add to build() after _AccountTypeSelector, before Terms:
SwitchListTile(
  title: Text('Business account', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600)),
  value: _isBusiness,
  onChanged: (v) => setState(() => _isBusiness = v),
  activeColor: AppColors.primary,
),
if (_isBusiness) ...[
  const SizedBox(height: 16),
  AppInputField(
    controller: _einController,
    label: 'EIN (Employer ID)',
    hint: '12-3456789',
    prefixIcon: Icons.badge_outlined,
    keyboardType: TextInputType.number,
    textInputAction: TextInputAction.next,
    validator: (v) {
      if (!_isBusiness) return null;
      if (v == null || v.isEmpty) return 'EIN is required for business accounts';
      if (!RegExp(r'^\d{2}-\d{7}$').hasMatch(v)) return 'EIN must be XX-XXXXXXX';
      return null;
    },
  ),
],
```

**Update `_handleRegister` payload** to pass `isBusiness` and `ein`:
```dart
await ref.read(authProvider.notifier).register(
  // ... existing fields ...
  isBusiness: _isBusiness,
  ein: _isBusiness ? _einController.text.trim() : null,
);
```

**Notes:**
- Backend Zod schema already enforces XX-XXXXXXX regex via `superRefine` (verified in closeout-audit.test.ts lines 213–244). Client-side regex is defensive.
- Reuse Phase 2 styling: `AppInputField` is the 52-px-height shared widget with gradient focus; no new component needed.
- `dispose()` block at lines 32–40 must add `_einController.dispose();`.

---

#### `mobile/lib/app.dart` (MODIFY)

**Analog:** itself — `/seller/stripe-onboard` route (lines 368–375).

**Existing route pattern:**
```dart
GoRoute(
  path: '/seller/stripe-onboard',
  parentNavigatorKey: _rootNavigatorKey,
  pageBuilder: (context, state) => springPage<void>(
    key: state.pageKey,
    child: const StripeOnboardScreen(),
  ),
),
```

**New route to insert (right after the stripe-onboard block, lines 368–375):**
```dart
GoRoute(
  path: '/seller/identity/verify',
  parentNavigatorKey: _rootNavigatorKey,
  pageBuilder: (context, state) => springPage<void>(
    key: state.pageKey,
    child: const IdentityVerifyScreen(),
  ),
),
```

**Plus import** (insert into the alphabetical seller-screen import block at lines 41–45):
```dart
import 'features/sellers/presentation/screens/identity_verify_screen.dart';
```

**Notes:**
- `parentNavigatorKey: _rootNavigatorKey` is required to render outside the bottom-nav shell (matches every other `/seller/*` standalone route).
- `springPage<void>` reuses the locked Sorcyn spring transition (stiffness 320, damping 32) per Phase 2 design contract.

---

#### `mobile/lib/features/posts/presentation/screens/manual_post_creation_screen.dart` (MODIFY)

**Analog:** itself — `_selectedCategory!.isProducts` ProductConditionPicker block.

**Existing category-conditional UI pattern** (lines 64–84 — validation gate; lines 334–340 — conditional render):
```dart
// Validation gate inside _publish():
if (_selectedCategory!.isProducts && _productCondition == null) {
  setState(() => _error = 'Please select the item condition.');
  return;
}

// categorySpecific JSONB payload:
final categorySpecific = <String, dynamic>{
  if (_selectedCategory!.isProducts && _productCondition != null)
    'condition': _productCondition,
  // ...
};

// Conditional render (around line 335):
if (_selectedCategory?.isProducts == true) ...[
  // ProductConditionPicker widget here
],
```

**New roleTier dropdown to add (mirror exactly):**
```dart
// Add to State class:
String? _roleTier; // 'entry' | 'mid' | 'specialized_senior'

// Validation gate inside _publish() — append after the isProducts check:
if (_selectedCategory!.isJobs && _roleTier == null) {
  setState(() => _error = 'Please select a role tier for Jobs posts.');
  return;
}

// categorySpecific JSONB:
final categorySpecific = <String, dynamic>{
  if (_selectedCategory!.isProducts && _productCondition != null)
    'condition': _productCondition,
  if (_selectedCategory!.isJobs && _roleTier != null)
    'roleTier': _roleTier,
  // ...existing B2B block...
};

// Conditional render (insert after the isProducts ProductConditionPicker block):
if (_selectedCategory?.isJobs == true) ...[
  const SizedBox(height: 16),
  _FieldLabel(label: 'Role Tier', required: true),
  const SizedBox(height: 8),
  DropdownButtonFormField<String>(
    value: _roleTier,
    decoration: InputDecoration(
      filled: true,
      fillColor: AppColors.surfaceVariant,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppColors.border)),
    ),
    items: const [
      DropdownMenuItem(value: 'entry', child: Text('Entry-level (\$10/lead)')),
      DropdownMenuItem(value: 'mid', child: Text('Mid-level (\$50/lead)')),
      DropdownMenuItem(value: 'specialized_senior', child: Text('Specialized/Senior (\$500/lead)')),
    ],
    onChanged: (v) => setState(() => _roleTier = v),
  ),
],
```

**Notes:**
- Verify `CategoryPickerResult.isJobs` getter exists on the model (it likely does — `isProducts` exists, `isJobs` should be the parallel). If absent, plan-time adds it.
- Lead-fee labels (10/50/500) match `calculateJobLeadFee` (closeout-audit.test.ts line 154–157).
- 52-px input height + 12-px radius matches the Phase 2 design tokens used elsewhere in this file.

---

#### `backend/tests/sellers.test.ts` (MODIFY — Identity API smoke)

**Analog:** existing test patterns in `sellers.test.ts` + the `closeout-audit.test.ts` Zod parse pattern (lines 213–244).

**Test pattern from TESTING.md `tests/helpers.ts` factory**:
```typescript
import { createTestUser, authHeaders, makeAdmin, cleanupTestData, clearAuthRedisKeys } from './helpers.js';

const seller = await createTestUser(app, { accountType: 'seller' });

// Inject + assert
const res = await app.inject({
  method: 'POST',
  url: '/api/v1/sellers/identity/verify',
  headers: authHeaders(seller.token),
});
expect(res.statusCode).toBe(200);
expect(res.json().data.url).toContain('verify.stripe.com');
```

**Stripe SDK mock pattern** (TESTING.md lines 174–197 — already canonical for Stripe-touching tests):
```typescript
vi.mock('../src/config/stripe.js', () => ({
  getStripe: () => ({
    identity: {
      verificationSessions: {
        create: vi.fn().mockResolvedValue({
          id: 'vs_test_123',
          url: 'https://verify.stripe.com/start/vs_test_123',
        }),
      },
    },
  }),
}));
```

**Notes:**
- Reuse `beforeAll` / `afterAll` / `beforeEach` Redis-clear pattern from TESTING.md lines 88–132.
- Cleanup: `cleanupTestData([seller.email])` in `afterAll` to respect FK order.
- Stripe Identity is mocked (per TESTING.md "What to mock" rule).

---

#### `backend/tests/auth.test.ts` (MODIFY — EIN-gate API smoke)

**Analog:** itself — existing register tests + `closeout-audit.test.ts` Zod parse block (lines 213–244, already exercises the registerSchema).

**Existing register-test shape (TESTING.md lines 134–158):**
```typescript
describe('POST /api/v1/auth/register', () => {
  it('should register a new user and return tokens', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: TEST_USER,
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().data.user.email).toBe(TEST_USER.email);
  });
});
```

**New EIN-gate negative + positive test pair to append:**
```typescript
it('rejects business account without EIN', async () => {
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/register',
    payload: {
      ...TEST_USER,
      email: `biz-no-ein-${Date.now()}@acme.com`,
      isBusiness: true,
      // ein omitted
    },
  });
  expect(res.statusCode).toBe(400);
  expect(res.json().error.detail).toMatch(/ein/i);
});

it('accepts business account with valid EIN', async () => {
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/register',
    payload: {
      ...TEST_USER,
      email: `biz-with-ein-${Date.now()}@acme.com`,
      isBusiness: true,
      ein: '12-3456789',
    },
  });
  expect(res.statusCode).toBe(201);
  expect(res.json().data.user.isBusiness).toBe(true);
});
```

**Notes:**
- API-level validation already proven correct via the `closeout-audit.test.ts` Zod parse assertion — these tests are the deferred HTTP-level smoke check.
- Email uses `Date.now()` suffix to avoid collisions with other tests (matches `helpers.ts` pattern).

---

#### `backend/src/config/sentry.ts` (MODIFY — Performance Monitoring)

**Analog:** itself (lines 6–29) — extend the existing `initSentry()`.

**Existing init shape (preserve):**
```typescript
let initialized = false;

export function initSentry(): void {
  if (initialized || !env.SENTRY_DSN) {
    if (!env.SENTRY_DSN && env.NODE_ENV === 'production') {
      console.warn('[SENTRY] SENTRY_DSN not set — error tracking disabled');
    }
    return;
  }

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
    beforeSend(event) {
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }
      return event;
    },
  });
  initialized = true;
}
```

**Phase 4 additions inside the same `Sentry.init({...})` block:**
```typescript
import { httpIntegration, prismaIntegration, fastifyIntegration } from '@sentry/node';

Sentry.init({
  dsn: env.SENTRY_DSN,
  environment: env.NODE_ENV,
  // Lower from 0.1 → 0.05 per RESEARCH.md Pitfall 6 (Team plan quota)
  tracesSampleRate: env.NODE_ENV === 'production'
    ? (env.SENTRY_TRACES_SAMPLE_RATE ?? 0.05)
    : 1.0,
  integrations: [
    httpIntegration(),       // outbound HTTP (Stripe, SendGrid, R2)
    prismaIntegration(),     // DB span breakdown
    fastifyIntegration(),    // request lifecycle spans
  ],
  beforeSend(event) {
    if (event.request?.headers) {
      delete event.request.headers['authorization'];
      delete event.request.headers['cookie'];
    }
    return event;
  },
});
```

**Notes:**
- Lazy-init pattern preserved (per CLAUDE.md "Lazy SDK init" rule and RESEARCH.md Pitfall 2). `initialized` flag stays.
- New env var `SENTRY_TRACES_SAMPLE_RATE` (optional, defaults 0.05 in prod) lets ops dial without code change.
- Fastify integration may need to be wired separately as `app.register(...)` — confirm @sentry/node v8 API at plan-time per official docs.

---

#### `mobile/lib/main.dart` (MODIFY — Sentry tracesSampleRate)

**Analog:** itself (lines 36–51).

**Existing init:**
```dart
const sentryDsn = String.fromEnvironment('SENTRY_DSN', defaultValue: '');
if (sentryDsn.isNotEmpty) {
  await SentryFlutter.init(
    (options) {
      options.dsn = sentryDsn;
      options.environment = EnvConfig.environment;
      options.tracesSampleRate = EnvConfig.isProduction ? 0.1 : 1.0;
      options.sendDefaultPii = false;
    },
    appRunner: () => runApp(const ProviderScope(child: App())),
  );
}
```

**Phase 4 change (single line):**
```dart
options.tracesSampleRate = EnvConfig.isProduction ? 0.05 : 1.0;
```

**Plus optional Dio interceptor wiring (per RESEARCH.md §3 mobile section):** add `sentry_dio` package to `pubspec.yaml` and wrap the singleton Dio in `core/network/dio_client.dart` with `dio.addSentry()`. This propagates `sentry-trace` headers for frontend↔backend trace correlation.

**Notes:** Mobile bottleneck mirrors backend Pitfall 6 — quota economics demand the lower 0.05 rate.

---

#### `backend/src/config/logtail.ts` (NEW — pino transport)

**Analog:** `backend/src/config/stripe.ts` (lines 1–16) — exact lazy-singleton shape per CLAUDE.md.

**Existing lazy-singleton template (stripe.ts):**
```typescript
import Stripe from 'stripe';
import { env } from './env.js';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    _stripe = new Stripe(env.STRIPE_SECRET_KEY, { typescript: true });
  }
  return _stripe;
}
```

**New file shape (mirror):**
```typescript
import pino from 'pino';
import { env } from './env.js';

let _logger: pino.Logger | null = null;

export function getLogger(): pino.Logger {
  if (_logger) return _logger;

  const targets: pino.TransportTargetOptions[] = [
    // Always log to stdout (Docker captures)
    { target: 'pino/file', options: { destination: 1 }, level: env.LOG_LEVEL },
  ];

  if (env.BETTER_STACK_TOKEN) {
    targets.push({
      target: '@logtail/pino',
      options: {
        sourceToken: env.BETTER_STACK_TOKEN,
        options: { endpoint: env.BETTER_STACK_INGEST_URL ?? 'https://in.logs.betterstack.com' },
      },
      level: 'info',
    });
  }

  _logger = pino({
    level: env.LOG_LEVEL,
    transport: { targets },
    base: { service: 'sorcyn-api', env: env.NODE_ENV },
  });
  return _logger;
}
```

**Wire into Fastify** (`backend/src/app.ts`, top of `buildApp`):
```typescript
import { getLogger } from './config/logtail.js';
const app = Fastify({ logger: getLogger() });
```

**Notes:**
- Mirrors `getStripe()` shape exactly (private `_logger`, falsy check, env-guard for token, return).
- Falls back to stdout-only when `BETTER_STACK_TOKEN` is absent (graceful — same pattern as `sendEmail()` stub fallback per CLAUDE.md "Graceful external service stubs" rule).
- Verify `@logtail/pino` package API at plan-time (RESEARCH.md "Pino 7+ required").

---

#### `backend/src/config/env.ts` (MODIFY — Phase 4 env additions + prod gates)

**Analog:** itself — Stripe block (lines 28–34) and `validateProductionEnv` (lines 86–109) are the canonical pattern, set in Phase 3 plan 03-02.

**Existing prod-startup-gate pattern (lines 92–95, the locked Phase 3 03-02 anchor):**
```typescript
if (!config.STRIPE_SECRET_KEY) errors.push('STRIPE_SECRET_KEY is required in production');
if (!config.STRIPE_WEBHOOK_SECRET) errors.push('STRIPE_WEBHOOK_SECRET is required in production');

if (!config.STRIPE_CONNECT_RETURN_URL || config.STRIPE_CONNECT_RETURN_URL === '') errors.push('STRIPE_CONNECT_RETURN_URL is required in production');
if (config.FRONTEND_URL === 'http://localhost:8080') errors.push('FRONTEND_URL still set to localhost — refusing to start in production');
```

**Phase 4 schema additions (insert in the existing schema, near Sentry block at line 60):**
```typescript
// Sentry Performance (Phase 4 D-05)
SENTRY_DSN: z.string().url().optional(),
SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).optional(),

// Better Stack (Phase 4 D-07)
BETTER_STACK_TOKEN: z.string().optional(),
BETTER_STACK_INGEST_URL: z.string().url().optional(),
```

**Phase 4 prod-gate additions (insert into `validateProductionEnv`):**
```typescript
// Phase 4 D-07 — refuse start in production without centralized logging
if (!config.BETTER_STACK_TOKEN) errors.push('BETTER_STACK_TOKEN is required in production');

// Phase 4 D-05 — Sentry warn-only (DSN already optional)
if (!config.SENTRY_DSN) warnings.push('SENTRY_DSN not set — distributed tracing disabled');
```

**Notes:**
- Stripe pattern (line 92) is the canonical "errors.push" shape — copy verbatim.
- Sentry stays warn-only (matches existing line 101) because Phase 1 didn't make it strict; Better Stack is launch-blocking strict because D-07 mandates centralized logs in prod.
- Both new vars MUST be added to the `baseProductionEnv` fixture in `closeout-audit.test.ts` lines 22–43 to keep that suite green.

---

### Wave 2 — Canary CI/CD + DR Drill

#### `.github/workflows/deploy-canary.yml` (NEW)

**Analog:** `.github/workflows/ci.yml` deploy job (lines 106–139) — extend with environment gate per stage.

**Existing SSH-deploy step pattern (lines 113–123):**
```yaml
deploy:
  name: Deploy to Production
  runs-on: ubuntu-latest
  needs: [build-and-push]
  if: github.ref == 'refs/heads/main'
  environment: production
  steps:
    - uses: appleboy/ssh-action@v1
      with:
        host: ${{ secrets.DEPLOY_HOST }}
        username: ${{ secrets.DEPLOY_USER }}
        key: ${{ secrets.DEPLOY_SSH_KEY }}
        script: |
          cd /opt/reverse-marketplace
          docker compose -f docker-compose.production.yml pull api
          docker compose -f docker-compose.production.yml run --rm api npx prisma migrate deploy
          docker compose -f docker-compose.production.yml up -d --no-deps api
          docker image prune -f
```

**Health-verify step pattern (lines 125–139):**
```yaml
- name: Verify deployment health
  env:
    DEPLOY_HOST: ${{ secrets.DEPLOY_HOST }}
  run: |
    for i in $(seq 1 10); do
      STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://${DEPLOY_HOST}/health" || echo "000")
      if [ "$STATUS" = "200" ]; then
        echo "Health check passed (attempt $i)"
        exit 0
      fi
      sleep 10
    done
    exit 1
```

**Phase 4 canary shape (RESEARCH.md §1 lines 144–172 + locked patterns above):**
```yaml
name: Deploy Canary
on:
  workflow_dispatch:
    inputs:
      stage:
        description: Canary stage to deploy
        type: choice
        options: [canary-10, canary-50, canary-100]
        required: true

jobs:
  canary-deploy:
    runs-on: ubuntu-latest
    environment: ${{ inputs.stage }}  # required reviewer = Faisal (D-02)
    steps:
      - uses: appleboy/ssh-action@v1
        name: Pull image on canary VPS
        with:
          host: ${{ secrets.CANARY_VPS_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          script: |
            cd /opt/reverse-marketplace
            docker compose -f docker-compose.production.yml pull api
            docker compose -f docker-compose.production.yml up -d --no-deps api
      - uses: appleboy/ssh-action@v1
        name: Update Nginx weights on LB
        with:
          host: ${{ secrets.LB_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          script: |
            cd /opt/sorcyn-lb
            ./set-weights.sh ${{ inputs.stage }}
            nginx -s reload
      - name: Health check on canary path
        run: |
          for i in $(seq 1 10); do
            STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://${{ secrets.CANARY_HOST }}/health")
            [ "$STATUS" = "200" ] && exit 0
            sleep 10
          done
          exit 1
```

**Notes:**
- `environment:` per stage (`staging-canary-10`, `staging-canary-50`, `production`) — required reviewer set in repo settings, satisfies D-02 manual gate.
- Reuses existing `DEPLOY_USER` + `DEPLOY_SSH_KEY` secrets; new secrets needed: `CANARY_VPS_HOST`, `LB_HOST`, `CANARY_HOST`.
- Forward-compat-only migrations (D-04) means NO `prisma migrate deploy` on canary box — schema is shared with the stable VPS and migrations were already applied as part of the prior 100% promotion.

---

#### `.github/workflows/rollback.yml` (NEW)

**Analog:** `.github/workflows/ci.yml` SSH step (lines 113–123) + RESEARCH.md §1 rollback shape (lines 175–189).

**File shape:**
```yaml
name: Rollback Canary
on:
  workflow_dispatch:

jobs:
  rollback:
    runs-on: ubuntu-latest
    environment: production-rollback  # NO required reviewer per Pitfall 8 (must be one-click)
    steps:
      - uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.LB_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          script: |
            cd /opt/sorcyn-lb
            ./set-weights.sh rollback
            nginx -s reload
            echo "[$(date -Iseconds)] Rollback complete: VPS-A weight=100, VPS-B weight=0"
```

**Notes:**
- `production-rollback` env MUST NOT have a required reviewer (RESEARCH.md Pitfall 8). Access controlled via branch protection (only Faisal can dispatch on `main`).
- Recovery time target: <60 s end to end (RESEARCH.md §1 "Recovery time math").
- No prisma operations — D-04 forward-compat ensures schema is safe for both versions, no rollback DDL needed.

---

#### `nginx/nginx.conf` (MODIFY)

**Analog:** itself — current single-server `upstream api` block (lines 40–43).

**Existing upstream:**
```nginx
upstream api {
    server api:3000;
    keepalive 32;
}
```

**Phase 4 weighted shape (replace lines 40–43; per RESEARCH.md §1 lines 103–113 + Pitfall 7):**
```nginx
upstream api_pool {
    # Sticky sessions for Socket.IO long-polling fallback (Pitfall 7).
    # ip_hash is compatible with weight= per nginx docs:
    # nginx.org/en/docs/http/load_balancing.html
    ip_hash;
    server vps-a.internal:3000 weight=100;
    server vps-b.internal:3000 weight=0;
    keepalive 32;
}
```

**All `proxy_pass http://api;` lines (92, 117, 128, 138, 147, 157)** must update to `http://api_pool;` to match the renamed upstream.

**Notes:**
- The upstream block is rewritten by `nginx/render-canary.sh` per stage — keep the structure stable so the render script's substitution stays simple.
- `ip_hash` mitigates the Socket.IO polling-fallback session split (RESEARCH.md Pitfall 7).
- All other locations (rate-limit zones, security headers, SSL block) stay unchanged.

---

#### `nginx/canary-state.json` (NEW)

**Analog:** none — net-new state file (RESEARCH.md §1 lines 130–133).

**Skeleton:**
```json
{
  "stable_host": "vps-a.internal",
  "canary_host": "vps-b.internal",
  "stable_weight": 100,
  "canary_weight": 0,
  "stage": "stable",
  "last_promotion": "2026-04-30T00:00:00Z"
}
```

**Notes:**
- Lives on the LB host at `/opt/sorcyn-lb/canary-state.json`, NOT in the repo (deploy script seeds it).
- `set-weights.sh` reads + mutates this file per stage input (`canary-10`, `canary-50`, `canary-100`, `rollback`, `promote`).

---

#### `nginx/render-canary.sh` (NEW)

**Analog:** `backend/scripts/backup.sh` (lines 1–40) — `set -euo pipefail` + env-var defaults bash style.

**Existing bash-style template:**
```bash
#!/usr/bin/env bash
set -euo pipefail
BACKUP_DIR="${BACKUP_DIR:-/opt/reverse-marketplace/backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
echo "[$(date -Iseconds)] Starting database backup..."
```

**New file shape (RESEARCH.md §1 lines 137–141):**
```bash
#!/usr/bin/env bash
set -euo pipefail
STATE_FILE="${STATE_FILE:-/opt/sorcyn-lb/canary-state.json}"
OUTPUT_FILE="${OUTPUT_FILE:-/etc/nginx/conf.d/canary-upstream.conf}"

echo "[$(date -Iseconds)] Rendering canary upstream from $STATE_FILE..."
jq -r '
  "upstream api_pool { ip_hash; server \(.stable_host):3000 weight=\(.stable_weight); server \(.canary_host):3000 weight=\(.canary_weight); keepalive 32; }"
' "$STATE_FILE" > "$OUTPUT_FILE"

echo "[$(date -Iseconds)] Validating nginx config..."
nginx -t

echo "[$(date -Iseconds)] Reloading nginx..."
nginx -s reload
```

**Notes:** Pair with `set-weights.sh` (separate plan-time deliverable) that mutates `canary-state.json` per stage.

---

#### `docs/runbooks/rollback.md` (NEW)

**Analog:** `docs/DEPLOYMENT.md` (lines 1–100) — sections + bash code blocks + cost tables.

**Section structure to mirror:**
```markdown
# Rollback Runbook

> One-click rollback for canary deploys. Recovery target: <60 s.

## When to Rollback
- 5xx burst alert in #sorcyn-prod-alerts
- p95 latency >500 ms over baseline
- Stripe webhook failure spike
- User-reported critical bug on canary path

## How to Rollback (manual, ~30 s typical)
1. Open: github.com/.../actions/workflows/rollback.yml
2. Click "Run workflow" → main
3. Confirm `production-rollback` environment (NO reviewer required by design)
4. Watch SSH step output; success message: "Rollback complete: VPS-A weight=100, VPS-B weight=0"
5. Verify in `#sorcyn-prod-alerts`: any active alerts should resolve within 5 min

## How to Rollback (CLI, ~10 s)
gh workflow run rollback.yml

## Why no Reviewer?
Per Pitfall 8: rollback must be one-click. Branch protection on `main` ensures only Faisal can dispatch.

## Post-Rollback
- File incident report in `docs/incidents/{date}-{title}.md`
- Decide: re-attempt canary after fix OR roll forward with stable version
```

**Notes:** Use `<!-- AUDIT-MARKER -->` HTML comments around any field the audit suite parses (none in rollback.md per current SC, but pattern stays).

---

#### `docs/runbooks/dr-drill.md` (NEW)

**Analog:** `docs/DEPLOYMENT.md` + RESEARCH.md §11 (lines 681–697).

**Skeleton from RESEARCH.md (use verbatim as starting structure):**
```markdown
# DR Drill Runbook

## Quarterly Cadence
Q1 (Jan), Q2 (Apr), Q3 (Jul), Q4 (Oct). Calendar reminder set in Faisal's Google Calendar.

## Procedure
1. Spin up new Supabase project in alternate region (us-west-1 if prod is us-east-2)
2. Trigger pg_restore from latest pg_dump in R2
3. Refresh materialized views, rebuild GIN search indexes
4. Reconfigure backend env: NEW DATABASE_URL → restart docker-compose
5. Smoke test: login → fetch feed → submit offer

## RTO/RPO Measurement
<!-- AUDIT-MARKER:RTO -->
| Drill date | T0 (decision) | T1 (restore done) | T2 (backend cut over) | T3 (smoke green) | RTO (T3-T0) | RPO |
|------------|---------------|-------------------|----------------------|------------------|-------------|-----|
| 2026-XX-XX | hh:mm UTC     | hh:mm UTC         | hh:mm UTC            | hh:mm UTC        | XX min      | XX min |
<!-- /AUDIT-MARKER:RTO -->

## Targets
- RTO <4h
- RPO <1h
```

**Notes:** Audit suite parses the RTO/RPO row inside `<!-- AUDIT-MARKER:RTO -->` markers — RESEARCH.md Pitfall 10.

---

### Wave 3 — Synthetic Incident + Load Test + Security Scans

#### `scripts/synthetic-incident.sh` (NEW)

**Analog:** `backend/scripts/backup.sh` (header + `set -euo pipefail`) and `backend/scripts/test-stripe-webhooks.sh` (multi-step bash flow).

**Bash header pattern from backup.sh:**
```bash
#!/usr/bin/env bash
set -euo pipefail
echo "[$(date -Iseconds)] Starting database backup..."
```

**New synthetic-incident shape (RESEARCH.md §7 lines 504–542):**
```bash
#!/usr/bin/env bash
# Quarterly chaos drill against staging. Captures Slack screenshot evidence.
set -euo pipefail

STAGING_VPS="${STAGING_VPS:-staging-vps}"
STAGING_URL="${STAGING_URL:-https://staging.sorcyn.com}"

echo "=== Step 1: Container down (uptime alert) ==="
ssh "$STAGING_VPS" 'docker compose stop api'
sleep 90
echo "Verify: ContainerDown alert fired in #sorcyn-prod-alerts. Press enter."
read

ssh "$STAGING_VPS" 'docker compose start api'
# ... steps 2-4 from RESEARCH.md §7 ...
```

**Notes:**
- Lives at repo root `scripts/` — NEW directory (per CONTEXT.md `<canonical_refs>` line 168).
- Runbook mode (manual `read` prompts between steps) so the operator can capture Slack screenshots — not automated CI.
- Step 2 needs a `/api/v1/__test/force-500` endpoint (RESEARCH.md Open Question 3) — plan-time decision; recommend gated dev/staging-only endpoint.

---

#### `tests/load/scenarios/full-flow.js` (NEW — k6 script)

**Analog:** none in codebase (k6 is net-new). Use RESEARCH.md §5 (lines 393–425) verbatim.

**RESEARCH.md skeleton:**
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    transaction_loop: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5m', target: 1000 },
        { duration: '15m', target: 1000 },
        { duration: '2m', target: 0 },
      ],
    },
  },
  thresholds: {
    'http_req_duration{type:api}': ['p(95)<500'],
    'http_req_duration{type:search}': ['p(95)<500'],
    'http_req_duration{type:payment}': ['p(95)<3000'],
    'http_req_failed': ['rate<0.01'],
    'iteration_duration': ['p(95)<5000'],
  },
};

export default function () {
  // Login (cached token via setup/teardown)
  // Create post → fetch feed → submit offer → accept → message send
  // Each request tagged: { tags: { type: 'api'|'search'|'payment' } }
}
```

**Notes:**
- Reuses `helpers.ts` `createTestUser` shape adapted as a pre-test setup script; cache 100 buyer + 100 seller JWTs in JSON file the load test reads.
- `xk6-output-prometheus-remote` writes to a SEPARATE staging Prometheus (RESEARCH.md Pitfall 4 — never pollute prod metrics).
- Output: `docs/load-test-summary.json` consumed by audit suite SC1 block.

---

#### `tests/load/thresholds.json` (NEW)

**Analog:** none — companion config to k6 script.

**Skeleton (extracted from k6 `thresholds` block above):**
```json
{
  "http_req_duration{type:api}": ["p(95)<500"],
  "http_req_duration{type:search}": ["p(95)<500"],
  "http_req_duration{type:payment}": ["p(95)<3000"],
  "http_req_failed": ["rate<0.01"],
  "iteration_duration": ["p(95)<5000"]
}
```

---

#### `.github/workflows/load-test.yml` (NEW)

**Analog:** `.github/workflows/ci.yml` (full file, especially `test` job lines 32–78 services pattern + `deploy` job environment gate).

**Existing test-job pattern with services (lines 32–78):**
```yaml
test:
  name: Tests
  runs-on: ubuntu-latest
  defaults:
    run:
      working-directory: backend
  services:
    postgres:
      image: postgres:15-alpine
      ports: [5432:5432]
    redis:
      image: redis:7-alpine
      ports: [6379:6379]
  steps:
    - uses: actions/checkout@v4
    - run: npm ci
    - run: npm run test:coverage
```

**New load-test workflow shape:**
```yaml
name: Load Test
on:
  workflow_dispatch:
  schedule:
    - cron: '0 8 * * 1'  # Mondays 08:00 UTC

jobs:
  k6:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run k6
        uses: grafana/k6-action@v0.3.1
        with:
          filename: tests/load/scenarios/full-flow.js
          flags: --out json=docs/load-test-summary.json
        env:
          STAGING_URL: ${{ secrets.STAGING_URL }}
          K6_PROMETHEUS_RW_SERVER_URL: ${{ secrets.STAGING_PROM_URL }}
      - uses: actions/upload-artifact@v4
        with:
          name: load-test-summary
          path: docs/load-test-summary.json
```

---

#### `.github/workflows/security-scan.yml` (NEW)

**Analog:** `.github/workflows/ci.yml` `test` job pattern + RESEARCH.md §13 (lines 791–812).

**Skeleton (RESEARCH.md verbatim with pin updates):**
```yaml
name: Security Scan
on:
  push:
    branches: [main]
  schedule:
    - cron: '0 6 * * *'  # daily

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Snyk backend
        uses: snyk/actions/node@master
        env: { SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }} }
        with:
          args: --file=backend/package-lock.json --severity-threshold=high
      - name: Snyk mobile (Dart)
        run: |
          npm install -g snyk
          snyk test --file=mobile/pubspec.yaml --severity-threshold=high
      - name: ZAP Baseline
        uses: zaproxy/action-baseline@v0.13.0
        with:
          target: 'https://staging.sorcyn.com'
          rules_file_name: '.github/zap-rules.tsv'
          fail_action: true
```

**Notes:**
- Gate fails on HIGH or CRITICAL severity (RESEARCH.md SC2b).
- ZAP active scan must NOT hit production (RESEARCH.md §13: "ZAP's active scan can trigger destructive operations").
- Reports written to `docs/security-scans/zap-report-{date}.html` + `docs/security-scans/snyk-report-{date}.json` (gitignored, retained 90 d as CI artifact).

---

### Wave 4 — A11Y + UAT + Final Audit Gate

#### `mobile/test/a11y/a11y_test.dart` (NEW)

**Analog:** none in mobile/ (Phase 1 widget_test.dart is empty boilerplate). Use Flutter built-in `meetsGuideline` API per RESEARCH.md §8 (lines 565–581).

**Skeleton:**
```dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sorcyn/app.dart'; // adjust import to actual app entry

void main() {
  testWidgets('Login screen passes Flutter Guideline API', (tester) async {
    await tester.pumpWidget(const ProviderScope(child: App()));
    await tester.pumpAndSettle();

    final handle = tester.ensureSemantics();
    await expectLater(tester, meetsGuideline(textContrastGuideline));
    await expectLater(tester, meetsGuideline(androidTapTargetGuideline));
    await expectLater(tester, meetsGuideline(iOSTapTargetGuideline));
    await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
    handle.dispose();
  });

  // Repeat for each of the 40 customer-facing screens
}
```

**Notes:**
- Coverage target: every Flutter screen referenced in `mobile/lib/app.dart` GoRoute table.
- Pair with manual TalkBack/VoiceOver walkthrough; manual results captured in `docs/A11Y_AUDIT.md`.
- `flutter test --coverage` already wired in Phase 1.

---

#### `docs/A11Y_AUDIT.md` (NEW)

**Analog:** none — RESEARCH.md §8 (lines 597–603) provides the full table format.

**Skeleton:**
```markdown
# WCAG 2.1 AA Audit — 40 Customer-Facing Flutter Screens

Per RESEARCH.md §8: PASS = automated `meetsGuideline` + manual TalkBack/VoiceOver walkthrough green.

<!-- AUDIT-MARKER:A11Y -->
| Screen | Tap Target | Contrast | SR Label | Keyboard | Status |
|--------|-----------|----------|----------|----------|--------|
| LoginScreen | PASS | PASS | PASS | N/A (mobile) | PASS |
| RegisterScreen | PASS | PASS | PASS | N/A | PASS |
| BuyerDashboardScreen | TBD | TBD | TBD | TBD | TBD |
| ... (40 rows total) | | | | | |
<!-- /AUDIT-MARKER:A11Y -->
```

**Notes:** Audit suite SC3 block parses inside `<!-- AUDIT-MARKER:A11Y -->` markers and asserts every row's `Status` column = `PASS`.

---

#### `docs/UAT_SCRIPT.md` (NEW)

**Analog:** none — RESEARCH.md §6 + Phase 3 closeout surface list.

**Skeleton:**
```markdown
# UAT Script — Pre-Launch Beta

## Recruitment
10 buyers + 10 sellers from DFW. Sources: Sorcyn waitlist, DFW Reddit, founder network.

## Full Transaction Loop (every tester runs once)
1. Register account (verify EIN gate for business accounts — Phase 3 closeout surface)
2. Post a buyer request (AI-assisted + manual paths)
3. Submit offer as seller (verify counter-offer flow up to 5 rounds)
4. Accept offer → Stripe escrow funded
5. Mark complete → Buyer approves → Funds released
6. Submit review with before/after photos
7. Stripe Identity hosted-flow (Phase 3 closeout surface)
8. Post a Jobs request → verify roleTier dropdown + lead-fee display

## Captured per tester
- Email, role (buyer/seller), date completed
- P0 bugs (block transaction loop)
- P1 bugs (workflow friction)
- Free-form feedback
```

---

#### `docs/UAT_REPORT.md` (NEW)

**Analog:** none — audit-suite-parseable sign-off table.

**Skeleton:**
```markdown
# UAT Report

## Summary
- Target: 20 sign-offs (10 buyers + 10 sellers)
- P0 bugs: 0 unresolved at sign-off

## Sign-Off Table
<!-- AUDIT-MARKER:UAT -->
| Tester | Role | Date | P0 bugs | P1 bugs | Status |
|--------|------|------|---------|---------|--------|
| Tester 01 | buyer | 2026-XX-XX | 0 | 1 (resolved) | SIGNED |
| ... | | | | | |
<!-- /AUDIT-MARKER:UAT -->
```

**Notes:** Audit suite SC5b block counts rows inside `<!-- AUDIT-MARKER:UAT -->` and asserts ≥20 with `Status = SIGNED`.

---

#### `docs/PCI_SAQ_A.md` (NEW)

**Analog:** none — RESEARCH.md §12 (lines 745–763) provides the full template.

**Skeleton (RESEARCH.md verbatim):**
```markdown
# PCI-DSS SAQ-A Attestation

**Filed:** 2026-XX-XX
**Stripe support ticket:** [link or thread ID]
**Stripe response:** [paste authoritative answer]

## Integration Surface
- Stripe Connect Standard (DEC-stripe-connect-standard)
- Separate Charges + Transfers (DEC-separate-charges-and-transfers)
- flutter_stripe PaymentSheet on mobile (DEC-flutter-stripe)
- Stripe Identity hosted verification (Phase 3 03-06)

## SAQ-A Self-Assessment
[answer each of the 31 SAQ-A questions]

## Attestation
Signed: Faisal Idris, NiftyByte LLC, [date]
```

**Notes:** Audit suite SC2c asserts file exists + has dated `**Filed:**` line. Stripe support confirmation is a hard prerequisite per STATE.md blocker.

---

## Shared Patterns (cross-cutting)

### Pattern: Lazy SDK Init (CLAUDE.md "Critical Design Patterns")

**Source:** `backend/src/config/stripe.ts` lines 1–16

**Apply to:**
- `backend/src/config/sentry.ts` (already follows; preserve `initialized` flag when adding integrations)
- `backend/src/config/logtail.ts` (NEW — use this as the canonical template)
- Any new SDK config file Phase 4 introduces

**Excerpt:**
```typescript
import Stripe from 'stripe';
import { env } from './env.js';
let _stripe: Stripe | null = null;
export function getStripe(): Stripe {
  if (!_stripe) {
    if (!env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is not configured');
    _stripe = new Stripe(env.STRIPE_SECRET_KEY, { typescript: true });
  }
  return _stripe;
}
```

---

### Pattern: validateProductionEnv Prod-Startup Gate (Phase 3 plan 03-02 anchor)

**Source:** `backend/src/config/env.ts` lines 86–109

**Apply to:**
- All new Phase 4 env vars that are launch-blocking (`BETTER_STACK_TOKEN`)
- Warn-only for non-blocking vars (`SENTRY_DSN`, `SENTRY_TRACES_SAMPLE_RATE`)

**Excerpt:**
```typescript
export function validateProductionEnv(config: Env): void {
  if (config.NODE_ENV !== 'production') return;
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!config.STRIPE_SECRET_KEY) errors.push('STRIPE_SECRET_KEY is required in production');
  if (!config.SENDGRID_API_KEY) warnings.push('SENDGRID_API_KEY not set — emails will be stubbed');
  for (const w of warnings) console.warn(`[ENV WARNING] ${w}`);
  if (errors.length > 0) {
    for (const e of errors) console.error(`[ENV ERROR] ${e}`);
    process.exit(1);
  }
}
```

**Important:** Updates to env schema MUST also update the `baseProductionEnv` fixture in `backend/tests/audit/closeout-audit.test.ts` lines 22–43 — otherwise SC6 block (and any new Phase 4 env block) breaks.

---

### Pattern: Audit-Suite-as-CI-Gate (Phase 3 closeout-audit pattern)

**Source:** `backend/tests/audit/closeout-audit.test.ts` lines 1–305

**Apply to:** Every Phase 4 success criterion. CI gate stays single-command: `npx vitest run tests/audit`.

**Three sub-patterns:**

1. **Source-grep assertion** (lines 91–102):
   ```typescript
   const src = readSrc('backend/src/modules/offers/offers.service.ts');
   expect(src).toMatch(/MAX_COUNTER_DEPTH\s*=\s*5/);
   ```

2. **File-existence assertion** (lines 130–134):
   ```typescript
   expect(existsSync(resolve(backendRoot, 'src/modules/saved-sellers/saved-sellers.routes.ts'))).toBe(true);
   ```

3. **Schema-parse assertion** (lines 213–244):
   ```typescript
   const { registerSchema } = await import('../../src/modules/auth/auth.schemas.js');
   const result = registerSchema.safeParse({ /* fixture */ });
   expect(result.success).toBe(false);
   ```

4. **Phase 4 NEW: JSON-artifact parse assertion** (RESEARCH.md §14):
   ```typescript
   const summary = JSON.parse(readFileSync(resolve(backendRoot, '../docs/load-test-summary.json'), 'utf-8'));
   expect(summary.metrics['http_req_duration{type:api}'].values['p(95)']).toBeLessThan(500);
   ```

5. **Phase 4 NEW: Markdown-table parse assertion** (with `<!-- AUDIT-MARKER -->` brackets per Pitfall 10):
   ```typescript
   const auditMd = readFileSync(resolve(backendRoot, '../docs/A11Y_AUDIT.md'), 'utf-8');
   const tableBlock = auditMd.match(/<!-- AUDIT-MARKER:A11Y -->([\s\S]*?)<!-- \/AUDIT-MARKER:A11Y -->/);
   expect(tableBlock).toBeTruthy();
   const rows = tableBlock![1].split('\n').filter(l => l.startsWith('|') && !l.includes('---'));
   for (const row of rows.slice(1)) { // skip header
     expect(row).toMatch(/PASS\s*\|?\s*$/);
   }
   ```

---

### Pattern: GitHub Actions SSH Deploy Step (existing CI shape)

**Source:** `.github/workflows/ci.yml` lines 113–123

**Apply to:** `deploy-canary.yml`, `rollback.yml`, and any new Phase 4 deploy workflow.

**Excerpt:**
```yaml
- uses: appleboy/ssh-action@v1
  with:
    host: ${{ secrets.DEPLOY_HOST }}
    username: ${{ secrets.DEPLOY_USER }}
    key: ${{ secrets.DEPLOY_SSH_KEY }}
    script: |
      cd /opt/reverse-marketplace
      docker compose -f docker-compose.production.yml pull api
      docker compose -f docker-compose.production.yml up -d --no-deps api
```

**Phase 4 additions:** swap `DEPLOY_HOST` for stage-specific secrets (`CANARY_VPS_HOST`, `LB_HOST`).

---

### Pattern: Riverpod StateNotifier Action (mobile)

**Source:** `mobile/lib/features/sellers/providers/seller_provider.dart` lines 187–200

**Apply to:** New `startIdentityVerification` action; any other Phase 4 mobile state actions.

**Excerpt:**
```dart
Future<StripeOnboardingResult?> startStripeOnboarding() async {
  state = state.copyWith(isLoading: true, clearError: true);
  try {
    final result = await _repository.startStripeOnboarding();
    state = state.copyWith(isLoading: false);
    return result;
  } catch (e) {
    state = state.copyWith(isLoading: false, error: _extractError(e));
    return null;
  }
}
```

---

### Pattern: Vitest Integration Test (TESTING.md canonical)

**Source:** `backend/tests/helpers.ts` factories + TESTING.md examples

**Apply to:** `backend/tests/sellers.test.ts` Identity smoke + `backend/tests/auth.test.ts` EIN-gate smoke + any new Phase 4 backend tests (coverage gap-fill payments/transactions/auth).

**Excerpt:**
```typescript
import { createTestUser, authHeaders, cleanupTestData } from './helpers.js';

beforeAll(async () => {
  const { buildApp } = await import('../src/app.js');
  app = await buildApp();
  await app.ready();
});
afterAll(async () => {
  await cleanupTestData(['testuser_']);
  await redis.quit();
  await prisma.$disconnect();
  await app.close();
});
beforeEach(clearAuthRedisKeys);

describe('POST /api/v1/sellers/identity/verify', () => {
  it('returns Stripe Identity URL for authenticated seller', async () => {
    const seller = await createTestUser(app, { accountType: 'seller' });
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/sellers/identity/verify',
      headers: authHeaders(seller.token),
    });
    expect(res.statusCode).toBe(200);
  });
});
```

**Mocking rule (TESTING.md):**
- MOCK: Stripe SDK (`vi.mock('../src/config/stripe.js', ...)`)
- DO NOT MOCK: Prisma, Redis, Fastify routes

---

### Pattern: ADR Entry Shape (decisions.md)

**Source:** `.planning/intel/decisions.md` lines 12–17

**Apply to:** D-04 ADR (`DEC-forward-compatible-migrations`) and any future Phase 4 ADR.

**Excerpt:**
```markdown
### DEC-fastify-framework
- **scope:** HTTP framework
- **decision:** Fastify 5 as the HTTP framework (not Express)
- **status:** locked
- **rationale:** Built-in schema validation, pino logging, plugin system, TypeScript-first, faster than Express, official Swagger/OpenAPI plugin
- **source:** docs/decisions.md (Session 1)
```

---

## No Analog Found

Files where the codebase has no close existing match — planner uses RESEARCH.md skeletons + tool docs:

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `tests/load/scenarios/full-flow.js` | k6 test | k6 ramping-VUs + thresholds | k6 is net-new tool; first scripted scenario in repo |
| `tests/load/thresholds.json` | k6 config | JSON thresholds | k6-only artifact |
| `nginx/canary-state.json` | infra state | weighted-upstream JSON | NEW pattern; lives on LB host, seeded once |
| `mobile/test/a11y/a11y_test.dart` | Flutter widget test | meetsGuideline assertions | Only existing `mobile/test/widget_test.dart` is empty |
| `docs/A11Y_AUDIT.md` | docs audit | per-screen pass/fail markdown | NEW table format; consumed by audit suite |
| `docs/UAT_SCRIPT.md` | docs | freeform UAT instructions | NEW |
| `docs/UAT_REPORT.md` | docs | sign-off table | NEW |
| `docs/PCI_SAQ_A.md` | docs | attestation form | NEW; RESEARCH.md provides verbatim template |

---

## Metadata

**Analog search scope:**
- `backend/src/config/` (Sentry, Stripe, env) — for lazy-init + prod-gate patterns
- `backend/tests/audit/` (closeout-audit) — for audit-as-CI-gate shape
- `backend/tests/helpers.ts` + TESTING.md — for Vitest integration test shape
- `backend/scripts/` (backup.sh) — for bash script patterns
- `.github/workflows/ci.yml` — for SSH-deploy shape and CI services pattern
- `nginx/nginx.conf` — for upstream + proxy_pass conventions
- `mobile/lib/features/sellers/` (stripe_onboard_screen, seller_provider, seller_repository) — for Phase 3 Stripe Identity shape
- `mobile/lib/features/auth/register_screen.dart` — for Flutter form + AppInputField + Validator pattern
- `mobile/lib/features/posts/manual_post_creation_screen.dart` — for category-conditional UI
- `mobile/lib/app.dart` — for GoRoute + springPage registration
- `mobile/lib/main.dart` — for SentryFlutter init shape
- `.planning/intel/decisions.md` — for ADR entry format
- `CLAUDE.md` "Critical Design Patterns" block — for design-pattern bullet shape
- `docs/DEPLOYMENT.md` — for runbook structure

**Files scanned:** 14 analog source files read end-to-end or in the relevant ranges.

**Pattern extraction date:** 2026-04-30

**Related artifacts (consumed by gsd-planner):**
- `.planning/phases/04-pre-launch-hardening/04-CONTEXT.md` — locked decisions D-01..D-08 + Claude's discretion areas
- `.planning/phases/04-pre-launch-hardening/04-RESEARCH.md` — 7-plan / 5-wave skeleton + Pitfalls + Tooling Decisions

## PATTERN MAPPING COMPLETE
