#!/usr/bin/env node
// Issue #187: end-to-end verification that a real Cloudflare R2 bucket is wired up.
//
// Proves the full upload contract against REAL R2 (never the MinIO dev fallback):
//   1. presign a PUT  (same client config as src/common/utils/storage.ts)
//   2. PUT the object via the presigned URL with an explicit Content-Length
//      — the exact path the #192 fix exercises: a presigned R2 PUT is rejected
//        (or lands 0 bytes) without Content-Length, so we send a sized body.
//   3. public GET via R2_PUBLIC_URL  → asserts public-access / custom-domain is live
//   4. DELETE to clean up the probe object
//
// Run against a real config (never the MinIO dev one). Once the shared dev bucket
// has creds, `dev` is a real R2 config too:
//   doppler run -p sorcyn-backend -c dev -- node backend/scripts/r2-verify-roundtrip.mjs
//   doppler run -p sorcyn-backend -c stg -- node backend/scripts/r2-verify-roundtrip.mjs
//   doppler run -p sorcyn-backend -c prd -- node backend/scripts/r2-verify-roundtrip.mjs
//
// Exit 0 = round-trip passed. Non-zero = a specific step failed (message says which).

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';

const {
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME = 'reverse-marketplace',
  R2_PUBLIC_URL,
} = process.env;

function fail(msg) {
  console.error(`\n❌ FAIL: ${msg}`);
  process.exit(1);
}

// --- Guards: refuse to "pass" against MinIO or a half-configured env ----------
if (!R2_ACCOUNT_ID) {
  fail(
    'R2_ACCOUNT_ID is not set. This script verifies REAL Cloudflare R2 — ' +
      'without it, storage.ts falls back to local MinIO and this test is meaningless. ' +
      'Run under `doppler run -c dev/stg/prd`.',
  );
}
if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  fail('R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY must both be set for real R2.');
}
if (!R2_PUBLIC_URL) {
  fail(
    'R2_PUBLIC_URL is not set. storage.ts has no fallback (see #193) — set it to the ' +
      'bucket public URL (pub-<hash>.r2.dev) or custom domain base, e.g. cdn.sorcyn.com.',
  );
}

// Client config is intentionally identical to src/common/utils/storage.ts (R2 path),
// INCLUDING the WHEN_REQUIRED checksum settings — SDK v3.729+ otherwise adds a CRC32
// header to the presigned URL that a raw PUT (like Flutter's Dio) won't compute, and
// R2 then rejects the upload with a 400. Keeping this identical makes the probe a
// faithful reproduction of the real upload path.
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
});

const key = `_healthcheck/r2-verify/${randomUUID()}.txt`;
const body = `sorcyn r2 round-trip probe ${new Date().toISOString()}`;
const bytes = new TextEncoder().encode(body);
const contentType = 'text/plain';

console.log(`R2 round-trip verification`);
console.log(`  account   : ${R2_ACCOUNT_ID.slice(0, 6)}… (endpoint https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com)`);
console.log(`  bucket    : ${R2_BUCKET_NAME}`);
console.log(`  publicUrl : ${R2_PUBLIC_URL}`);
console.log(`  key       : ${key}\n`);

// --- Step 1: presign PUT ------------------------------------------------------
let uploadUrl;
try {
  uploadUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key, ContentType: contentType }),
    { expiresIn: 300 },
  );
  console.log('✅ 1/4 presigned PUT URL generated');
} catch (e) {
  fail(`could not presign PUT (credentials / bucket name?): ${e.message}`);
}

// --- Step 2: PUT via presigned URL with explicit Content-Length (#192 path) ----
try {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType, 'Content-Length': String(bytes.byteLength) },
    body: bytes,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    fail(`presigned PUT returned ${res.status} ${res.statusText}. ${detail.slice(0, 300)}`);
  }
  console.log(`✅ 2/4 presigned PUT accepted (${bytes.byteLength} bytes, Content-Length sent)`);
} catch (e) {
  fail(`presigned PUT request threw: ${e.message}`);
}

// --- Step 3: public GET via R2_PUBLIC_URL -------------------------------------
const publicUrl = `${R2_PUBLIC_URL.replace(/\/$/, '')}/${key}`;
try {
  const res = await fetch(publicUrl);
  if (res.status !== 200) {
    fail(
      `public GET ${publicUrl} returned ${res.status} (expected 200). ` +
        'Public access (r2.dev managed URL) or custom domain not enabled on the bucket?',
    );
  }
  const got = await res.text();
  if (got !== body) {
    fail(`public GET body mismatch. expected "${body}" got "${got.slice(0, 80)}"`);
  }
  console.log('✅ 3/4 public GET returned 200 with matching body');
} catch (e) {
  fail(`public GET request threw: ${e.message}`);
}

// --- Step 4: cleanup ----------------------------------------------------------
try {
  await s3.send(new DeleteObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }));
  console.log('✅ 4/4 probe object deleted');
} catch (e) {
  console.warn(`⚠️  cleanup DELETE failed (object left at ${key}): ${e.message}`);
}

console.log('\n🎉 PASS — presign → PUT → public GET round-trip works against real R2.');
