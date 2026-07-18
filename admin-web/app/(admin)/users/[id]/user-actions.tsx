"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type Action = "suspend" | "ban" | "reactivate" | "force-logout";

export function UserActions({
  userId,
  status,
  isAdmin,
}: {
  userId: string;
  status: "active" | "suspended" | "banned" | "deleted";
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [reasonModal, setReasonModal] = useState<null | "suspend" | "ban">(null);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState<Action | null>(null);

  async function callAction(action: Action, body?: Record<string, unknown>) {
    setPending(action);
    try {
      const res = await fetch(`/api/admin/users/${userId}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json?.error ?? `Failed to ${action.replace("-", " ")}.`);
        return;
      }
      toast.success(json?.message ?? `Action complete: ${action.replace("-", " ")}.`);
      setReasonModal(null);
      setReason("");
      router.refresh();
    } finally {
      setPending(null);
    }
  }

  async function submitReason(e: React.FormEvent) {
    e.preventDefault();
    if (!reasonModal) return;
    if (reason.trim().length < 10) {
      toast.error("Reason must be at least 10 characters.");
      return;
    }
    await callAction(reasonModal, { reason: reason.trim() });
  }

  const canSuspend = status === "active" && !isAdmin;
  const canBan = status !== "banned" && !isAdmin;
  const canReactivate = status === "suspended" || status === "banned";

  return (
    <section className="card">
      <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.9375rem", fontWeight: 600 }}>Actions</h3>

      {isAdmin && (
        <p style={{ fontSize: "0.8125rem", color: "var(--color-warning)", marginBottom: "0.75rem" }}>
          Admin accounts cannot be suspended or banned from this UI.
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <button
          className="btn btn-outline"
          disabled={!canSuspend || pending !== null}
          onClick={() => setReasonModal("suspend")}
          style={{ justifyContent: "flex-start" }}
        >
          Suspend account
        </button>
        <button
          className="btn btn-danger"
          disabled={!canBan || pending !== null}
          onClick={() => setReasonModal("ban")}
          style={{ justifyContent: "flex-start" }}
        >
          Permanently ban
        </button>
        <button
          className="btn btn-outline"
          disabled={!canReactivate || pending !== null}
          onClick={() => callAction("reactivate")}
          style={{ justifyContent: "flex-start" }}
        >
          {pending === "reactivate" ? "Reactivating…" : "Reactivate account"}
        </button>
        <button
          className="btn btn-ghost"
          disabled={pending !== null}
          onClick={() => callAction("force-logout")}
          style={{ justifyContent: "flex-start" }}
        >
          {pending === "force-logout" ? "Invalidating sessions…" : "Force logout (invalidate all sessions)"}
        </button>
      </div>

      {reasonModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.4)",
            display: "grid",
            placeItems: "center",
            zIndex: 50,
          }}
          onClick={() => !pending && setReasonModal(null)}
        >
          <form
            onSubmit={submitReason}
            onClick={(e) => e.stopPropagation()}
            className="card"
            style={{ width: "min(480px, 92vw)", margin: 0 }}
          >
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.0625rem", fontWeight: 600 }}>
              {reasonModal === "suspend" ? "Suspend account" : "Permanently ban account"}
            </h3>
            <p style={{ fontSize: "0.875rem", color: "var(--color-muted)", margin: "0 0 0.875rem" }}>
              This action is logged. Provide a reason (10–500 characters).
            </p>
            <textarea
              className="input"
              rows={4}
              autoFocus
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this account being acted on?"
              maxLength={500}
              required
            />
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "1rem" }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setReasonModal(null)}
                disabled={pending !== null}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={reasonModal === "ban" ? "btn btn-danger" : "btn btn-primary"}
                disabled={pending !== null}
              >
                {pending ? "Working…" : `Confirm ${reasonModal}`}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
