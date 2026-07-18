#!/usr/bin/env node
/**
 * devsync — realtime work-claim engine for the two-operator AI workflow.
 *
 * The shared store is the team's Supabase Postgres (reached over a dedicated
 * SYNC_DATABASE_URL, NOT the app's local DATABASE_URL). Each Claude Code agent
 * session, on both machines, automatically:
 *   - registers a claim on SessionStart      (`session-start`)
 *   - checks for collisions + refreshes its heartbeat before every edit (`pre-edit`)
 *   - releases the claim on SessionEnd        (`release`)
 *
 * Because the store is shared, each agent's pre-edit check sees the OTHER
 * operator's live claims within one query. A claim auto-expires after
 * STALE_MINUTES of no heartbeat, so a crashed agent never leaves a stale lock.
 *
 * DESIGN RULE: fail-open. Any error (no SYNC_DATABASE_URL, network down, bad
 * payload) must NEVER block an edit — it degrades to "allow + warn" so a hiccup
 * in the coordination layer can't halt all coding. The contract pipeline +
 * .planning/NOW.md remain the fallback when this layer is unavailable.
 *
 * Subcommands:
 *   init           create the work_claims table (run once, via bootstrap)
 *   session-start  register/refresh this session's claim; print active claims
 *   pre-edit       collision check + heartbeat for an Edit/Write/MultiEdit
 *   release        mark this session's claim released
 *   list | board   print all currently-active claims
 *   whoami         show detected person/lane/branch
 *
 * Hook payloads arrive as JSON on stdin; CLI use needs no stdin.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { laneForPath, laneForPerson, isOutOfLane, toRepoRelative } from './lanes.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = process.env.CLAUDE_PROJECT_DIR || resolve(__dirname, '../..');
const STALE_MINUTES = 15;
const CONNECT_TIMEOUT_MS = 2500;
const QUERY_TIMEOUT_MS = 2500;

const TABLE = 'devsync_work_claims';
const CREATE_SQL = `
create table if not exists ${TABLE} (
  session_id   text primary key,
  person       text not null,
  lane         text not null,
  branch       text,
  task         text,
  paths        text[] not null default '{}',
  cwd          text,
  started_at   timestamptz not null default now(),
  heartbeat_at timestamptz not null default now(),
  released_at  timestamptz
);
create index if not exists ${TABLE}_active_idx
  on ${TABLE} (heartbeat_at) where released_at is null;
`;
const ACTIVE_PRED = `released_at is null and heartbeat_at > now() - interval '${STALE_MINUTES} minutes'`;

// ---------------------------------------------------------------------------
// Helpers (all fail-soft)
// ---------------------------------------------------------------------------

function git(args) {
  try {
    return execFileSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

/** Minimal .env reader (no dependency) — first file wins per key. */
function loadEnvValue(key) {
  if (process.env[key]) return process.env[key];
  const candidates = [
    resolve(REPO_ROOT, 'scripts/devsync/.env'),
    resolve(REPO_ROOT, 'backend/.env'),
    resolve(REPO_ROOT, '.env'),
  ];
  for (const file of candidates) {
    if (!existsSync(file)) continue;
    try {
      const line = readFileSync(file, 'utf8')
        .split('\n')
        .find((l) => l.trim().startsWith(`${key}=`));
      if (line) {
        let v = line.slice(line.indexOf('=') + 1).trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
        if (v) return v;
      }
    } catch {
      /* ignore */
    }
  }
  return undefined;
}

function detectPerson() {
  // Override via env OR backend/.env (loadEnvValue checks process.env first).
  // Lets an operator whose git identity doesn't resolve set SYNC_PERSON=mohamed
  // in backend/.env and have the hooks (which don't source the shell env) honor it.
  const override = loadEnvValue('SYNC_PERSON');
  if (override) return override.trim().toLowerCase();
  const email = (git(['config', 'user.email']) || '').toLowerCase();
  const name = (git(['config', 'user.name']) || '').toLowerCase();
  const hay = `${email} ${name}`;
  if (hay.includes('faisal')) return 'faisal';
  if (hay.includes('mohamed') || hay.includes('leena')) return 'mohamed';
  return (name.split(/\s+/)[0] || 'unknown').trim();
}

function currentBranch() {
  return git(['rev-parse', '--abbrev-ref', 'HEAD']) || 'unknown';
}

async function readStdin() {
  if (process.stdin.isTTY) return '';
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  return Buffer.concat(chunks).toString('utf8');
}

function parsePayload(raw) {
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** Extract repo-relative edit targets from a PreToolUse payload. */
function targetPaths(payload) {
  const ti = payload.tool_input || {};
  const out = [];
  if (Array.isArray(ti.edits)) for (const e of ti.edits) if (e && e.file_path) out.push(e.file_path);
  if (ti.file_path) out.push(ti.file_path);
  const root = payload.cwd || REPO_ROOT;
  return [...new Set(out.map((p) => toRepoRelative(p, root)).filter(Boolean))];
}

// Lazy pg import so non-DB commands (whoami) never need the dep installed.
async function withClient(fn) {
  let Client;
  try {
    ({ default: { Client } } = await import('pg').then((m) => ({ default: m.default ?? m })));
  } catch {
    return { ok: false, reason: 'pg-missing' };
  }
  const rawConn = loadEnvValue('SYNC_DATABASE_URL');
  if (!rawConn) return { ok: false, reason: 'no-sync-url' };

  const isLocal = /@(localhost|127\.0\.0\.1)/.test(rawConn);
  // Strip sslmode/ssl query params so OUR ssl config is authoritative. Modern pg
  // treats sslmode=require as verify-full, which rejects Supabase's pooler cert
  // chain (SELF_SIGNED_CERT_IN_CHAIN). We TLS-encrypt but skip chain validation —
  // fine for this non-sensitive dev-coordination table. Also silences the pg
  // sslmode deprecation warning.
  const connectionString = rawConn
    .replace(/([?&])sslmode=[^&]*/gi, '$1')
    .replace(/[?&]+$/g, '')
    .replace(/\?&/g, '?');
  const client = new Client({
    connectionString,
    connectionTimeoutMillis: CONNECT_TIMEOUT_MS,
    query_timeout: QUERY_TIMEOUT_MS,
    statement_timeout: QUERY_TIMEOUT_MS,
    ssl: isLocal ? false : { rejectUnauthorized: false },
  });
  try {
    await client.connect();
    const value = await fn(client);
    return { ok: true, value };
  } catch (err) {
    return { ok: false, reason: 'db-error', error: err };
  } finally {
    try { await client.end(); } catch { /* ignore */ }
  }
}

// PreToolUse: allow silently unless we have something to say.
function emitAllow(context) {
  if (context) {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'allow', additionalContext: context },
    }) + '\n');
  }
  process.exit(0);
}

function emitDeny(reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason },
  }) + '\n');
  process.exit(0);
}

function emitSessionContext(context) {
  if (context) {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: context },
    }) + '\n');
  }
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Subcommands
// ---------------------------------------------------------------------------

async function cmdInit() {
  const r = await withClient(async (c) => { await c.query(CREATE_SQL); return true; });
  if (r.ok) {
    process.stdout.write(`devsync: table ${TABLE} ready\n`);
    process.exit(0);
  }
  const msg = r.error?.message || '';
  const code = r.error?.code || '';
  let hint = 'Set SYNC_DATABASE_URL to the SHARED Supabase pooler string and retry.';
  if (/getaddrinfo|ENOTFOUND|EAI_AGAIN/.test(msg) || code === 'ENOTFOUND') {
    hint = 'Host not resolvable — your SYNC_DATABASE_URL still has placeholder values ' +
           '([project]/[region]) or a typo in the host. Replace them with the real Supabase pooler host.';
  } else if (/password authentication failed|SASL|28P01/.test(msg) || code === '28P01') {
    hint = 'Auth failed — the password (or postgres.<project-ref> username) in SYNC_DATABASE_URL is wrong.';
  } else if (/timeout|ETIMEDOUT/.test(msg)) {
    hint = 'Connection timed out — check the host/port (transaction pooler is :6543) and network.';
  } else if (/does not exist|3D000/.test(msg)) {
    hint = 'Database name in the URL is wrong (Supabase uses /postgres).';
  }
  process.stderr.write(`devsync init failed (${r.reason}${code ? ' ' + code : ''}): ${msg}\n${hint}\n`);
  process.exit(1);
}

function describeClaims(rows, me) {
  if (!rows.length) return '';
  const lines = rows.map((r) => {
    const who = r.session_id === me ? `${r.person} (you)` : r.person;
    const files = (r.paths || []).slice(-6).join(', ') || '(no files yet)';
    return `  • ${who} [${r.lane}] on ${r.branch || '?'} — "${r.task || 'unspecified'}"\n      files: ${files}`;
  });
  return lines.join('\n');
}

async function cmdSessionStart(payload) {
  const person = detectPerson();
  const lane = laneForPerson(person);
  const branch = currentBranch();
  const sessionId = payload.session_id || `${person}:${branch}`;
  const task = payload.session_title || branch;

  const r = await withClient(async (c) => {
    await c.query(CREATE_SQL);
    await c.query(
      `insert into ${TABLE} (session_id, person, lane, branch, task, cwd, started_at, heartbeat_at, released_at)
       values ($1,$2,$3,$4,$5,$6, now(), now(), null)
       on conflict (session_id) do update set
         person=excluded.person, lane=excluded.lane, branch=excluded.branch,
         task=excluded.task, cwd=excluded.cwd, heartbeat_at=now(), released_at=null`,
      [sessionId, person, lane, branch, task, payload.cwd || REPO_ROOT],
    );
    const others = await c.query(
      `select session_id, person, lane, branch, task, paths from ${TABLE}
       where session_id <> $1 and ${ACTIVE_PRED} order by heartbeat_at desc`,
      [sessionId],
    );
    return others.rows;
  });

  if (!r.ok) {
    // Fail-open: never block a session from starting.
    return emitSessionContext(
      `[devsync] realtime sync layer unavailable (${r.reason}). Falling back to .planning/NOW.md. ` +
      `Set SYNC_DATABASE_URL to enable cross-agent claim coordination.`,
    );
  }
  const active = describeClaims(r.value, sessionId);
  const header =
    `[devsync] You are "${person}" (lane: ${lane}) on branch ${branch}. Your work claim is registered.`;
  const body = active
    ? `\nThe OTHER operator's AI is ACTIVE right now:\n${active}\n` +
      `Before editing files in their lane or files they list above, expect a collision warning/block.`
    : `\nNo other operator is currently active. You have a clear field.`;
  return emitSessionContext(header + body);
}

async function cmdPreEdit(payload) {
  const paths = targetPaths(payload);
  if (!paths.length) process.exit(0); // not a file edit we track

  const person = detectPerson();
  const branch = currentBranch();
  const sessionId = payload.session_id || `${person}:${branch}`;

  const r = await withClient(async (c) => {
    // 1) Collision: any OTHER active claim holding one of these exact paths?
    const collisions = await c.query(
      `select person, branch, task, paths from ${TABLE}
       where session_id <> $1 and ${ACTIVE_PRED} and paths && $2::text[]`,
      [sessionId, paths],
    );
    // 2) Record only the NON-conflicting paths + heartbeat. We never claim a
    //    path we're being denied on — otherwise both agents would record the
    //    same file and deadlock each other. Heartbeat still fires so our
    //    liveness/claim stays fresh regardless.
    const conflicted = new Set(collisions.rows.flatMap((row) => row.paths || []));
    const recordable = paths.filter((p) => !conflicted.has(p));
    await c.query(
      `insert into ${TABLE} (session_id, person, lane, branch, task, paths, cwd, started_at, heartbeat_at, released_at)
       values ($1,$2,$3,$4,$5,$6,$7, now(), now(), null)
       on conflict (session_id) do update set
         paths = (
           select array(select distinct unnest(${TABLE}.paths || excluded.paths))
         ),
         branch = excluded.branch,
         heartbeat_at = now(), released_at = null`,
      [sessionId, person, laneForPerson(person), branch, branch, recordable, payload.cwd || REPO_ROOT],
    );
    return collisions.rows;
  });

  if (!r.ok) emitAllow(undefined); // fail-open, silent

  // Real collision → block.
  const conflicting = r.value.filter((row) => {
    const theirs = new Set(row.paths || []);
    return paths.some((p) => theirs.has(p));
  });
  if (conflicting.length) {
    const c = conflicting[0];
    const shared = paths.filter((p) => (c.paths || []).includes(p));
    return emitDeny(
      `[devsync] COLLISION: ${c.person}'s AI is actively editing ${shared.join(', ')} right now ` +
      `(branch ${c.branch || '?'}, task "${c.task || '?'}"). Coordinate before writing — ` +
      `pick a different file, or confirm with ${c.person} that they've paused. ` +
      `Re-running the edit will retry the claim check.`,
    );
  }

  // Lane breach → warn but allow.
  const outOfLane = paths.filter((p) => isOutOfLane(person, p));
  if (outOfLane.length) {
    const pathLane = laneForPath(outOfLane[0]);
    return emitAllow(
      `[devsync] LANE NOTICE: you (${person}, ${laneForPerson(person)} lane) are editing ${outOfLane.join(', ')}, ` +
      `which is in the ${pathLane} lane (the other operator's). This is allowed, but it's a high-coordination seam — ` +
      `flag it in your PR and to your partner per .planning/WORK_SPLIT.md.`,
    );
  }

  emitAllow(undefined);
}

async function cmdRelease(payload) {
  const person = detectPerson();
  const branch = currentBranch();
  const sessionId = payload.session_id || `${person}:${branch}`;
  await withClient(async (c) => {
    await c.query(`update ${TABLE} set released_at = now() where session_id = $1`, [sessionId]);
  });
  process.exit(0); // never block session end
}

async function cmdList() {
  const me = `${detectPerson()}:${currentBranch()}`;
  const r = await withClient(async (c) => {
    const rows = await c.query(
      `select session_id, person, lane, branch, task, paths,
              to_char(heartbeat_at, 'HH24:MI:SS') as last_seen
       from ${TABLE} where ${ACTIVE_PRED} order by person, heartbeat_at desc`,
    );
    return rows.rows;
  });
  if (!r.ok) {
    process.stderr.write(`devsync: store unavailable (${r.reason}).\n`);
    process.exit(1);
  }
  if (!r.value.length) {
    process.stdout.write('devsync: no active claims. Field is clear.\n');
    process.exit(0);
  }
  process.stdout.write('Active work claims (live):\n');
  for (const row of r.value) {
    const who = row.session_id === me ? `${row.person} (you)` : row.person;
    process.stdout.write(
      `  ${who.padEnd(14)} [${row.lane}] ${row.branch || '?'}  last seen ${row.last_seen}\n` +
      `    task: ${row.task || '-'}\n` +
      `    files: ${(row.paths || []).join(', ') || '(none yet)'}\n`,
    );
  }
  process.exit(0);
}

function cmdWhoami() {
  const person = detectPerson();
  process.stdout.write(
    `person: ${person}\nlane:   ${laneForPerson(person)}\nbranch: ${currentBranch()}\n` +
    `sync_url: ${loadEnvValue('SYNC_DATABASE_URL') ? 'set' : 'MISSING (set SYNC_DATABASE_URL)'}\n`,
  );
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Dispatch
// ---------------------------------------------------------------------------

async function main() {
  const cmd = process.argv[2];
  const needsStdin = cmd === 'session-start' || cmd === 'pre-edit' || cmd === 'release';
  const payload = needsStdin ? parsePayload(await readStdin()) : {};

  switch (cmd) {
    case 'init': return cmdInit();
    case 'session-start': return cmdSessionStart(payload);
    case 'pre-edit': return cmdPreEdit(payload);
    case 'release': return cmdRelease(payload);
    case 'list':
    case 'board': return cmdList();
    case 'whoami': return cmdWhoami();
    default:
      process.stderr.write('usage: claim.mjs <init|session-start|pre-edit|release|list|whoami>\n');
      process.exit(cmd ? 1 : 0);
  }
}

main().catch(() => {
  // Absolute backstop: never let an unexpected error block a hook.
  process.exit(0);
});
