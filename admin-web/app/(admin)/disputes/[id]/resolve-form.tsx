"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type Outcome = "full_refund" | "partial_refund" | "no_refund" | "custom";

const OUTCOMES: { value: Outcome; label: string; requiresAmount: boolean; hint: string }[] = [
  { value: "full_refund", label: "Full refund to buyer", requiresAmount: false, hint: "Refund the entire quote amount; seller payout reversed." },
  { value: "partial_refund", label: "Partial refund", requiresAmount: true, hint: "Refund a specific amount; remainder stays with seller." },
  { value: "no_refund", label: "Seller keeps payment", requiresAmount: false, hint: "Buyer claim denied; seller is paid in full." },
  { value: "custom", label: "Custom amount", requiresAmount: true, hint: "Manually split funds." },
];

export function ResolveDisputeForm({
  disputeId,
  quoteAmount,
  requestedAmount,
  postReleaseWarning,
}: {
  disputeId: string;
  quoteAmount: string | null;
  requestedAmount: string | null;
  postReleaseWarning: boolean;
}) {
  const router = useRouter();
  const [outcome, setOutcome] = useState<Outcome>("partial_refund");
  const [refundAmount, setRefundAmount] = useState<string>(requestedAmount ?? "");
  const [summary, setSummary] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selected = OUTCOMES.find((o) => o.value === outcome)!;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (summary.trim().length < 10) {
      toast.error("Resolution summary must be at least 10 characters.");
      return;
    }
    const body: Record<string, unknown> = {
      outcome,
      resolutionSummary: summary.trim(),
    };
    if (selected.requiresAmount) {
      const amt = Number(refundAmount);
      if (!Number.isFinite(amt) || amt < 0) {
        toast.error("Refund amount must be a non-negative number.");
        return;
      }
      if (quoteAmount && amt > Number(quoteAmount)) {
        toast.error("Refund cannot exceed the original quote.");
        return;
      }
      body.refundAmount = amt;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/disputes/${disputeId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json?.error ?? "Failed to resolve dispute.");
        return;
      }
      toast.success("Dispute resolved.");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card">
      <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.9375rem", fontWeight: 600 }}>Resolve dispute</h3>

      {postReleaseWarning && (
        <div
          style={{
            background: "color-mix(in srgb, var(--color-warning) 12%, transparent)",
            border: "1px solid var(--color-warning)",
            color: "var(--color-warning)",
            borderRadius: "0.5rem",
            padding: "0.625rem 0.75rem",
            fontSize: "0.8125rem",
            marginBottom: "0.875rem",
            lineHeight: 1.5,
          }}
        >
          Escrow has already been released for this transaction. Resolving here records the
          outcome and flips status / escrow flags but does <strong>not</strong> reverse the Stripe Transfer.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "1rem" }}>
        {OUTCOMES.map((o) => (
          <label
            key={o.value}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "0.625rem",
              padding: "0.625rem 0.75rem",
              border: outcome === o.value ? "1.5px solid var(--color-primary)" : "1px solid var(--color-border)",
              borderRadius: "0.5rem",
              cursor: "pointer",
              background: outcome === o.value ? "color-mix(in srgb, var(--color-primary) 6%, transparent)" : "transparent",
            }}
          >
            <input
              type="radio"
              name="outcome"
              value={o.value}
              checked={outcome === o.value}
              onChange={() => setOutcome(o.value)}
              style={{ marginTop: 3 }}
            />
            <div>
              <div style={{ fontWeight: 500, fontSize: "0.875rem" }}>{o.label}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>{o.hint}</div>
            </div>
          </label>
        ))}
      </div>

      {selected.requiresAmount && (
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 500, marginBottom: "0.35rem" }}>
            Refund amount (USD)
          </label>
          <input
            className="input"
            type="number"
            min={0}
            step="0.01"
            value={refundAmount}
            onChange={(e) => setRefundAmount(e.target.value)}
            placeholder="0.00"
            required
          />
          {quoteAmount && (
            <div style={{ fontSize: "0.75rem", color: "var(--color-muted)", marginTop: "0.25rem" }}>
              Max: ${Number(quoteAmount).toFixed(2)} · Buyer requested ${Number(requestedAmount ?? 0).toFixed(2)}
            </div>
          )}
        </div>
      )}

      <div style={{ marginBottom: "1rem" }}>
        <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 500, marginBottom: "0.35rem" }}>
          Resolution summary <span style={{ color: "var(--color-muted)" }}>(min 10 chars)</span>
        </label>
        <textarea
          className="input"
          rows={4}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Explain the decision — what evidence supported it and how the funds are split."
          required
        />
      </div>

      <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: "100%" }}>
        {submitting ? "Resolving…" : "Resolve dispute"}
      </button>
    </form>
  );
}
