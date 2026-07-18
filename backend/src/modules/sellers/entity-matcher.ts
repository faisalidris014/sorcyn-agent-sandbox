/**
 * Basic identity matcher for license verification (#337, epic #334 Phase 3).
 *
 * Confirms that a seller's claimed holder name plausibly matches the name on a
 * license record (owner or business name). Intentionally simple: normalize, then
 * token-overlap (Dice coefficient) against a threshold. This is NOT a fraud-proof
 * identity binding — a seller can copy the public record name — it is a sanity
 * check that the license number belongs to the claimed name. Advanced fuzzy
 * matching and gov-ID identity binding are #337 follow-ups.
 *
 * Below threshold → the caller sends the request to manual review (queue) with
 * both names in the reason, rather than auto-approving or hard-rejecting.
 */

export interface MatchResult {
  /** Token-overlap score in [0, 1]. */
  score: number;
  matched: boolean;
}

/** Default token-overlap threshold for a confident name match. Tunable. */
export const DEFAULT_MATCH_THRESHOLD = 0.6;

/**
 * Tokens dropped during normalization: business entity suffixes and name
 * generational suffixes. They add noise without identifying the person/business.
 */
const STRIP_TOKENS = new Set([
  // business entity suffixes
  'inc',
  'incorporated',
  'llc',
  'llp',
  'lp',
  'ltd',
  'co',
  'corp',
  'corporation',
  'company',
  'dba',
  'pllc',
  'pc',
  'pa',
  'group',
  'the',
  // generational suffixes
  'jr',
  'sr',
  'ii',
  'iii',
  'iv',
]);

/**
 * Normalize a name into comparable lowercase tokens: handle "Last, First"
 * ordering, strip punctuation, and drop business/generational suffix noise.
 */
export function normalizeName(raw: string | undefined | null): string[] {
  if (!raw) return [];
  let s = raw.toLowerCase().trim();

  // "Last, First [Middle]" → "First [Middle] Last"
  const comma = s.indexOf(',');
  if (comma !== -1) {
    const last = s.slice(0, comma).trim();
    const rest = s.slice(comma + 1).trim();
    s = `${rest} ${last}`.trim();
  }

  // punctuation → spaces, then tokenize and drop noise
  s = s.replace(/[^a-z0-9\s]/g, ' ');
  return s
    .split(/\s+/)
    .filter(Boolean)
    .filter((t) => !STRIP_TOKENS.has(t));
}

/** Sørensen–Dice coefficient over two token sets (order-independent). */
function diceScore(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  let overlap = 0;
  for (const t of setA) {
    if (setB.has(t)) overlap += 1;
  }
  return (2 * overlap) / (setA.size + setB.size);
}

/**
 * Compare a claimed name against a record name. Order-independent, so
 * "John Smith" and "Smith, John" match. Returns the score and whether it meets
 * the threshold.
 */
export function matchIdentity(
  claimedName: string | undefined | null,
  recordName: string | undefined | null,
  threshold: number = DEFAULT_MATCH_THRESHOLD,
): MatchResult {
  const score = diceScore(normalizeName(claimedName), normalizeName(recordName));
  return { score, matched: score >= threshold };
}
