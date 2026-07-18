# Runbook — Cloudflare R2 provisioning (#187)

**Status:** R2 client is CODE-READY in `backend/src/common/utils/storage.ts`, but **no
Cloudflare account or bucket is provisioned yet** (`docs/RUNBOOK_OPS.md` vendor table).
Until the values below exist, dev runs on local MinIO and prod uploads would fail.

This runbook has two independent tracks:

- **Track A — Shared dev bucket** (fast, unblocks #312 for both operators). Do this first.
- **Track B — Production + DR** (the P0 launch-blocker acceptance). Do before `PROD_DEPLOY_READY=true`.

> **You need Cloudflare console access to create the bucket + token.** Whoever owns the
> Cloudflare account runs the *Cloudflare* steps and hands over the 5 values; the operator
> with Doppler access runs the *Doppler* steps. See "Credentials handoff" at the bottom for
> a ready-to-send request.

---

## Why a shared dev bucket (Track A)

Dev uploads fall back to local MinIO (`http://localhost:9000/...`) because `R2_ACCOUNT_ID`
is unset (`usingLocalMinio = !env.R2_ACCOUNT_ID` in `storage.ts`). Those URLs are **per
machine**. Since both operators share one dev database (#214), a photo one operator uploads
is stored as a `localhost` URL that is a **dead link on the other's machine**. Pointing dev
at one real R2 bucket gives shareable URLs and unblocks #312 photo work end-to-end.

Setting the R2 vars in Doppler `dev` intentionally flips dev **off MinIO onto shared R2** for
anyone who runs via `doppler run` — that is the whole point. Local MinIO stays available for
anyone who runs without those vars.

---

## Track A — Shared dev bucket

### A1. Cloudflare console (whoever holds the account)

1. Create a Cloudflare account (free) if one doesn't exist. **Enable R2** (needs a card on
   file; dev usage sits inside the free tier: 10 GB + 10M reads/mo).
2. **R2 → Create bucket** → name `sorcyn-dev`, location automatic.
3. Bucket → **Settings → Public access → R2.dev subdomain → Allow**. Copy the managed URL
   (`https://pub-<hash>.r2.dev`). This is `R2_PUBLIC_URL`.
4. **R2 → Manage API Tokens → Create API Token**: permission **Object Read & Write**, scoped
   to **just the `sorcyn-dev` bucket**. Copy **Access Key ID** and **Secret Access Key**.
5. From the R2 overview, copy the **Account ID** (also visible in the S3 endpoint
   `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`).

You now have the 5 values: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`,
`R2_BUCKET_NAME` (=`sorcyn-dev`), `R2_PUBLIC_URL`.

### A2. Doppler `dev` (operator with Doppler access)

```sh
# from repo root — targets the dev config explicitly
doppler secrets set -p sorcyn-backend -c dev \
  R2_ACCOUNT_ID='<account id>' \
  R2_ACCESS_KEY_ID='<access key id>' \
  R2_SECRET_ACCESS_KEY='<secret access key>' \
  R2_BUCKET_NAME='sorcyn-dev' \
  R2_PUBLIC_URL='https://pub-<hash>.r2.dev'
```

### A3. Verify the round-trip

```sh
doppler run -p sorcyn-backend -c dev -- node backend/scripts/r2-verify-roundtrip.mjs
```

Expect `🎉 PASS`. The script refuses to run against MinIO, so a pass means real R2 is wired:
presign → PUT (with Content-Length, the #192 path) → public GET 200 → cleanup.

### A4. Tell the other operator

Both operators run the backend via `doppler run` (the `sorcyn dev` launcher already does).
Once A2 lands, a `doppler run` restart picks up the new vars and dev uploads go to shared R2.
No code change, no per-machine MinIO needed for uploads.

---

## Track B — Production + DR (P0 launch blocker)

Same Cloudflare steps as Track A but against the prod bucket, plus the backup/DR buckets used
by `.github/workflows/nightly-backup.yml`, and the values go to Doppler `prd` **and** GitHub
Actions secrets.

### B1. Cloudflare console

1. **R2 → Create bucket** → `reverse-marketplace` (matches the `R2_BUCKET_NAME` default).
2. Public access: enable a **custom domain** `cdn.sorcyn.com` (preferred for prod) or the
   `pub-<hash>.r2.dev` managed URL. Whichever you choose is `R2_PUBLIC_URL`.
   - Custom domain requires the `sorcyn.com` zone on Cloudflare. The domain is currently on
     **name.com**; point its nameservers at Cloudflare (also unblocks the status page /
     `docs/RUNBOOK_OPS.md` Cloudflare follow-up). Until then, use the `r2.dev` URL.
3. Create the backup/DR buckets: `sorcyn-db-dumps`, `sorcyn-db-dumps-dr`,
   `sorcyn-images-dr` (image source bucket is the app bucket above).
4. Mint a prod API token (Object Read & Write) scoped to those buckets. Copy Access Key ID +
   Secret Access Key + Account ID.

### B2. Doppler `prd`

```sh
doppler secrets set -p sorcyn-backend -c prd \
  R2_ACCOUNT_ID='<account id>' \
  R2_ACCESS_KEY_ID='<access key id>' \
  R2_SECRET_ACCESS_KEY='<secret access key>' \
  R2_BUCKET_NAME='reverse-marketplace' \
  R2_PUBLIC_URL='https://cdn.sorcyn.com'   # or the pub-<hash>.r2.dev URL
```

(Repeat for `-c stg` with a `sorcyn-stg` bucket if you want a staging round-trip first.)

### B3. GitHub Actions secrets (deploy + nightly-backup.yml)

`.github/workflows/nightly-backup.yml` reads these from repo secrets:

```sh
gh secret set R2_ACCOUNT_ID       --body '<account id>'
gh secret set R2_ACCESS_KEY_ID    --body '<access key id>'
gh secret set R2_SECRET_ACCESS_KEY --body '<secret access key>'
gh secret set R2_ENDPOINT         --body 'https://<account id>.r2.cloudflarestorage.com'
gh secret set R2_DUMP_BUCKET      --body 'sorcyn-db-dumps'
gh secret set R2_DUMP_BUCKET_DR   --body 'sorcyn-db-dumps-dr'
gh secret set R2_IMAGES_BUCKET    --body 'reverse-marketplace'
gh secret set R2_IMAGES_BUCKET_DR --body 'sorcyn-images-dr'
```

### B4. Verify

```sh
doppler run -p sorcyn-backend -c prd -- node backend/scripts/r2-verify-roundtrip.mjs
```

---

## Close-out checklist (matches #187 acceptance)

- [ ] Prod bucket(s) created in Cloudflare R2
- [ ] App R2 vars set in Doppler (`prd`) + GitHub Actions secrets
- [ ] Backup/DR bucket vars set for `nightly-backup.yml`
- [ ] A prod (or staging) upload round-trips: presign → PUT → public GET 200 (script PASS)
- [ ] `docs/SECRETS_INVENTORY.md` flipped from "not yet provisioned" → provisioned

## Env-var contract (quick reference)

| Var | Used by | Notes |
|-----|---------|-------|
| `R2_ACCOUNT_ID` | `storage.ts` (endpoint), backups | Presence flips storage off MinIO onto real R2 |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | `storage.ts`, backups | Scoped R2 API token |
| `R2_BUCKET_NAME` | `storage.ts` | Default `reverse-marketplace`; set `sorcyn-dev` for dev |
| `R2_PUBLIC_URL` | `storage.ts` (`publicUrlFor`) | **Required** — no fallback (#193). `pub-<hash>.r2.dev` or `cdn.sorcyn.com` |
| `R2_ENDPOINT` | `nightly-backup.yml` only | `https://<account id>.r2.cloudflarestorage.com` |
| `R2_DUMP_BUCKET` / `_DR`, `R2_IMAGES_BUCKET` / `_DR` | `nightly-backup.yml` only | Backup + DR destinations |

---

## Credentials handoff (send to whoever holds the Cloudflare account)

> To unblock shared-dev uploads (#312) I need a Cloudflare R2 bucket. Please:
> 1. R2 → create bucket `sorcyn-dev`.
> 2. Enable its public **R2.dev** subdomain and send me that URL.
> 3. Create an **Object Read & Write** API token scoped to `sorcyn-dev`.
> 4. Send me: **Account ID**, **Access Key ID**, **Secret Access Key**, the **public URL**.
>
> I'll load them into Doppler `dev` and run the round-trip verifier. Send the secret over a
> secure channel (not plain chat) — it's a write-capable token.
