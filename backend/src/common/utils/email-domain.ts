/**
 * Free email-domain denylist used to gate Jobs post creation (Phase 3 plan 07).
 *
 * Per Addendum to plan 07: only employers with a real (non-free) email domain
 * may create Jobs posts. This is enforced at post-creation time in
 * `posts.service.createPost`, NOT at registration. Free-email users can still
 * register and post Services / Products.
 */
export const FREE_EMAIL_DOMAINS: ReadonlySet<string> = new Set([
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'aol.com',
  'icloud.com',
  'proton.me',
  'protonmail.com',
]);

/**
 * Returns true when the given email's domain is on the FREE_EMAIL_DOMAINS list.
 * Comparison is case-insensitive on the domain part. An empty/malformed email
 * returns false (no false positives — the registration validator will catch
 * malformed emails before this point).
 */
export function isFreeEmailDomain(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const at = email.lastIndexOf('@');
  if (at < 0 || at === email.length - 1) return false;
  const domain = email.slice(at + 1).toLowerCase();
  return FREE_EMAIL_DOMAINS.has(domain);
}
