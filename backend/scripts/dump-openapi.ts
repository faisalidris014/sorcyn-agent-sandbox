/**
 * contract:generate — emit the backend's OpenAPI spec to a committed artifact
 * (`contracts/openapi.json` at the repo root).
 *
 * Why this exists: the backend (Faisal's lane) and the Flutter app (Mohamed's
 * lane) meet at exactly one seam — the HTTP API. When an AI agent changes a
 * route or a Zod schema, that change is invisible to the other person (and
 * their agent) until a PR lands. This script turns the API contract into a file
 * in git, so any change to the surface shows up as a reviewable diff and
 * `contract:check` can fail CI when the committed copy is stale.
 *
 * Usage: npm run contract:generate
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { buildSpecJson, OUT_PATH } from './openapi-spec.js';

async function main(): Promise<void> {
  const { json, pathCount } = await buildSpecJson();
  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, json, 'utf8');
  process.stdout.write(`contract:generate — wrote ${OUT_PATH} (${pathCount} paths)\n`);
  // Force exit past the ioredis singleton's open reconnect handle (see
  // check-openapi.ts) so the script terminates instead of hanging.
  process.exit(0);
}

main().catch((err) => {
  process.stderr.write(`contract:generate failed: ${(err as Error).stack ?? err}\n`);
  process.exit(1);
});
