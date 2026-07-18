"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function ModerateButtons({ kind, id }: { kind: "review" | "message"; id: string }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState<"approve" | "reject" | null>(null);

  async function call(action: "approve" | "reject") {
    setPending(action);
    try {
      const path =
        kind === "review"
          ? `/api/admin/moderation/reviews/${id}`
          : `/api/admin/moderation/messages/${id}`;
      const body: Record<string, unknown> = { action };
      if (reason.trim()) body.reason = reason.trim();
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json?.error ?? `Failed to ${action} ${kind}.`);
        return;
      }
      toast.success(
        action === "approve"
          ? `${kind === "review" ? "Review" : "Message"} approved — flag cleared.`
          : `${kind === "review" ? "Review" : "Message"} removed.`,
      );
      router.refresh();
    } finally {
      setPending(null);
    }
  }

  return (
    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
      <input
        className="input"
        type="text"
        placeholder="Optional reason for the audit log"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        maxLength={500}
        style={{ flex: "1 1 240px" }}
      />
      <button
        className="btn btn-outline"
        disabled={pending !== null}
        onClick={() => call("approve")}
      >
        {pending === "approve" ? "Approving…" : "Approve (keep)"}
      </button>
      <button
        className="btn btn-danger"
        disabled={pending !== null}
        onClick={() => call("reject")}
      >
        {pending === "reject" ? "Removing…" : "Remove"}
      </button>
    </div>
  );
}
