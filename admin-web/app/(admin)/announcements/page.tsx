import { apiFetch } from "@/lib/api";
import { AnnouncementForm } from "./announcement-form";
import { ClearButton } from "./clear-button";

type Severity = "info" | "warning" | "critical";

interface Announcement {
  id: string;
  message: string;
  severity: Severity;
  startsAt: string;
  endsAt: string | null;
  createdAt: string;
}

interface ActiveResponse {
  data: Announcement[];
}

const SEVERITY_META: Record<Severity, { label: string; badge: string; accent: string }> = {
  info: { label: "Info", badge: "badge-primary", accent: "var(--color-primary)" },
  warning: { label: "Warning", badge: "badge-warning", accent: "var(--color-warning)" },
  critical: { label: "Critical", badge: "badge-danger", accent: "var(--color-danger)" },
};

export default async function AnnouncementsPage() {
  // The public /active endpoint is the same data the mobile banner reads — the
  // console is the single write surface for this one source of truth (#251).
  const res = await apiFetch<ActiveResponse>("/api/v1/announcements/active");
  const active = res.data ?? [];

  return (
    <div>
      <header style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.875rem", fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 0.5rem" }}>
          Announcements
        </h1>
        <p style={{ color: "var(--color-muted)", margin: 0 }}>
          The operator&apos;s in-app lever for talking to users mid-incident. Anything published here
          appears as a banner on every screen of the app and clears the moment you remove it.
        </p>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <AnnouncementForm />

        <section>
          <h2 style={{ fontSize: "1.0625rem", fontWeight: 600, margin: "0 0 0.875rem" }}>
            Currently live{active.length > 0 ? ` (${active.length})` : ""}
          </h2>

          {active.length === 0 ? (
            <div
              className="card"
              style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--color-muted)" }}
            >
              No active announcements. The app shows no banner right now.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {active.map((a) => {
                const meta = SEVERITY_META[a.severity];
                return (
                  <article
                    key={a.id}
                    className="card"
                    style={{ borderLeft: `4px solid ${meta.accent}` }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: "1rem",
                        marginBottom: "0.625rem",
                      }}
                    >
                      <span className={`badge ${meta.badge}`} style={{ fontSize: "0.6875rem" }}>
                        {meta.label}
                      </span>
                      <ClearButton id={a.id} />
                    </div>
                    <p style={{ margin: "0 0 0.75rem", fontSize: "0.9375rem", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
                      {a.message}
                    </p>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>
                      Started {new Date(a.startsAt).toLocaleString()}
                      {a.endsAt ? ` · Ends ${new Date(a.endsAt).toLocaleString()}` : " · Open-ended"}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
