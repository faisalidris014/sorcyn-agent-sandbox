/**
 * Current Terms of Service version accepted at signup (issue #314).
 *
 * Bump this string whenever the published Terms document changes so that
 * `User.termsVersion` records exactly which version each user agreed to. Users
 * created before acceptance tracking existed are backfilled to the sentinel
 * `'pre-v1'` (see the add_terms_acceptance migration); this launch version is
 * intentionally distinct from that sentinel.
 *
 * The Terms carry the rights-to-upload representation + indemnity (no per-upload
 * checkbox). Published document for this version:
 *   docs/legal/TERMS_OF_SERVICE.md  (rights-to-upload §4.1, IP indemnity §5)
 * When the Terms text materially changes, bump this string AND the version in
 * that document so signups record exactly what the user agreed to (issue #387).
 */
export const CURRENT_TERMS_VERSION = 'v1';
