/**
 * Onboarding parity audit — issue #82 / reconciliation #155
 *
 * Guards the class of bug that filed #82: a contributor copies `.env.example`,
 * and the Postgres port in the URL does not match the host port that
 * docker-compose.yml actually exposes the container on → cryptic "connection
 * refused" wall.
 *
 * The two example envs now serve different audiences (post #133 DB-config work):
 *
 *   • backend/.env.example  — native-Postgres first. Its ACTIVE DATABASE_URL is a
 *     Homebrew/native URL on 5432 (where native Postgres listens, NOT docker), so
 *     it is intentionally NOT checked against docker-compose. The COMMENTED Docker
 *     option line, however, is what a docker user uncomments, so THAT must match
 *     the docker-compose host port (5433).
 *
 *   • .env.example (root)   — Docker-credential style (postgres:postgres). Its
 *     ACTIVE DATABASE_URL / DIRECT_DATABASE_URL are what a docker user copies, so
 *     they must match the docker-compose host port directly.
 *
 * Redis has a single form in both files and is always checked against the
 * docker-compose redis host port.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '../../..');

/** Extract the host-side port from a docker-compose `"HOST:CONTAINER"` mapping. */
function hostPortFromComposeService(
  composeYaml: string,
  serviceName: string,
): number {
  const serviceBlockRe = new RegExp(
    `^\\s{2}${serviceName}:\\s*$([\\s\\S]*?)(?=^\\s{2}\\S|^\\S|\\Z)`,
    'm',
  );
  const block = composeYaml.match(serviceBlockRe);
  if (!block) throw new Error(`service ${serviceName} not found in docker-compose.yml`);
  const ports = block[1].match(/^\s+-\s+"(\d+):(\d+)"/m);
  if (!ports) throw new Error(`no port mapping found for ${serviceName}`);
  return Number(ports[1]);
}

/** Pull the first `:<port>` that is immediately followed by `/`, `?`, or end-of-string. */
function portFromUrl(url: string, label: string): number {
  const portMatch = url.match(/:(\d+)(?:[/?]|$)/);
  if (!portMatch) throw new Error(`could not parse port from ${label}=${url}`);
  return Number(portMatch[1]);
}

/** Port from the first ACTIVE (non-commented) `KEY=protocol://...:<port>...` line. */
function activeUrlPort(envContent: string, key: string): number {
  const line = envContent.match(new RegExp(`^${key}=([^\\n]+)$`, 'm'));
  if (!line) throw new Error(`active ${key} not found in env file`);
  return portFromUrl(line[1], key);
}

/**
 * Port from a COMMENTED Docker URL line, e.g.
 * `# DATABASE_URL=postgresql://postgres:postgres@localhost:5433/reverse_marketplace`.
 * Matched by the `postgres:postgres@` docker credential signature so it never
 * picks up the Supabase or native lines.
 */
function commentedDockerUrlPort(envContent: string, key: string): number {
  const line = envContent.match(
    new RegExp(`^#\\s*${key}=(postgresql://postgres:postgres@[^\\n]+)$`, 'm'),
  );
  if (!line) throw new Error(`commented Docker ${key} not found in env file`);
  return portFromUrl(line[1], key);
}

describe('Onboarding env / docker-compose parity (issue #82)', () => {
  const compose = readFileSync(resolve(repoRoot, 'docker-compose.yml'), 'utf-8');
  const rootEnv = readFileSync(resolve(repoRoot, '.env.example'), 'utf-8');
  const backendEnv = readFileSync(
    resolve(repoRoot, 'backend/.env.example'),
    'utf-8',
  );

  const pgHostPort = hostPortFromComposeService(compose, 'postgres');
  const redisHostPort = hostPortFromComposeService(compose, 'redis');

  it('docker-compose advertises non-zero postgres + redis host ports', () => {
    expect(pgHostPort).toBeGreaterThan(0);
    expect(redisHostPort).toBeGreaterThan(0);
  });

  // backend/.env.example — native first; only the commented Docker line is a docker URL.
  it('backend/.env.example commented Docker DATABASE_URL matches docker-compose postgres host port', () => {
    expect(commentedDockerUrlPort(backendEnv, 'DATABASE_URL')).toBe(pgHostPort);
  });

  it('backend/.env.example REDIS_URL port matches docker-compose redis host port', () => {
    expect(activeUrlPort(backendEnv, 'REDIS_URL')).toBe(redisHostPort);
  });

  // root .env.example — docker-credential style; the active lines are docker URLs.
  it('root .env.example DATABASE_URL port matches docker-compose postgres host port', () => {
    expect(activeUrlPort(rootEnv, 'DATABASE_URL')).toBe(pgHostPort);
  });

  it('root .env.example DIRECT_DATABASE_URL port matches docker-compose postgres host port', () => {
    expect(activeUrlPort(rootEnv, 'DIRECT_DATABASE_URL')).toBe(pgHostPort);
  });

  it('root .env.example REDIS_URL port matches docker-compose redis host port', () => {
    expect(activeUrlPort(rootEnv, 'REDIS_URL')).toBe(redisHostPort);
  });
});
