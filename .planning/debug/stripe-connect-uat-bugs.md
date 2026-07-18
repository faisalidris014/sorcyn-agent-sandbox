---
status: investigating
trigger: "Three Stripe Connect bugs: (A) return_url localhost redirect, (B) seller status not refreshing, (C) Earnings Dashboard alternates between two setup screens"
created: 2026-04-29T00:00:00Z
updated: 2026-04-29T00:00:00Z
---

## Current Focus

hypothesis: A=hardcoded localhost return_url; B=no refetch on focus or webhook missing; C=two distinct screens with different status sources
test: Read backend payments service, mobile seller_payment_setup, mobile profile menu, deep link config
expecting: Locate file:line for each
next_action: Read payments.service.ts, payments.routes.ts, payments.webhook.ts and mobile seller screens

## Symptoms

expected: Stripe redirect-back works on simulator; status refreshes after onboarding; one consistent setup screen
actual: localhost redirect fails in Safari; 60% stuck after completion; two different screens alternate
errors: Safari "couldn't connect to server", localhost in URL bar
reproduction: Complete Stripe onboarding in Safari, return to app, view profile -> Earnings
started: pre-existing Phase 1 issues, surfaced in Phase 2 UAT

## Eliminated

## Evidence

## Resolution

root_cause:
fix:
files_changed: []
