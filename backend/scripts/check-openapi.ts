/**
 * contract:check — fail if the committed `contracts/openapi.json` is stale.
 *
 * Regenerates the spec from the live routes and compares byte-for-byte against
 * the committed artifact. Exits 1 with a copy-pasteable fix command when they
 * differ, so a PR that changes the API surface without regenerating the
 * contract is blocked in CI. See dump-openapi.ts for the rationale.
 *
 * Usage: npm run contract:check
 */
import { readFileSync } from 'node:fs';
import { buildSpecJson, OUT_PATH } from './openapi-spec.js';

async function main(): Promise<void> {
  const { json: fresh } = await buildSpecJson();

  let committed: string;
  try {
    committed = readFileSync(OUT_PATH, 'utf8');
  } catch {
    process.stderr.write(
      `contract:check — ${OUT_PATH} is missing.\n` +
        `Run \`npm run contract:generate\` and commit the result.\n`,
    );
    process.exit(1);
    return;
  }

  if (fresh !== committed) {
    process.stderr.write(
      'contract:check — committed contracts/openapi.json is STALE.\n' +
        'The API surface changed but the contract artifact was not regenerated.\n' +
        'Fix: run `npm run contract:generate` and commit contracts/openapi.json in this PR.\n',
    );
    process.exit(1);
    return;
  }

  process.stdout.write('contract:check — contracts/openapi.json is up to date.\n');
  // Force exit: buildApp pulls in the ioredis singleton, which keeps retrying
  // (and holds the event loop open) when Redis isn't reachable — e.g. in the
  // services-less contract-drift CI job. The check is done, so terminate cleanly.
  process.exit(0);
}

main().catch((err) => {
  process.stderr.write(`contract:check failed: ${(err as Error).stack ?? err}\n`);
  process.exit(1);
});
