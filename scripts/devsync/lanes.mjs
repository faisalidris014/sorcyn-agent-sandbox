/**
 * Lane mapping for the realtime work-claim system.
 *
 * As of 2026-06-15 Faisal & Mohamed BOTH own the full stack — the old
 * backend-vs-mobile ownership split is retired. Collision-avoidance now rests on
 * the same-file claim gate in claim.mjs (still active), NOT on lane ownership.
 * So `isOutOfLane` always returns false: there are no out-of-lane edits anymore.
 *
 * The path-classification helpers below are kept for reporting/labelling only
 * (e.g. showing whether a claimed file is backend/mobile/shared). They no longer
 * gate anything. See .planning/WORK_SPLIT.md for the full-stack model.
 */

/** Normalise an absolute or messy path to a repo-relative POSIX path. */
export function toRepoRelative(filePath, repoRoot) {
  if (!filePath) return '';
  let p = String(filePath).replace(/\\/g, '/');
  if (repoRoot) {
    const root = String(repoRoot).replace(/\\/g, '/').replace(/\/+$/, '');
    if (p.startsWith(root + '/')) p = p.slice(root.length + 1);
  }
  // Fallback: strip everything up to and including a ReverseMarketplace/ segment.
  p = p.replace(/^.*?ReverseMarketplace\//, '');
  return p.replace(/^\.?\/+/, '');
}

/** Which lane does a repo-relative path belong to? */
export function laneForPath(relPath) {
  const p = relPath.replace(/^\.?\/+/, '');
  if (p.startsWith('mobile/')) return 'mobile';
  if (
    p.startsWith('backend/') ||
    p.startsWith('nginx/') ||
    p.startsWith('.github/workflows/') ||
    p.startsWith('scripts/') ||
    /^Dockerfile/.test(p) ||
    /^docker-compose/.test(p)
  ) {
    return 'backend';
  }
  // docs/, .planning/, contracts/, .claude/, root *.md, root configs, .github meta
  return 'shared';
}

/**
 * Which lane does a person own? Both known operators now own the full stack;
 * retained only so existing callers/labels keep resolving. 'full' means
 * "owns everything", so it never registers as out of lane.
 */
export function laneForPerson(person) {
  if (person === 'mohamed' || person === 'faisal') return 'full';
  return 'unknown';
}

/**
 * Out-of-lane warnings are retired (2026-06-15): both operators own the full
 * stack, so no edit is ever out of lane. Same-file collision detection in
 * claim.mjs is unaffected and remains the active safety net. Kept as a stable
 * no-op so callers in claim.mjs/reporting don't need to change.
 */
export function isOutOfLane(person, relPath) {
  return false;
}
