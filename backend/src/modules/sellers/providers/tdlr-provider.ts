/**
 * TX TDLR license verification adapter (#337, epic #334 Phase 3).
 *
 * Implements {@link LicenseVerificationProvider} for authority `TX_TDLR`. Queries
 * the Texas Open Data Portal (Socrata SODA API), dataset `7358-krk7`
 * ("TDLR - All Licenses"), by license number, then runs a basic entity match of
 * the seller's claimed holder name against the record's owner/business name.
 *
 * Escrow-safe decision policy (the router maps these to outcomes):
 *   - active license + confident name match  → approve   (auto_approve)
 *   - license found, name match too weak      → queue     (manual review)
 *   - license found but expired (name matched)→ reject    (auto_reject)
 *   - license number not found in a gated trade→ queue    (possible typo)
 *   - missing license number / upstream error → queue     (never hard-reject)
 *
 * Known v1 simplifications (see #337 follow-ups):
 *   - Dataset `7358-krk7` is ALL TDLR programs (cosmetology, tow trucks, …), so
 *     we filter to the construction trades this authority gates (electrical +
 *     A/C & refrigeration) by license-type keyword. We do NOT yet distinguish an
 *     electrical request from an HVAC one — a valid license in either gated trade
 *     satisfies either request. Per-subcategory license-type precision is a
 *     follow-up.
 *   - The machine data carries no Active/Suspended/Revoked status; validity is
 *     derived from presence + a future expiration date. Suspended/revoked
 *     licenses are not detectable here — see the spike doc.
 */

import {
  type LicenseVerificationProvider,
  type ProviderVerifyResult,
} from '../category-verification.js';
import { matchIdentity, DEFAULT_MATCH_THRESHOLD } from '../entity-matcher.js';
import { env } from '../../../config/env.js';

const SODA_BASE_URL = 'https://data.texas.gov';
const DATASET_ID = '7358-krk7';
const DEFAULT_TIMEOUT_MS = 5000;

/** License-type keywords for the construction trades TX_TDLR gates here. */
const GATED_TRADE_KEYWORDS = ['electric', 'air conditioning', 'refrigeration', 'hvac'];

/** Subset of SODA fields we read (dataset 7358-krk7). */
interface TdlrRecord {
  license_number?: string;
  license_type?: string;
  license_subtype?: string;
  owner_name?: string;
  business_name?: string;
  license_expiration_date_mmddccyy?: string;
}

/** Injectable fetch signature (native fetch in prod, a stub in tests). */
export type FetchFn = (
  url: string,
  init?: { headers?: Record<string, string>; signal?: AbortSignal },
) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;

export interface TdlrProviderOptions {
  fetchFn?: FetchFn;
  appToken?: string;
  baseUrl?: string;
  timeoutMs?: number;
  threshold?: number;
}

function isGatedTrade(licenseType?: string): boolean {
  if (!licenseType) return false;
  const t = licenseType.toLowerCase();
  return GATED_TRADE_KEYWORDS.some((k) => t.includes(k));
}

/**
 * Parse a TDLR expiration date into a Date, or null if unparseable.
 * The `_mmddccyy` field is an 8-digit MMDDYYYY string; also tolerate ISO and
 * MM/DD/YYYY shapes in case the SODA mirror differs.
 */
export function parseTdlrExpiration(raw?: string): Date | null {
  if (!raw) return null;
  const s = raw.trim();
  if (s.includes('-') || s.includes('T')) {
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (/^\d{8}$/.test(s)) {
    const mm = Number(s.slice(0, 2));
    const dd = Number(s.slice(2, 4));
    const yyyy = Number(s.slice(4, 8));
    if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
    return new Date(yyyy, mm - 1, dd);
  }
  const slash = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    return new Date(Number(slash[3]), Number(slash[1]) - 1, Number(slash[2]));
  }
  return null;
}

export class TdlrProvider implements LicenseVerificationProvider {
  readonly authority = 'TX_TDLR';

  private readonly fetchFn: FetchFn;
  private readonly appToken?: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly threshold: number;

  constructor(opts: TdlrProviderOptions = {}) {
    // Lazy: native fetch resolved at construction, no SDK init on import.
    this.fetchFn = opts.fetchFn ?? (globalThis.fetch as unknown as FetchFn);
    this.appToken = opts.appToken ?? env.TDLR_APP_TOKEN;
    this.baseUrl = opts.baseUrl ?? SODA_BASE_URL;
    this.timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.threshold = opts.threshold ?? DEFAULT_MATCH_THRESHOLD;
  }

  async verify(input: {
    licenseNumber?: string;
    holderName?: string;
    subcategoryIds: string[];
  }): Promise<ProviderVerifyResult> {
    const licenseNumber = input.licenseNumber?.trim();
    if (!licenseNumber) {
      return { approved: false, outcome: 'queue', reason: 'license_number_missing', context: {} };
    }

    let records: TdlrRecord[];
    try {
      records = await this.fetchByLicenseNumber(licenseNumber);
    } catch (err) {
      // Never hard-reject on a transient failure — defer to a human.
      return {
        approved: false,
        outcome: 'queue',
        reason: 'provider_unreachable',
        context: { authority: this.authority, error: err instanceof Error ? err.message : String(err) },
      };
    }

    // Only consider licenses in the trades this authority gates.
    const tradeRecords = records.filter((r) => isGatedTrade(r.license_type));
    if (tradeRecords.length === 0) {
      return {
        approved: false,
        outcome: 'queue',
        reason: 'license_not_found',
        context: { authority: this.authority, licenseNumber },
      };
    }

    // Best name match across records, scoring against owner AND business name.
    let best: { score: number; record: TdlrRecord } = { score: -1, record: tradeRecords[0] };
    for (const r of tradeRecords) {
      const score = Math.max(
        matchIdentity(input.holderName, r.owner_name, this.threshold).score,
        matchIdentity(input.holderName, r.business_name, this.threshold).score,
      );
      if (score > best.score) best = { score, record: r };
    }
    const rec = best.record;
    const matchScore = Math.max(best.score, 0);

    const context: Record<string, unknown> = {
      authority: this.authority,
      licenseNumber,
      licenseType: rec.license_type ?? null,
      recordName: rec.owner_name || rec.business_name || null,
      claimedName: input.holderName ?? null,
      matchScore: Number(matchScore.toFixed(2)),
      expirationDate: rec.license_expiration_date_mmddccyy ?? null,
    };

    // Name match gates everything: if we can't tie the license to the claimed
    // holder, send to manual review rather than approve or reject.
    if (matchScore < this.threshold) {
      return { approved: false, outcome: 'queue', reason: 'name_mismatch', context };
    }

    // Name matched — now check validity by expiration.
    const exp = parseTdlrExpiration(rec.license_expiration_date_mmddccyy);
    if (exp === null) {
      // Can't determine validity → manual review (don't approve a possibly-lapsed license).
      return { approved: false, outcome: 'queue', reason: 'expiration_unparseable', context };
    }
    if (exp.getTime() < Date.now()) {
      return { approved: false, outcome: 'auto_reject', reason: 'license_expired', context };
    }

    return { approved: true, reason: 'provider_approved', context };
  }

  private async fetchByLicenseNumber(licenseNumber: string): Promise<TdlrRecord[]> {
    const url = new URL(`${this.baseUrl}/resource/${DATASET_ID}.json`);
    url.searchParams.set('license_number', licenseNumber);
    url.searchParams.set('$limit', '50');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const headers: Record<string, string> = { accept: 'application/json' };
      if (this.appToken) headers['X-App-Token'] = this.appToken;

      const res = await this.fetchFn(url.toString(), { headers, signal: controller.signal });
      if (!res.ok) {
        throw new Error(`TDLR SODA responded ${res.status}`);
      }
      const json = await res.json();
      return Array.isArray(json) ? (json as TdlrRecord[]) : [];
    } finally {
      clearTimeout(timer);
    }
  }
}
