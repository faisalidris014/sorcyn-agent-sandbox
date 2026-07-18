/**
 * Shared SSL handling for the pg connection pool (used by both the app runtime
 * `database.ts` and the standalone `prisma/seed.ts`).
 *
 * Supabase presents a self-signed certificate chain, so we connect with SSL but
 * without full chain verification. Two gotchas this centralizes:
 *
 *  1. `sslmode=require` in the connection string is treated by current `pg` as an
 *     alias for `verify-full`, which REJECTS Supabase's self-signed chain and
 *     overrides an explicit `ssl: { rejectUnauthorized: false }`. So we strip the
 *     `sslmode` query param and pass the `ssl` object explicitly instead.
 *  2. We still want to DETECT that SSL is needed from the raw URL (it carries the
 *     `sslmode`/`supabase.` markers) before stripping it.
 */

/** True when the connection should use SSL (Supabase / production / sslmode=require). */
export function urlNeedsSsl(rawUrl: string, nodeEnv?: string): boolean {
  return (
    rawUrl.includes('supabase.') ||
    rawUrl.includes('sslmode=require') ||
    nodeEnv === 'production'
  );
}

/**
 * Remove the `sslmode` query param so it can't escalate to `verify-full` and
 * override the explicit `ssl` option. Leaves non-URL strings untouched.
 */
export function stripSslMode(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    url.searchParams.delete('sslmode');
    return url.toString();
  } catch {
    return rawUrl;
  }
}
