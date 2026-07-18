# Mobile Contract Adoption (handoff for the mobile lane)

> **Status: proposed, not yet implemented.** This is a Mohamed-owned (`mobile/**`)
> follow-up. It is deliberately NOT done in the backend PR that introduced
> `contracts/openapi.json`, because rewriting the hand-written Dart models is an
> invasive change inside the mobile lane and must be driven/reviewed by its owner
> per `.planning/WORK_SPLIT.md`.

## Goal

Have the Flutter app consume **generated types** from `contracts/openapi.json`
instead of hand-written models, so a backend API change surfaces as a compile
error / regenerated model on the mobile side rather than a runtime surprise.

## Current state

`mobile/lib/features/*/data/models/` are hand-written. They work, but they
duplicate the contract by hand — the exact drift this whole system is meant to
remove.

## Recommended approach: incremental, non-breaking

Do **not** rip out the existing models in one pass. Instead:

1. **Add a generator** (pick one):
   - `swagger_parser` (Dart-native, no Java) — generates Dart models + Dio clients
     from an OpenAPI spec. Lightest fit for this stack (already on Dio).
   - or `openapi-generator` (`dart-dio` generator) — heavier (needs Java), more
     mature.
2. **Generate into a quarantined namespace**, e.g. `mobile/lib/core/network/generated/`,
   pointed at `../../../contracts/openapi.json`. This does not touch existing
   feature models.
3. **Wire a `mobile` script**: `dart run swagger_parser` (or the build_runner
   equivalent), and document it in the mobile README.
4. **Migrate one feature at a time** (start with a low-risk one, e.g. categories),
   replacing its hand model + repository deserialization with the generated type,
   and deleting the hand model only once tests pass.
5. **Add a CI step** in the existing `mobile-analyze-and-test` job to regenerate
   and `flutter analyze`, so a stale generated client fails the build.

## Why incremental

- Keeps every PR single-lane and revertible.
- No big-bang rewrite of 10 feature model directories.
- Each migrated feature immediately benefits; un-migrated ones are unaffected.

## Coordination

When this lands, the backend `contract-drift` gate + this generated client close
the loop: a backend route change fails `contract-drift` until the contract is
regenerated, and a regenerated contract changes the mobile generated types on the
next `flutter analyze`. The seam becomes compile-checked on both sides.

See `contracts/README.md` for how the contract is produced.
