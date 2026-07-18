/**
 * Schema-to-client drift detection (issue #159).
 *
 * The generated Prisma client lives in `node_modules/.prisma/client` and is
 * gitignored, so it can silently fall out of sync with `schema.prisma` when a
 * dev pulls a migration without re-running `prisma generate`. A missing model
 * accessor then surfaces at runtime as a cryptic
 * `Cannot read properties of undefined (reading 'findMany')` — e.g. the
 * `stripe-retry` worker crash-looping on `prisma.paymentIntentQueue` every sweep.
 *
 * These pure helpers turn that into an explicit, actionable check. They do no
 * I/O so they are trivially unit-testable; the caller supplies the schema source
 * and the client.
 */

/** Minimal shape we probe on each model delegate — every model exposes findMany. */
interface ModelDelegate {
  findMany?: unknown;
}

/**
 * Extract the Prisma client accessor name for every `model` declared in a
 * `schema.prisma` source.
 *
 * Prisma maps a model to a client property by lowercasing the first character of
 * the model name (`PaymentIntentQueue` -> `paymentIntentQueue`), independent of
 * any `@@map` table name.
 */
export function parseModelAccessors(schemaSource: string): string[] {
  const accessors: string[] = [];
  const re = /^\s*model\s+([A-Za-z_]\w*)\s*\{/gm;
  let match: RegExpExecArray | null;
  while ((match = re.exec(schemaSource)) !== null) {
    const name = match[1];
    accessors.push(name.charAt(0).toLowerCase() + name.slice(1));
  }
  return accessors;
}

/**
 * Given a Prisma client (or any object) and the accessors a freshly-generated
 * client should expose, return the ones whose `findMany` delegate is missing —
 * i.e. the client is stale relative to `schema.prisma` and needs
 * `npm run db:generate`.
 */
export function findMissingModelAccessors(
  client: Record<string, unknown>,
  accessors: string[],
): string[] {
  return accessors.filter((accessor) => {
    const delegate = client[accessor] as ModelDelegate | undefined;
    return !delegate || typeof delegate.findMany !== 'function';
  });
}
