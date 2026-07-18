import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { ReviewCategoryRequestButtons } from "./review-buttons";

type RequestStatus = "pending" | "under_review" | "approved" | "rejected" | "expired";

interface SubmittedDoc {
  url: string;
  type?: string;
  description?: string;
  filename?: string;
}

interface CategoryRequestRow {
  id: string;
  sellerId: string;
  majorCategoryId: string;
  subcategoryIds: string[];
  documents: SubmittedDoc[];
  licenseNumber: string | null;
  holderName: string | null;
  requiredDocTypes: string[];
  status: RequestStatus;
  outcome: string | null;
  decisionReason: string | null;
  decisionContext: Record<string, unknown> | null;
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
  data: CategoryRequestRow[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

interface CategoryTreeNode {
  id: string;
  name: string;
  children?: CategoryTreeNode[];
}

// Flatten the category tree (majors + their subcategories) into id → name.
function flattenCategories(nodes: CategoryTreeNode[], into: Map<string, string>) {
  for (const node of nodes) {
    into.set(node.id, node.name);
    if (node.children?.length) flattenCategories(node.children, into);
  }
}

const STATUS_TABS: { value: RequestStatus | "all"; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "under_review", label: "Under review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "expired", label: "Expired" },
  { value: "all", label: "All" },
];

function statusBadge(status: RequestStatus) {
  const map: Record<RequestStatus, string> = {
    pending: "badge-warning",
    under_review: "badge-warning",
    approved: "badge-success",
    rejected: "badge-danger",
    expired: "badge-danger",
  };
  return <span className={`badge ${map[status]}`}>{status.replace(/_/g, " ")}</span>;
}

// Map the router's low-cardinality queue-reason labels to human-readable text.
// Falls back to the raw value (e.g. a free-form admin rejection reason).
const REASON_LABELS: Record<string, string> = {
  manual_review: "Manual review required",
  no_provider: "No automated verifier for this license authority",
  provider_queue: "Automated check inconclusive — needs manual review",
  provider_approved: "Auto-approved by license verifier",
  provider_rejected: "Auto-rejected by license verifier",
  instant: "Instant (no review needed)",
  // Reasons emitted by the TX TDLR provider when it defers to manual review.
  license_not_found: "License number not found on the state board",
  license_number_missing: "No license number was provided",
  provider_unreachable: "State board was unreachable — needs manual review",
  name_mismatch: "License-holder name did not match the board record",
  expiration_unparseable: "Could not read the license expiration date",
  license_expired: "License has expired",
};

function reasonLabel(reason: string | null): string | null {
  if (!reason) return null;
  return REASON_LABELS[reason] ?? reason;
}

function DocumentPreview({ doc }: { doc: SubmittedDoc }) {
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
        {doc.type ?? doc.description ?? doc.filename ?? "View full"}
      </div>
    </a>
  );
}

export default async function CategoryRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const params = new URLSearchParams();
  params.set("limit", "20");
  if (sp.status && sp.status !== "all") params.set("status", sp.status);

  const res = await apiFetch<ListResponse>(`/api/v1/admin/category-requests?${params.toString()}`);
  const items = res.data;

  // Resolve category UUIDs to names. The flat /categories endpoint only returns
  // the 3 top-level majors, so use the tree (majors + subcategories) and flatten.
  // Best-effort — if it fails, rows fall back to raw ids.
  const categoryNames = new Map<string, string>();
  try {
    const treeRes = await apiFetch<{ data: CategoryTreeNode[] }>(`/api/v1/categories/tree`);
    flattenCategories(treeRes.data, categoryNames);
  } catch {
    // Names unavailable — rows render raw ids below.
  }
  const nameFor = (id: string) => categoryNames.get(id) ?? id;

  return (
    <div>
      <header style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.875rem", fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 0.5rem" }}>
          Category requests
        </h1>
        <p style={{ color: "var(--color-muted)", margin: 0 }}>
          Review seller requests for Services / Jobs category access that the verification router
          could not auto-decide. Approving unlocks the category and flips the relevant badges.
        </p>
      </header>

      <nav style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {STATUS_TABS.map((tab) => {
          const active = (sp.status ?? "pending") === tab.value;
          const qs = new URLSearchParams();
          if (tab.value !== "all") qs.set("status", tab.value);
          const href = `/category-requests${qs.toString() ? `?${qs.toString()}` : ""}`;
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
          No category requests match this filter.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {items.map((r) => {
            const subNames = (r.subcategoryIds ?? []).map(nameFor);
            const reviewable = r.status === "pending" || r.status === "under_review";
            return (
              <article key={r.id} className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", marginBottom: "0.875rem" }}>
                  <div>
                    <h3 style={{ margin: "0 0 0.25rem", fontSize: "1rem", fontWeight: 600 }}>
                      {r.seller.user.firstName} {r.seller.user.lastName}
                      {r.seller.businessName && (
                        <span style={{ color: "var(--color-muted)", fontWeight: 400 }}> · {r.seller.businessName}</span>
                      )}
                    </h3>
                    <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--color-muted)" }}>
                      {r.seller.user.email} · submitted {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {statusBadge(r.status)}
                </div>

                {/* Requested categories */}
                <p style={{ margin: "0 0 0.625rem", fontSize: "0.875rem" }}>
                  <strong>Requesting:</strong> {nameFor(r.majorCategoryId)}
                  {subNames.length > 0 && (
                    <span style={{ color: "var(--color-muted)" }}> › {subNames.join(", ")}</span>
                  )}
                </p>

                {/* License / holder */}
                {(r.licenseNumber || r.holderName) && (
                  <p style={{ margin: "0 0 0.625rem", fontSize: "0.8125rem", color: "var(--color-muted)" }}>
                    {r.licenseNumber && <>License #{r.licenseNumber}</>}
                    {r.licenseNumber && r.holderName && " · "}
                    {r.holderName && <>holder {r.holderName}</>}
                  </p>
                )}

                {/* Required docs */}
                {r.requiredDocTypes && r.requiredDocTypes.length > 0 && (
                  <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                    {r.requiredDocTypes.map((t) => (
                      <span key={t} className="badge badge-primary" style={{ fontSize: "0.6875rem" }}>
                        {t.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                )}

                {/* Submitted documents */}
                {r.documents && r.documents.length > 0 ? (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: `repeat(auto-fill, minmax(220px, 1fr))`,
                      gap: "0.75rem",
                      marginBottom: "0.875rem",
                    }}
                  >
                    {r.documents.map((doc, i) => (
                      <DocumentPreview key={`${doc.url}-${i}`} doc={doc} />
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: "0.875rem", color: "var(--color-muted)", margin: "0 0 0.875rem" }}>
                    No documents attached.
                  </p>
                )}

                {/* Queue reason (why the router could not auto-decide) */}
                {reviewable && reasonLabel(r.decisionReason) && (
                  <p style={{ margin: "0 0 0.5rem", fontSize: "0.8125rem" }}>
                    <strong>Queue reason:</strong> {reasonLabel(r.decisionReason)}
                  </p>
                )}

                {/* Raw board result from the license verifier, when present */}
                {r.decisionContext && Object.keys(r.decisionContext).length > 0 && (
                  <details style={{ marginBottom: "0.75rem" }}>
                    <summary style={{ fontSize: "0.8125rem", cursor: "pointer", color: "var(--color-muted)" }}>
                      Raw board result
                    </summary>
                    <pre
                      style={{
                        margin: "0.5rem 0 0",
                        padding: "0.625rem 0.75rem",
                        background: "var(--color-bg)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "0.5rem",
                        fontSize: "0.75rem",
                        overflowX: "auto",
                      }}
                    >
                      {JSON.stringify(r.decisionContext, null, 2)}
                    </pre>
                  </details>
                )}

                {/* Resolved rejection reason (category requests store it in decisionReason) */}
                {r.status === "rejected" && r.decisionReason && (
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
                    <strong>Rejected:</strong> {reasonLabel(r.decisionReason)}
                  </div>
                )}

                {reviewable && <ReviewCategoryRequestButtons requestId={r.id} />}
              </article>
            );
          })}
        </div>
      )}

      <p style={{ marginTop: "1rem", fontSize: "0.8125rem", color: "var(--color-muted)" }}>
        Showing {items.length} of {res.meta.total}
      </p>
    </div>
  );
}
