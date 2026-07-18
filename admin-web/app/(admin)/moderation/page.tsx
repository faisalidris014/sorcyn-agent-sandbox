import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { ModerateButtons } from "./moderate-buttons";
import { TakedownForm } from "./takedown-form";

interface ReviewItem {
  type: "review";
  id: string;
  overallRating: number;
  writtenReview: string | null;
  flagReason: string | null;
  flaggedAt: string | null;
  createdAt: string;
  buyer: { id: string; firstName: string; lastName: string } | null;
}

interface MessageItem {
  type: "message";
  id: string;
  messageText: string;
  flagReason: string | null;
  moderationStatus: string;
  createdAt: string;
  sender: { id: string; firstName: string; lastName: string } | null;
}

type FlaggedItem = ReviewItem | MessageItem;

interface ListResponse {
  data: FlaggedItem[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

const TABS = [
  { value: "all", label: "All" },
  { value: "review", label: "Reviews" },
  { value: "message", label: "Messages" },
] as const;

function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span style={{ color: "var(--color-warning)", letterSpacing: "1px" }}>
      {"★".repeat(full)}
      <span style={{ opacity: 0.3 }}>{"★".repeat(Math.max(0, 5 - full))}</span>
    </span>
  );
}

function FlagBanner({ reason }: { reason: string | null }) {
  if (!reason) return null;
  return (
    <div
      style={{
        background: "color-mix(in srgb, var(--color-warning) 10%, transparent)",
        border: "1px solid var(--color-warning)",
        borderRadius: "0.5rem",
        padding: "0.5rem 0.75rem",
        fontSize: "0.8125rem",
        marginBottom: "0.75rem",
      }}
    >
      <strong>Flagged:</strong> {reason}
    </div>
  );
}

export default async function ModerationPage({
  searchParams,
}: {
  searchParams: Promise<{ contentType?: string }>;
}) {
  const sp = await searchParams;
  const tab = sp.contentType ?? "all";

  const params = new URLSearchParams();
  params.set("limit", "20");
  if (tab !== "all") params.set("contentType", tab);

  const res = await apiFetch<ListResponse>(`/api/v1/admin/moderation/flagged?${params.toString()}`);
  const items = res.data;

  return (
    <div>
      <header style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.875rem", fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 0.5rem" }}>
          Moderation
        </h1>
        <p style={{ color: "var(--color-muted)", margin: 0 }}>
          Review user-flagged reviews and messages. Approve to dismiss the flag, reject to remove the content.
        </p>
      </header>

      <section className="card" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ margin: "0 0 0.25rem", fontSize: "1rem", fontWeight: 600 }}>
          Copyright takedown
        </h2>
        <p style={{ color: "var(--color-muted)", margin: "0 0 0.75rem", fontSize: "0.8125rem" }}>
          Remove a specific image from a post. Its perceptual hash is blocklisted so
          resized copies are auto-rejected (staydown), and the uploader gets a strike —
          suspended at 3 strikes.
        </p>
        <TakedownForm />
      </section>

      <nav style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {TABS.map((t) => {
          const active = tab === t.value;
          const href = t.value === "all" ? "/moderation" : `/moderation?contentType=${t.value}`;
          return (
            <Link
              key={t.value}
              href={href}
              className={active ? "btn btn-primary" : "btn btn-outline"}
              style={{ fontSize: "0.875rem", padding: "0.4rem 0.85rem" }}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>

      {items.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--color-muted)" }}>
          No flagged content awaiting review.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {items.map((item) =>
            item.type === "review" ? (
              <article key={item.id} className="card">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <h3 style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 600 }}>
                    Review by {item.buyer ? `${item.buyer.firstName} ${item.buyer.lastName}` : "—"}
                  </h3>
                  <span className="badge badge-primary" style={{ fontSize: "0.6875rem" }}>review</span>
                </div>
                <div style={{ marginBottom: "0.5rem", fontSize: "0.875rem" }}>
                  <Stars rating={item.overallRating} /> <span style={{ color: "var(--color-muted)" }}>· {item.overallRating}/5</span>
                </div>
                <FlagBanner reason={item.flagReason} />
                <p style={{ margin: "0 0 0.875rem", fontSize: "0.9375rem", lineHeight: 1.55 }}>
                  {item.writtenReview ?? <em style={{ color: "var(--color-muted)" }}>No written content.</em>}
                </p>
                <div style={{ fontSize: "0.75rem", color: "var(--color-muted)", marginBottom: "0.75rem" }}>
                  Flagged {item.flaggedAt ? new Date(item.flaggedAt).toLocaleString() : "—"}
                </div>
                <ModerateButtons kind="review" id={item.id} />
              </article>
            ) : (
              <article key={item.id} className="card">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <h3 style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 600 }}>
                    Message from {item.sender ? `${item.sender.firstName} ${item.sender.lastName}` : "—"}
                  </h3>
                  <span className="badge badge-primary" style={{ fontSize: "0.6875rem" }}>message</span>
                </div>
                <FlagBanner reason={item.flagReason} />
                <p style={{ margin: "0 0 0.875rem", fontSize: "0.9375rem", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
                  {item.messageText}
                </p>
                <div style={{ fontSize: "0.75rem", color: "var(--color-muted)", marginBottom: "0.75rem" }}>
                  Sent {new Date(item.createdAt).toLocaleString()}
                </div>
                <ModerateButtons kind="message" id={item.id} />
              </article>
            ),
          )}
        </div>
      )}

      <p style={{ marginTop: "1rem", fontSize: "0.8125rem", color: "var(--color-muted)" }}>
        Showing {items.length} of {res.meta.total}
      </p>
    </div>
  );
}
