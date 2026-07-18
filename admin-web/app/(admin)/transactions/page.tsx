import Link from "next/link";
import { apiFetch } from "@/lib/api";

interface TxRow {
  id: string;
  postId: string;
  buyerId: string;
  sellerId: string;
  transactionType: "service" | "product" | "shipped" | "local" | "job" | string;
  quoteAmount: string;
  totalCharged: string | null;
  platformFee: string | null;
  sellerPayoutAmount: string | null;
  escrowStatus: "held" | "released" | "refunded" | "frozen";
  escrowReleasedAt: string | null;
  status: string;
  completedAt: string | null;
  createdAt: string;
}

interface ListResponse {
  data: TxRow[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "pending_payment", label: "Pending payment" },
  { value: "paid", label: "Paid" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "disputed", label: "Disputed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

const ESCROW_TABS = [
  { value: "all", label: "Any escrow" },
  { value: "held", label: "Held" },
  { value: "released", label: "Released" },
  { value: "refunded", label: "Refunded" },
  { value: "frozen", label: "Frozen" },
] as const;

function fmtMoney(amount: string | null | undefined) {
  if (amount == null) return "—";
  const n = Number(amount);
  if (!Number.isFinite(n)) return "—";
  return `$${n.toFixed(2)}`;
}

function statusBadge(status: string) {
  const cls =
    status === "completed"
      ? "badge-success"
      : status === "disputed" || status === "cancelled"
        ? "badge-danger"
        : "badge-warning";
  return <span className={`badge ${cls}`}>{status.replace(/_/g, " ")}</span>;
}

function escrowBadge(s: TxRow["escrowStatus"]) {
  const cls =
    s === "released"
      ? "badge-success"
      : s === "refunded" || s === "frozen"
        ? "badge-danger"
        : "badge-primary";
  return <span className={`badge ${cls}`}>{s}</span>;
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; escrowStatus?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const params = new URLSearchParams();
  params.set("limit", "25");
  if (sp.page) params.set("page", sp.page);
  if (sp.status && sp.status !== "all") params.set("status", sp.status);
  if (sp.escrowStatus && sp.escrowStatus !== "all") params.set("escrowStatus", sp.escrowStatus);

  const res = await apiFetch<ListResponse>(`/api/v1/admin/transactions?${params.toString()}`);
  const rows = res.data;

  return (
    <div>
      <header style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.875rem", fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 0.5rem" }}>
          Transactions
        </h1>
        <p style={{ color: "var(--color-muted)", margin: 0 }}>
          {res.meta.total.toLocaleString()} transactions · read-only overview.
        </p>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {STATUS_TABS.map((t) => {
            const active = (sp.status ?? "all") === t.value;
            const qs = new URLSearchParams();
            if (t.value !== "all") qs.set("status", t.value);
            if (sp.escrowStatus) qs.set("escrowStatus", sp.escrowStatus);
            const href = `/transactions${qs.toString() ? `?${qs.toString()}` : ""}`;
            return (
              <Link
                key={t.value}
                href={href}
                className={active ? "btn btn-primary" : "btn btn-outline"}
                style={{ fontSize: "0.8125rem", padding: "0.35rem 0.75rem" }}
              >
                {t.label}
              </Link>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {ESCROW_TABS.map((t) => {
            const active = (sp.escrowStatus ?? "all") === t.value;
            const qs = new URLSearchParams();
            if (sp.status) qs.set("status", sp.status);
            if (t.value !== "all") qs.set("escrowStatus", t.value);
            const href = `/transactions${qs.toString() ? `?${qs.toString()}` : ""}`;
            return (
              <Link
                key={t.value}
                href={href}
                className={active ? "btn btn-primary" : "btn btn-ghost"}
                style={{ fontSize: "0.75rem", padding: "0.25rem 0.65rem" }}
              >
                {t.label}
              </Link>
            );
          })}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--color-muted)" }}>
          No transactions match this filter.
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Status</th>
                <th>Escrow</th>
                <th style={{ textAlign: "right" }}>Quote</th>
                <th style={{ textAlign: "right" }}>Charged</th>
                <th style={{ textAlign: "right" }}>Platform</th>
                <th style={{ textAlign: "right" }}>Payout</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id}>
                  <td>
                    <code style={{ fontSize: "0.75rem" }}>{t.id.slice(0, 8)}</code>
                  </td>
                  <td>{t.transactionType}</td>
                  <td>{statusBadge(t.status)}</td>
                  <td>{escrowBadge(t.escrowStatus)}</td>
                  <td style={{ textAlign: "right" }}>{fmtMoney(t.quoteAmount)}</td>
                  <td style={{ textAlign: "right" }}>{fmtMoney(t.totalCharged)}</td>
                  <td style={{ textAlign: "right" }}>{fmtMoney(t.platformFee)}</td>
                  <td style={{ textAlign: "right" }}>{fmtMoney(t.sellerPayoutAmount)}</td>
                  <td style={{ fontSize: "0.8125rem", color: "var(--color-muted)" }}>
                    {new Date(t.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination meta={res.meta} sp={sp} />
    </div>
  );
}

function Pagination({
  meta,
  sp,
}: {
  meta: { page: number; totalPages: number; total: number };
  sp: { status?: string; escrowStatus?: string };
}) {
  if (meta.totalPages <= 1) {
    return (
      <p style={{ marginTop: "1rem", fontSize: "0.8125rem", color: "var(--color-muted)" }}>
        Showing {meta.total} of {meta.total}
      </p>
    );
  }
  function pageHref(p: number) {
    const qs = new URLSearchParams();
    qs.set("page", String(p));
    if (sp.status) qs.set("status", sp.status);
    if (sp.escrowStatus) qs.set("escrowStatus", sp.escrowStatus);
    return `/transactions?${qs.toString()}`;
  }
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
      <span style={{ fontSize: "0.8125rem", color: "var(--color-muted)" }}>
        Page {meta.page} of {meta.totalPages}
      </span>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        {meta.page > 1 && (
          <Link href={pageHref(meta.page - 1)} className="btn btn-outline" style={{ fontSize: "0.8125rem", padding: "0.4rem 0.85rem" }}>
            ← Prev
          </Link>
        )}
        {meta.page < meta.totalPages && (
          <Link href={pageHref(meta.page + 1)} className="btn btn-outline" style={{ fontSize: "0.8125rem", padding: "0.4rem 0.85rem" }}>
            Next →
          </Link>
        )}
      </div>
    </div>
  );
}
