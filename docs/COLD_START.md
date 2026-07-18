# Cold-Start Seed Runbook (#207)

How we make the marketplace look active at launch: **fake BUYER posts** seeded across
the DFW metroplex. We never seed fake sellers.

This pairs with the seeded-post behavior already in the app (#37): once a real seller
makes an offer on a seeded post it surfaces in the buyer **discovery feed**, and a real
buyer can clone it into their own real post. A seeded post is never a real counterparty —
no money, escrow, or acceptance ever touches one (enforced in `offers.service.ts`).

## What gets created

- A pool of ~50 synthetic buyer accounts, emails `coldstart+NNN@seed.sorcyn.invalid`
  (the reserved `.invalid` TLD — can never collide with real users, trivially
  identifiable for cleanup). These accounts never log in.
- ~2 posts per DFW zip (~359 zips → ~718 posts), `is_seed = true`, immediately public
  (no exclusivity hold), across **Services + Products** (~60/40). Jobs are intentionally
  excluded in v1.
- Each post is placed at its zip's centroid (`latitude`/`longitude`) so it falls inside
  sellers' radius filters, and expires after `SEED_POST_TTL_DAYS` (default 30).

## Geo data — IMPORTANT

`backend/scripts/data/dfw-zips.json` is built from the **US Census ZCTA5 Gazetteer
(public domain)**, filtered to DFW (TX `75xxx`/`76xxx` within a metroplex bounding box).

> ⚠️ ZCTAs approximate but are **NOT identical to USPS ZIP Codes**. This dataset is for
> **seed-post geo placement only**. Do not use it for shipping rates, address validation,
> or any USPS-fidelity flow. `city` is the nearest major DFW city by centroid distance —
> a display label, not an authoritative ZIP↔city mapping.

To refresh the dataset from a newer Gazetteer:

```sh
curl -sL -o /tmp/zcta.zip \
  https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2023_Gazetteer/2023_Gaz_zcta_national.zip
unzip -o /tmp/zcta.zip -d /tmp
cd backend && node scripts/data/build-dfw-zips.mjs /tmp/2023_Gaz_zcta_national.txt
```

## Running

Idempotent — each post carries a stable `requirements.coldStartKey`, so re-running only
creates the keys that don't exist yet. Safe to re-run; never duplicates, never deletes
posts that may have drawn real offers.

```sh
# Production (Doppler-injected secrets):
doppler run -- bash -c 'cd backend && npm run db:seed-cold-start'

# Local dev:
cd backend && npm run db:seed-cold-start

# Tunables (env):
SEED_POSTS_PER_ZIP=2 SEED_BUYER_POOL=50 SEED_POST_TTL_DAYS=30 npm run db:seed-cold-start
```

Prerequisite: categories must already be seeded (`npm run db:seed`).

## Identifying & removing seeded data

All seeded buyers share `@seed.sorcyn.invalid`; all seeded posts have `is_seed = true`.

```sql
SELECT count(*) FROM posts WHERE is_seed = true;
SELECT count(*) FROM users WHERE email LIKE '%@seed.sorcyn.invalid';
```

Full teardown (DESTRUCTIVE):

```sh
npm run db:seed-cold-start -- --reset
```

`--reset` deletes the synthetic buyers, which cascades to their seeded posts **and any
real-seller offers made on those posts** (those offers were never going to convert — the
buyer is fake; sellers convert by cloning to a real post). Real buyers' cloned posts are
preserved: their `sourceSeedPostId` / `referredSellerId` are `SET NULL` on delete.

## Wind-down

v1 wind-down is passive: seeded posts carry `expiresAt = now + SEED_POST_TTL_DAYS` and
fall out of active feeds when they expire, so the feed trends toward real content as
traction grows. No periodic sweep is required for the basic case. Density-based dynamic
wind-down (shrinking the seed footprint per-area as real posts arrive) is a later
enhancement.
