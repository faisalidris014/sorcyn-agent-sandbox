/**
 * Shared OpenAPI spec builder for `contract:generate` and `contract:check`.
 *
 * Builds the spec from the live Fastify route + Zod schema registration via
 * `@fastify/swagger` (same source as the /docs Swagger UI), normalises it to be
 * environment-independent, and returns deterministic JSON. See dump-openapi.ts
 * for the why behind the committed contract artifact.
 */
import dotenv from 'dotenv';
dotenv.config();

// Swagger only registers when NODE_ENV !== 'production' (or ENABLE_SWAGGER).
// Force a non-prod env so the spec is always available; NODE_ENV=test also
// skips the rate-limit plugin so no external services are needed.
process.env.NODE_ENV = process.env.NODE_ENV === 'production' ? 'test' : (process.env.NODE_ENV ?? 'test');

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildApp } from '../src/app.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
// backend/scripts -> repo root /contracts/openapi.json
export const OUT_PATH = resolve(__dirname, '../../contracts/openapi.json');

/** Recursively sort object keys so serialisation is deterministic. */
function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortKeys((value as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }
  return value;
}

/**
 * Build the normalised OpenAPI spec and return it as deterministic,
 * newline-terminated JSON. Also returns the raw path count for logging.
 */
export async function buildSpecJson(): Promise<{ json: string; pathCount: number }> {
  const app = await buildApp();
  await app.ready();

  const spec = app.swagger() as Record<string, unknown>;

  // Environment-independence: the registered spec pins `servers` to env.APP_URL,
  // which differs per machine/CI. Replace it with a stable placeholder so the
  // committed artifact only changes when the actual API surface changes.
  spec.servers = [{ url: '/api/v1', description: 'Reverse Marketplace API (base path)' }];

  const pathCount = Object.keys((spec.paths as Record<string, unknown>) ?? {}).length;
  const json = `${JSON.stringify(sortKeys(spec), null, 2)}\n`;

  await app.close();
  return { json, pathCount };
}
