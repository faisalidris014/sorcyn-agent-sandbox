# PCI-DSS SAQ-A Attestation

**Filed:** 2026-XX-XX
**Stripe support ticket:** [link or thread ID — populated by Task 5 checkpoint]
**Stripe response:** [paste authoritative answer — see docs/stripe-saq-confirmation.md]

## Integration Surface
- Stripe Connect Standard (DEC-stripe-connect-standard)
- Separate Charges + Transfers (DEC-separate-charges-and-transfers)
- flutter_stripe PaymentSheet on mobile (DEC-flutter-stripe)
- Stripe Identity hosted verification (Phase 3 03-06)

## SAQ-A Self-Assessment
[answer each of the 31 SAQ-A questions — populated after Stripe SAQ-A applicability confirmation]

## Attestation Status

<!-- AUDIT-MARKER:PCI -->
| Filed Date | Stripe Confirmed | Pass Path |
|------------|------------------|-----------|
| 2026-XX-XX | TBD              | TBD       |
<!-- /AUDIT-MARKER:PCI -->

## Pass Paths (B-3)
1. **Primary (SAQ-A applies):** Filed Date populated with real ISO date; Pass Path = `SAQ-A-FILED`. Requires `docs/stripe-saq-confirmation.md` to contain `Stripe Confirmed: SAQ-A`.
2. **Deferral (SAQ-A-EP applies):** Pass Path = `SAQ-A-EP-DEFERRED`. Requires `DECISION-DEFER-SAQ-A-EP` entry in `.planning/intel/decisions.md` referencing `docs/stripe-saq-confirmation.md`, AND a Phase 4.1 row in `.planning/ROADMAP.md` for web-page-controls work.

The 04-08 Task 4 SC2c final block accepts EITHER path as PASS; fails closed if neither exists.

## Attestation
Signed: Faisal Idris, NiftyByte LLC, [date — filed only after Task 5 checkpoint completes]
