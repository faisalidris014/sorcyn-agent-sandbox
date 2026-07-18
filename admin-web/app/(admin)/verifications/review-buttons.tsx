"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function ReviewVerificationButtons({
  verificationId,
  verificationType,
}: {
  verificationId: string;
  verificationType?: string;
}) {
  const router = useRouter();
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [notes, setNotes] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [pending, setPending] = useState<"approve" | "reject" | null>(null);

  // Only license/insurance credentials carry an expiry the admin can set.
  const hasExpiry = verificationType === "license" || verificationType === "insurance";

  async function submit(action: "approve" | "reject", body: Record<string, unknown>) {
    setPending(action);
    try {
      const res = await fetch(`/api/admin/verifications/${verificationId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...body }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json?.error ?? `Failed to ${action}.`);
        return;
      }
      toast.success(action === "approve" ? "Verification approved." : "Verification rejected.");
      setRejectModal(false);
      setRejectionReason("");
      setNotes("");
      setExpiresAt("");
      router.refresh();
    } finally {
      setPending(null);
    }
  }

  async function onApprove() {
    const body: Record<string, unknown> = {};
    if (notes) body.notes = notes;
    // <input type="date"> yields YYYY-MM-DD; the API expects ISO 8601 datetime.
    // Pin to UTC midnight so the date the admin picked is the date stored (@db.Date).
    if (hasExpiry && expiresAt) body.expiresAt = `${expiresAt}T00:00:00.000Z`;
    await submit("approve", body);
  }

  async function onConfirmReject(e: React.FormEvent) {
    e.preventDefault();
    if (rejectionReason.trim().length < 10) {
      toast.error("Rejection reason must be at least 10 characters.");
      return;
    }
    await submit("reject", { rejectionReason: rejectionReason.trim(), ...(notes ? { notes } : {}) });
  }

  return (
    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", alignItems: "center", flexWrap: "wrap" }}>
      {hasExpiry && (
        <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8125rem", color: "var(--color-muted)", marginRight: "auto" }}>
          Expiry
          <input
            type="date"
            className="input"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            disabled={pending !== null}
            style={{ width: "auto", padding: "0.3rem 0.5rem", fontSize: "0.8125rem" }}
          />
        </label>
      )}
      <button
        className="btn btn-outline"
        disabled={pending !== null}
        onClick={() => setRejectModal(true)}
      >
        Reject
      </button>
      <button
        className="btn btn-primary"
        disabled={pending !== null}
        onClick={onApprove}
      >
        {pending === "approve" ? "Approving…" : "Approve"}
      </button>

      {rejectModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "grid",
            placeItems: "center",
            zIndex: 50,
          }}
          onClick={() => !pending && setRejectModal(false)}
        >
          <form
            onSubmit={onConfirmReject}
            onClick={(e) => e.stopPropagation()}
            className="card"
            style={{ width: "min(520px, 92vw)", margin: 0, textAlign: "left" }}
          >
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.0625rem", fontWeight: 600 }}>
              Reject verification request
            </h3>
            <p style={{ fontSize: "0.875rem", color: "var(--color-muted)", margin: "0 0 0.875rem" }}>
              Provide a reason the seller will see (10–500 chars). Notes are admin-only.
            </p>

            <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 500, marginBottom: "0.35rem" }}>
              Rejection reason
            </label>
            <textarea
              className="input"
              rows={3}
              autoFocus
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Why is this verification rejected?"
              maxLength={500}
              required
            />

            <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 500, margin: "0.875rem 0 0.35rem" }}>
              Internal notes <span style={{ color: "var(--color-muted)" }}>(optional)</span>
            </label>
            <textarea
              className="input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Admin-only notes for the audit trail."
              maxLength={1000}
            />

            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "1rem" }}>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={pending !== null}
                onClick={() => setRejectModal(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-danger" disabled={pending !== null}>
                {pending === "reject" ? "Rejecting…" : "Reject"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
