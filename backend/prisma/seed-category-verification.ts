import type { PrismaClient } from '@prisma/client';

type Mode = 'instant' | 'verify' | 'manual_only';

interface ConfigRow {
  slug: string;
  mode: Mode;
  isLicensed?: boolean;
  licenseAuthority?: string;
  requiresBackgroundCheck?: boolean;
  /**
   * #381: prompt an OPTIONAL insurance certificate on this subcategory (drives
   * the "Insured" badge if provided). Never a hard gate. Set on physical /
   * in-home trades where liability insurance is a meaningful buyer signal.
   */
  recommendsInsurance?: boolean;
}

/**
 * Per-subcategory verification policy for the Services/Jobs subcategories
 * (#336 / epic #334 Phase 2; +2 landscaping-split subs in #383). `mode` is the
 * release valve — flip a row in the DB
 * to change handling with no deploy. Products is auto-granted at profile creation
 * and is intentionally NOT configured here.
 *
 * SIGNED OFF (#369): each row below was validated against actual Texas/DFW
 * licensing law. The authoritative write-up, citations, and the legal-mandate
 * vs. platform-trust/safety distinction live in
 * `docs/CATEGORY_VERIFICATION_POLICY.md` — update that doc in lockstep with any
 * change here. No longer a draft.
 *
 * Legal basis (see the policy doc for sources):
 *   - verify (TX TDLR): electrical, hvac — TDLR license required (provider #337)
 *   - manual_only + license: plumbing (TSBPE), pest_control (TDA),
 *                            moving (TxDMV motor-carrier registration, #369)
 *   - manual_only + background check: childcare (HHSC — legally mandated),
 *                            pet_care (platform trust/safety, NOT state-mandated)
 *   - manual_only: other_services (catch-all → manual triage)
 *   - manual_only + license: landscape_irrigation (TCEQ irrigator, Water Code
 *                            Ch. 344), pesticide_application (TDA applicator,
 *                            Cat 3A) — split out of broad `landscaping` in #383
 *   - instant: all remaining service subs + all 7 Jobs subs (no TX state license).
 *     General `landscaping` stays instant (mow/plant/hardscape is unlicensed).
 *     Caveats noted in the policy doc: painting (federal EPA RRP, pre-1978 homes),
 *     handyman (unlicensed until it crosses into electrical/plumbing/HVAC).
 */
const CONFIG_ROWS: ConfigRow[] = [
  // ── verify (TX TDLR) ──────────────────────────────────────
  { slug: 'electrical', mode: 'verify', isLicensed: true, licenseAuthority: 'TX_TDLR', recommendsInsurance: true },
  { slug: 'hvac', mode: 'verify', isLicensed: true, licenseAuthority: 'TX_TDLR', recommendsInsurance: true },

  // ── manual_only + license ─────────────────────────────────
  { slug: 'plumbing', mode: 'manual_only', isLicensed: true, licenseAuthority: 'TX_TSBPE', recommendsInsurance: true },
  { slug: 'pest_control', mode: 'manual_only', isLicensed: true, licenseAuthority: 'TX_TDA', recommendsInsurance: true },
  // Intrastate household-goods movers must hold a TxDMV motor-carrier
  // registration (TxDMV Number) + insurance filing — Transportation Code §643. (#369)
  { slug: 'moving', mode: 'manual_only', isLicensed: true, licenseAuthority: 'TX_TXDMV', recommendsInsurance: true },
  // #383: landscaping sub-split. Landscape irrigation/sprinkler install requires a
  // TCEQ Licensed Irrigator (Water Code Ch. 344); applying pesticide/herbicide to
  // lawns & ornamentals for hire requires a TDA applicator license (Cat 3A).
  // Both are physical trades, so they also recommend optional insurance (#381).
  { slug: 'landscape_irrigation', mode: 'manual_only', isLicensed: true, licenseAuthority: 'TX_TCEQ', recommendsInsurance: true },
  { slug: 'pesticide_application', mode: 'manual_only', isLicensed: true, licenseAuthority: 'TX_TDA', recommendsInsurance: true },

  // ── manual_only + background check ─────────────────────────
  { slug: 'childcare', mode: 'manual_only', requiresBackgroundCheck: true },
  { slug: 'pet_care', mode: 'manual_only', requiresBackgroundCheck: true },

  // ── manual_only ───────────────────────────────────────────
  { slug: 'other_services', mode: 'manual_only' },

  // ── instant (Services) ────────────────────────────────────
  // `recommendsInsurance` set on physical / in-home / on-property trades (#381);
  // left off low-touch services (tutoring, personal_training, photography,
  // event_planning) where liability insurance is not a meaningful buyer signal.
  { slug: 'cleaning', mode: 'instant', recommendsInsurance: true },
  { slug: 'landscaping', mode: 'instant', recommendsInsurance: true },
  { slug: 'painting', mode: 'instant', recommendsInsurance: true },
  { slug: 'roofing', mode: 'instant', recommendsInsurance: true },
  { slug: 'handyman', mode: 'instant', recommendsInsurance: true },
  { slug: 'auto_repair', mode: 'instant', recommendsInsurance: true },
  { slug: 'tutoring', mode: 'instant' },
  { slug: 'personal_training', mode: 'instant' },
  { slug: 'photography', mode: 'instant' },
  { slug: 'event_planning', mode: 'instant' },

  // ── instant (Jobs — all 7) ────────────────────────────────
  { slug: 'entry_level', mode: 'instant' },
  { slug: 'skilled_trade', mode: 'instant' },
  { slug: 'professional', mode: 'instant' },
  { slug: 'management', mode: 'instant' },
  { slug: 'part_time', mode: 'instant' },
  { slug: 'contract', mode: 'instant' },
  { slug: 'other_jobs', mode: 'instant' },
];

/**
 * Seeds CategoryVerificationConfig (idempotent upsert keyed by subcategoryId).
 * Resolves each slug to its real category UUID via the `catId` map returned by
 * seedCategories — SellerProfile/config must store UUIDs, not slugs (#179).
 * Shared by prisma/seed.ts and tests/global-setup.ts.
 */
export async function seedCategoryVerificationConfig(
  prisma: PrismaClient,
  catId: Record<string, string>,
): Promise<number> {
  let count = 0;
  for (const row of CONFIG_ROWS) {
    const subcategoryId = catId[row.slug];
    if (!subcategoryId) continue; // slug not seeded — skip defensively
    await prisma.categoryVerificationConfig.upsert({
      where: { subcategoryId },
      update: {
        mode: row.mode,
        isLicensed: row.isLicensed ?? false,
        licenseAuthority: row.licenseAuthority ?? null,
        requiresBackgroundCheck: row.requiresBackgroundCheck ?? false,
        recommendsInsurance: row.recommendsInsurance ?? false,
      },
      create: {
        subcategoryId,
        mode: row.mode,
        isLicensed: row.isLicensed ?? false,
        licenseAuthority: row.licenseAuthority ?? null,
        requiresBackgroundCheck: row.requiresBackgroundCheck ?? false,
        recommendsInsurance: row.recommendsInsurance ?? false,
      },
    });
    count++;
  }
  return count;
}
