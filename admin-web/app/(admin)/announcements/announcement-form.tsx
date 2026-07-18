"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type Severity = "info" | "warning" | "critical";

const SEVERITIES: { value: Severity; label: string; hint: string }[] = [
  { value: "info", label: "Info (purple)", hint: "General notice" },
  { value: "warning", label: "Warning (amber)", hint: "Degraded / heads-up" },
  { value: "critical", label: "Critical (red)", hint: "Active incident / outage" },
];

// RUNBOOK_OPS.md §2 wording rule — never name the payment processor.
const FORBIDDEN = /\bstripe\b/i;

export function AnnouncementForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState<Severity>("info");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [pending, setPending] = useState(false);

  const trimmed = message.trim();
  const namesStripe = FORBIDDEN.test(message);
  const tooShort = trimmed.length > 0 && trimmed.length < 3;
  const canSubmit = trimmed.length >= 3 && !namesStripe && !pending;

  async function submit() {
    if (!canSubmit) return;
    setPending(true);
    try {
      const body: Record<string, unknown> = { message: trimmed, severity };
      if (startsAt) body.startsAt = new Date(startsAt).toISOString();
      if (endsAt) body.endsAt = new Date(endsAt).toISOString();

      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json?.error ?? "Failed to publish announcement.");
        return;
      }
      toast.success("Announcement published — live for users within 60s.");
      setMessage("");
      setSeverity("info");
      setStartsAt("");
      setEndsAt("");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div>
        <h2 style={{ margin: "0 0 0.25rem", fontSize: "1.0625rem", fontWeight: 600 }}>
          Publish a banner
        </h2>
        <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--color-muted)" }}>
          Shows on every screen in the app for all users. Keep it short and customer-facing.
        </p>
      </div>

      <div>
        <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.375rem" }}>
          Message
        </label>
        <textarea
          className="input"
          placeholder="e.g. We're investigating slow payment processing and working on a fix."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={500}
          rows={3}
          style={{ resize: "vertical", fontFamily: "inherit" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.375rem", fontSize: "0.75rem" }}>
          <span style={{ color: namesStripe ? "var(--color-danger)" : "var(--color-muted)" }}>
            {namesStripe
              ? "Wording rule (RUNBOOK §2): never name “Stripe” — say “our payment processor.”"
              : "Wording rule: never name “Stripe” / always say “our payment processor.”"}
          </span>
          <span style={{ color: "var(--color-muted)" }}>{trimmed.length}/500</span>
        </div>
        {tooShort && (
          <div style={{ fontSize: "0.75rem", color: "var(--color-danger)", marginTop: "0.25rem" }}>
            Message must be at least 3 characters.
          </div>
        )}
      </div>

      <div>
        <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.375rem" }}>
          Severity
        </label>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {SEVERITIES.map((s) => {
            const active = severity === s.value;
            return (
              <button
                key={s.value}
                type="button"
                className={active ? "btn btn-primary" : "btn btn-outline"}
                onClick={() => setSeverity(s.value)}
                title={s.hint}
                style={{ fontSize: "0.8125rem", padding: "0.4rem 0.85rem" }}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 200px" }}>
          <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.375rem" }}>
            Starts at <span style={{ color: "var(--color-muted)", fontWeight: 400 }}>(optional — defaults to now)</span>
          </label>
          <input
            className="input"
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
          />
        </div>
        <div style={{ flex: "1 1 200px" }}>
          <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.375rem" }}>
            Ends at <span style={{ color: "var(--color-muted)", fontWeight: 400 }}>(optional — open-ended)</span>
          </label>
          <input
            className="input"
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
          />
        </div>
      </div>

      <div>
        <button className="btn btn-primary" disabled={!canSubmit} onClick={submit}>
          {pending ? "Publishing…" : "Publish announcement"}
        </button>
      </div>
    </div>
  );
}
