/**
 * Seller category-access verification router (#336 / epic #334 Phase 2).
 *
 * Pure decision logic — no Prisma, no I/O. Given a seller's submission and the
 * per-subcategory config, decide one of three outcomes:
 *   - auto_approve → grant immediately (instant subs, or a provider that verifies)
 *   - auto_reject  → reject immediately with a reason (a provider that rejects)
 *   - queue        → send to the admin review queue (manual_only, or `verify` with
 *                    no provider wired yet)
 *
 * Escrow safety: licensed work is NEVER optimistically unlocked. A `verify`
 * subcategory with no provider falls back to the manual queue rather than
 * unlocking. Phase 3 (#337) registers the TX TDLR provider; until then the
 * registry is empty so all `verify` rows queue.
 */

export type VerificationMode = 'instant' | 'verify' | 'manual_only';
export type RequestOutcome = 'auto_approve' | 'auto_reject' | 'queue';

export interface CategoryConfig {
  subcategoryId: string;
  mode: VerificationMode;
  isLicensed: boolean;
  licenseAuthority: string | null;
  requiresBackgroundCheck: boolean;
  /** #381: this subcategory prompts an OPTIONAL insurance certificate. */
  recommendsInsurance?: boolean;
}

export interface SubmittedDocument {
  type: string; // 'id' | 'license' | 'background_check'
  url: string;
}

export interface CategorySubmission {
  majorCategoryId: string;
  subcategoryIds: string[];
  documents: SubmittedDocument[];
  licenseNumber?: string;
  holderName?: string;
}

export interface ProviderVerifyResult {
  approved: boolean;
  reason: string;
  context?: Record<string, unknown>;
  /**
   * Optional explicit routing hint. When `'queue'`, the router sends the request
   * to manual review instead of auto-rejecting — used for ambiguous matches,
   * not-found, or an unreachable upstream (escrow-safe: never optimistic-unlock,
   * and don't hard-reject a possibly-legit seller on a transient failure).
   * Defaults to `approved ? 'auto_approve' : 'auto_reject'`.
   */
  outcome?: RequestOutcome;
}

export interface LicenseVerificationProvider {
  authority: string;
  verify(input: {
    licenseNumber?: string;
    holderName?: string;
    subcategoryIds: string[];
  }): Promise<ProviderVerifyResult>;
}

export interface RouterDecision {
  outcome: RequestOutcome;
  status: 'approved' | 'rejected' | 'pending';
  /** Metric-friendly label (low cardinality). */
  reason: string;
  context: Record<string, unknown> | null;
  requiredDocTypes: string[];
  isLicensed: boolean;
  requiresBackgroundCheck: boolean;
  /** License authority for telemetry; 'none' when not licensed. */
  authority: string;
}

const MODE_RANK: Record<VerificationMode, number> = {
  instant: 0,
  verify: 1,
  manual_only: 2,
};

/**
 * Provider registry keyed by license authority (e.g. 'TX_TDLR').
 * EMPTY in Phase 2 — #337 registers the real TX TDLR adapter here.
 */
export const providerRegistry = new Map<string, LicenseVerificationProvider>();

/** Required document types for a set of configs. `id` is always required. */
export function deriveRequiredDocTypes(configs: CategoryConfig[]): string[] {
  const types = new Set<string>(['id']);
  for (const c of configs) {
    if (c.isLicensed) types.add('license');
    if (c.requiresBackgroundCheck) types.add('background_check');
  }
  return [...types];
}

/**
 * Optional document types for a set of configs (#381). Currently just
 * `insurance`, prompted when any requested subcategory recommends it. Optional
 * docs NEVER gate access — they earn a badge if provided (see `findMissingDocTypes`,
 * which only checks required types).
 */
export function deriveOptionalDocTypes(configs: CategoryConfig[]): string[] {
  const types = new Set<string>();
  for (const c of configs) {
    if (c.recommendsInsurance) types.add('insurance');
  }
  return [...types];
}

/** Required doc types not covered by the submitted documents. */
export function findMissingDocTypes(
  documents: SubmittedDocument[],
  requiredDocTypes: string[],
): string[] {
  const submitted = new Set(documents.map((d) => d.type));
  return requiredDocTypes.filter((t) => !submitted.has(t));
}

/** The most restrictive mode across the requested subcategories. */
export function effectiveMode(configs: CategoryConfig[]): VerificationMode {
  return configs.reduce<VerificationMode>(
    (acc, c) => (MODE_RANK[c.mode] > MODE_RANK[acc] ? c.mode : acc),
    'instant',
  );
}

/**
 * Route a category-access submission to an outcome. Assumes documents have
 * already been validated against {@link deriveRequiredDocTypes} (the caller
 * throws 422 on missing docs before routing).
 */
export async function routeCategoryRequest(
  submission: CategorySubmission,
  configs: CategoryConfig[],
  registry: Map<string, LicenseVerificationProvider> = providerRegistry,
): Promise<RouterDecision> {
  const requiredDocTypes = deriveRequiredDocTypes(configs);
  const isLicensed = configs.some((c) => c.isLicensed);
  const requiresBackgroundCheck = configs.some((c) => c.requiresBackgroundCheck);
  const authority = configs.find((c) => c.licenseAuthority)?.licenseAuthority ?? 'none';
  const mode = effectiveMode(configs);

  const base = { requiredDocTypes, isLicensed, requiresBackgroundCheck, authority };

  if (mode === 'instant') {
    return { ...base, outcome: 'auto_approve', status: 'approved', reason: 'instant', context: null };
  }

  if (mode === 'manual_only') {
    return { ...base, outcome: 'queue', status: 'pending', reason: 'manual_review', context: null };
  }

  // mode === 'verify'
  const provider = authority !== 'none' ? registry.get(authority) : undefined;
  if (!provider) {
    // No provider wired (Phase 2) → manual queue. Never optimistic-unlock licensed work.
    return { ...base, outcome: 'queue', status: 'pending', reason: 'no_provider', context: { authority } };
  }

  const result = await provider.verify({
    licenseNumber: submission.licenseNumber,
    holderName: submission.holderName,
    subcategoryIds: submission.subcategoryIds,
  });

  // A provider may explicitly defer to manual review (ambiguous name match,
  // license not found, or upstream unreachable) rather than approve or reject.
  if (result.outcome === 'queue') {
    return {
      ...base,
      outcome: 'queue',
      status: 'pending',
      reason: result.reason || 'provider_queue',
      context: result.context ?? null,
    };
  }

  if (result.approved) {
    return {
      ...base,
      outcome: 'auto_approve',
      status: 'approved',
      reason: 'provider_approved',
      context: result.context ?? null,
    };
  }

  return {
    ...base,
    outcome: 'auto_reject',
    status: 'rejected',
    reason: result.reason || 'provider_rejected',
    context: result.context ?? null,
  };
}
