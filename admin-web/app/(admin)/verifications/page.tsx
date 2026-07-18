import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { ReviewVerificationButtons } from "./review-buttons";

type VerificationStatus = "pending" | "under_review" | "approved" | "rejected" | "expired";
type VerificationType = "id" | "ein" | "license" | "insurance" | "background_check";

interface VerificationDoc {
  url: string;
  type?: string;
  description?: string;
  filename?: string;
}

interface VerificationRow {
  id: string;
  sellerId: string;
  verificationType: VerificationType;
  tier: number;
  documents: VerificationDoc[];
  status: VerificationStatus;
  rejectionReason: string | null;
  notes: string | null;
  expiresAt: string | null;
  reviewedAt: string | null;
  createdAt: string;
  seller: {
    id: string;
    businessName: string | null;
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
    };
  };
}

interface ListResponse {
  data: VerificationRow[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

const STATUS_TABS: { value: VerificationStatus | "all"; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "under_review", label: "Under review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "expired", label: "Expired" },
  { value: "all", label: "All" },
];

function statusBadge(status: VerificationStatus) {
  const map: Record<VerificationStatus, string> = {
    pending: "badge-warning",
    under_review: "badge-warning",
    approved: "badge-success",
    rejected: "badge-danger",
    expired: "badge-danger",
  };
  return <span className={`badge ${map[status]}`}>{status.replace(/_/g, " ")}</span>;
}

const TYPE_LABELS: Record<VerificationType, string> = {
  id: "Government ID",
  ein: "EIN",
  license: "License",
  insurance: "Insurance",
  background_check: "Background check",
};

function DocumentPreview({ doc }: { doc: VerificationDoc }) {
  return (
    <a
      href={doc.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "block",
        border: "1px solid var(--color-border)",
        borderRadius: "0.5rem",
        overflow: "hidden",
        textDecoration: "none",
        color: "inherit",
        background: "var(--color-bg)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={doc.url}
        alt={doc.description ?? doc.filename ?? doc.type ?? "document"}
        style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }}
      />
      <div style={{ padding: "0.4rem 0.625rem", fontSize: "0.75rem", color: "var(--color-muted)" }}>
        {doc.description ?? doc.filename ?? doc.type ?? "View full"}
      </div>
    </a>
  );
}

export default async function VerificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string }>;
}) {
  const sp = await searchParams;
  const params = new URLSearchParams();
  params.set("limit", "20");
  if (sp.status && sp.status !== "all") params.set("status", sp.status);
  if (sp.type) params.set("type", sp.type);

  const res = await apiFetch<ListResponse>(`/api/v1/admin/verifications?${params.toString()}`);
  const items = res.data;

  return (
    <div>
      <header style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.875rem", fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 0.5rem" }}>
          Verifications
        </h1>
        <p style={{ color: "var(--color-muted)", margin: 0 }}>
          Review submitted documents and approve or reject seller verification requests.
        </p>
      </header>

      <nav style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {STATUS_TABS.map((tab) => {
          const active = (sp.status ?? "pending") === tab.value;
          const qs = new URLSearchParams();
          if (tab.value !== "all") qs.set("status", tab.value);
          if (sp.type) qs.set("type", sp.type);
          const href = `/verifications${qs.toString() ? `?${qs.toString()}` : ""}`;
          return (
            <Link
              key={tab.value}
              href={href}
              className={active ? "btn btn-primary" : "btn btn-outline"}
              style={{ fontSize: "0.875rem", padding: "0.4rem 0.85rem" }}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {items.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--color-muted)" }}>
          No verification requests match this filter.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {items.map((v) => (
            <article key={v.id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", marginBottom: "0.875rem" }}>
                <div>
                  <h3 style={{ margin: "0 0 0.25rem", fontSize: "1rem", fontWeight: 600 }}>
                    {v.seller.user.firstName} {v.seller.user.lastName}
                    {v.seller.businessName && (
                      <span style={{ color: "var(--color-muted)", fontWeight: 400 }}> · {v.seller.businessName}</span>
                    )}
                  </h3>
                  <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--color-muted)" }}>
                    {v.seller.user.email} · submitted {new Date(v.createdAt).toLocaleDateString()}
                    {v.expiresAt && ` · expires ${new Date(v.expiresAt).toLocaleDateString()}`}
                  </p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.35rem" }}>
                  <span className="badge badge-primary" style={{ fontSize: "0.6875rem" }}>
                    {TYPE_LABELS[v.verificationType]} · tier {v.tier}
                  </span>
                  {statusBadge(v.status)}
                </div>
              </div>

              {v.documents && v.documents.length > 0 ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(auto-fill, minmax(220px, 1fr))`,
                    gap: "0.75rem",
                    marginBottom: "0.875rem",
                  }}
                >
                  {v.documents.map((doc, i) => (
                    <DocumentPreview key={`${doc.url}-${i}`} doc={doc} />
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: "0.875rem", color: "var(--color-muted)", margin: "0 0 0.875rem" }}>
                  No documents attached.
                </p>
              )}

              {v.status === "rejected" && v.rejectionReason && (
                <div
                  style={{
                    background: "color-mix(in srgb, var(--color-danger) 8%, transparent)",
                    border: "1px solid var(--color-danger)",
                    borderRadius: "0.5rem",
                    padding: "0.625rem 0.75rem",
                    fontSize: "0.8125rem",
                    marginBottom: "0.75rem",
                  }}
                >
                  <strong>Rejected:</strong> {v.rejectionReason}
                </div>
              )}

              {(v.status === "pending" || v.status === "under_review") && (
                <ReviewVerificationButtons
                  verificationId={v.id}
                  verificationType={v.verificationType}
                />
              )}
            </article>
          ))}
        </div>
      )}

      <p style={{ marginTop: "1rem", fontSize: "0.8125rem", color: "var(--color-muted)" }}>
        Showing {items.length} of {res.meta.total}
      </p>
    </div>
  );
}
