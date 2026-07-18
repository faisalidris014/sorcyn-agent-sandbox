import Link from "next/link";
import { apiFetch } from "@/lib/api";

type DisputeStatus = "open" | "under_review" | "resolved" | "appealed" | "closed";

interface DisputeListItem {
  id: string;
  status: DisputeStatus;
  disputeType: string;
  requestedResolution: string | null;
  requestedAmount: string | null;
  openedAt: string;
  transaction: {
    id: string;
    quoteAmount: string;
    status: string;
    escrowStatus: string;
  } | null;
  openedBy: {
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  buyer: {
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

interface ListResponse {
  data: DisputeListItem[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

const STATUS_TABS: { value: DisputeStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "under_review", label: "Under review" },
  { value: "resolved", label: "Resolved" },
  { value: "appealed", label: "Appealed" },
  { value: "closed", label: "Closed" },
];

function statusBadge(status: DisputeStatus) {
  const map: Record<DisputeStatus, string> = {
    open: "badge-danger",
    under_review: "badge-warning",
    resolved: "badge-success",
    appealed: "badge-warning",
    closed: "badge-success",
  };
  return <span className={`badge ${map[status]}`}>{status.replace("_", " ")}</span>;
}

function fmtMoney(amount: string | null | undefined) {
  if (amount == null) return "—";
  const n = Number(amount);
  if (!Number.isFinite(n)) return "—";
  return `$${n.toFixed(2)}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString();
}

export default async function DisputesListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter = status && status !== "all" ? `?status=${status}` : "";
  const res = await apiFetch<ListResponse>(`/api/v1/admin/disputes${filter}`);
  const disputes = res.data;

  return (
    <div>
      <header style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.875rem", fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 0.5rem" }}>
          Disputes
        </h1>
        <p style={{ color: "var(--color-muted)", margin: 0 }}>
          Review buyer-seller disputes and resolve with refund / payout decisions.
        </p>
      </header>

      <nav style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {STATUS_TABS.map((tab) => {
          const active = (status ?? "all") === tab.value;
          const href = tab.value === "all" ? "/disputes" : `/disputes?status=${tab.value}`;
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

      {disputes.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--color-muted)" }}>
          No disputes match this filter.
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Type</th>
                <th>Opened by</th>
                <th>Transaction</th>
                <th style={{ textAlign: "right" }}>Quote</th>
                <th style={{ textAlign: "right" }}>Requested</th>
                <th>Opened</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {disputes.map((d) => (
                <tr key={d.id}>
                  <td>{statusBadge(d.status)}</td>
                  <td>{d.disputeType.replace(/_/g, " ")}</td>
                  <td>
                    {d.openedBy ? (
                      <>
                        <div style={{ fontWeight: 500 }}>
                          {d.openedBy.firstName} {d.openedBy.lastName}
                        </div>
                        <div style={{ fontSize: "0.8125rem", color: "var(--color-muted)" }}>
                          {d.openedBy.email}
                        </div>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td style={{ fontFamily: "var(--font-mono, ui-monospace)", fontSize: "0.8125rem" }}>
                    {d.transaction ? d.transaction.id.slice(0, 8) : "—"}
                  </td>
                  <td style={{ textAlign: "right" }}>{fmtMoney(d.transaction?.quoteAmount)}</td>
                  <td style={{ textAlign: "right" }}>
                    {fmtMoney(d.requestedAmount)}
                    {d.requestedResolution && (
                      <div style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>
                        {d.requestedResolution.replace(/_/g, " ")}
                      </div>
                    )}
                  </td>
                  <td style={{ fontSize: "0.8125rem", color: "var(--color-muted)" }}>{fmtDate(d.openedAt)}</td>
                  <td style={{ textAlign: "right" }}>
                    <Link
                      href={`/disputes/${d.id}`}
                      className="btn btn-outline"
                      style={{ fontSize: "0.8125rem", padding: "0.35rem 0.75rem" }}
                    >
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ marginTop: "1rem", fontSize: "0.8125rem", color: "var(--color-muted)" }}>
        Showing {disputes.length} of {res.meta.total}
      </p>
    </div>
  );
}
