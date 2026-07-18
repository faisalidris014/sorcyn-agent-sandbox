/**
 * Test-database safety guardrail (issue #133).
 *
 * The integration suite performs destructive `DELETE FROM ...` operations in
 * global setup and teardown. Historically these ran against whatever
 * `DATABASE_URL` resolved to — which on a normal machine is the *dev* database
 * (`reverse_marketplace`). That silently wiped the seed accounts every test run.
 *
 * This guard is the enforceable "tests never touch dev data" guarantee: before
 * any destructive query runs, callers MUST pass through `assertTestDatabase()`.
 * It refuses to proceed unless BOTH conditions hold:
 *   1. NODE_ENV === 'test'
 *   2. the target database name ends in `_test`
 *
 * If either fails it throws loudly — the suite aborts before deleting anything.
 */

/** Extract the bare database name from a Postgres connection string. */
export function databaseNameOf(connectionString: string): string {
  // new URL handles postgres:// and postgresql:// the same way.
  const url = new URL(connectionString);
  return url.pathname.replace(/^\//, '').split('?')[0];
}

/**
 * Throw unless we are pointed at a dedicated test database. Call this before any
 * destructive operation in test setup/teardown.
 */
export function assertTestDatabase(connectionString: string | undefined): void {
  if (!connectionString) {
    throw new Error(
      '[db-guard] DATABASE_URL is not set — refusing to run destructive test setup. ' +
        'Did you forget to create backend/.env.test? Run `npm run db:bootstrap`.',
    );
  }

  let dbName: string;
  try {
    dbName = databaseNameOf(connectionString);
  } catch {
    throw new Error('[db-guard] Could not parse DATABASE_URL — refusing to run destructive test setup.');
  }

  if (process.env.NODE_ENV !== 'test') {
    throw new Error(
      `[db-guard] NODE_ENV must be "test" to run destructive test setup (got "${process.env.NODE_ENV ?? 'unset'}"). ` +
        `Refusing to touch database "${dbName}". Tests load backend/.env.test (NODE_ENV=test).`,
    );
  }

  if (!/_test$/.test(dbName)) {
    throw new Error(
      `[db-guard] Refusing to run destructive test setup against non-test database "${dbName}". ` +
        'The test DATABASE_URL must point at a database whose name ends in "_test" ' +
        '(e.g. reverse_marketplace_test). This guard prevents tests from wiping dev seed ' +
        'accounts — see issue #133 and docs/DATABASE_CONFIG.md.',
    );
  }
}
