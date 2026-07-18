import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { ResolveDisputeForm } from "./resolve-form";

interface EvidenceItem {
  url: string;
  type: string;
  description?: string;
}

interface DisputeDetail {
  id: string;
  status: string;
  disputeType: string;
  description: string | null;
  requestedResolution: string | null;
  requestedAmount: string | null;
  buyerEvidence: EvidenceItem[] | null;
  sellerEvidence: EvidenceItem[] | null;
  refundAmount: string | null;
  sellerPayoutAmount: string | null;
  resolutionSummary: string | null;
  outcome: string | null;
  openedAt: string;
  evidenceDeadline: string | null;
  resolvedAt: string | null;
  transaction: {
    id: string;
    quoteAmount: string;
    totalCharged: string;
    platformFee: string;
    sellerPayoutAmount: string;
    status: string;
    escrowStatus: string;
    escrowReleasedAt: string | null;
    beforePhotos: string[];
    afterPhotos: string[];
    completionNotes: string | null;
  } | null;
  openedBy: { id: string; firstName: string; lastName: string; email: string } | null;
  buyer: { id: string; firstName: string; lastName: string; email: string } | null;
}

function fmtMoney(amount: string | null | undefined) {
  if (amount == null) return "—";
  const n = Number(amount);
  if (!Number.isFinite(n)) return "—";
  return `$${n.toFixed(2)}`;
}

function EvidencePanel({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: EvidenceItem[] | null;
  emptyLabel: string;
}) {
  return (
    <section className="card" style={{ marginBottom: "1rem" }}>
      <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.9375rem", fontWeight: 600 }}>{title}</h3>
      {!items || items.length === 0 ? (
        <p style={{ color: "var(--color-muted)", fontSize: "0.875rem", margin: 0 }}>{emptyLabel}</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "0.625rem" }}>
          {items.map((ev, i) => (
            <a
              key={`${ev.url}-${i}`}
              href={ev.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                border: "1px solid var(--color-border)",
                borderRadius: "0.5rem",
                overflow: "hidden",
                textDecoration: "none",
                color: "inherit",
                background: "var(--color-surface)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ev.url}
                alt={ev.description ?? ev.type}
                style={{ width: "100%", height: 100, objectFit: "cover", display: "block", background: "var(--color-bg)" }}
              />
              <div style={{ padding: "0.4rem 0.5rem", fontSize: "0.75rem", color: "var(--color-muted)" }}>
                {ev.description ?? ev.type}
              </div>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid var(--color-border)", fontSize: "0.875rem" }}>
      <span style={{ color: "var(--color-muted)" }}>{label}</span>
      <span style={{ fontWeight: 500, textAlign: "right" }}>{value}</span>
    </div>
  );
}

export default async function DisputeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await apiFetch<{ data: DisputeDetail }>(`/api/v1/admin/disputes/${id}`);
  const d = res.data;

  const isResolved = d.status === "resolved" || d.status === "closed";

  return (
    <div>
      <div style={{ marginBottom: "1.25rem" }}>
        <Link href="/disputes" style={{ color: "var(--color-muted)", fontSize: "0.875rem", textDecoration: "none" }}>
          ← Back to disputes
        </Link>
      </div>

      <header style={{ marginBottom: "1.5rem", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 0.25rem" }}>
            Dispute #{d.id.slice(0, 8)}
          </h1>
          <p style={{ color: "var(--color-muted)", margin: 0, fontSize: "0.875rem" }}>
            {d.disputeType.replace(/_/g, " ")} · opened {new Date(d.openedAt).toLocaleString()}
          </p>
        </div>
        <span className={`badge ${d.status === "open" ? "badge-danger" : d.status === "resolved" || d.status === "closed" ? "badge-success" : "badge-warning"}`}>
          {d.status.replace(/_/g, " ")}
        </span>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "1.5rem", alignItems: "start" }}>
        {/* LEFT: evidence + context */}
        <div>
          <section className="card" style={{ marginBottom: "1rem" }}>
            <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.9375rem", fontWeight: 600 }}>Dispute description</h3>
            <p style={{ margin: 0, fontSize: "0.9375rem", lineHeight: 1.55 }}>
              {d.description ?? <em style={{ color: "var(--color-muted)" }}>No description provided.</em>}
            </p>
          </section>

          <EvidencePanel title="Buyer evidence" items={d.buyerEvidence} emptyLabel="No buyer evidence submitted." />
          <EvidencePanel title="Seller evidence" items={d.sellerEvidence} emptyLabel="No seller rebuttal submitted." />

          {d.transaction && (d.transaction.beforePhotos.length > 0 || d.transaction.afterPhotos.length > 0) && (
            <section className="card">
              <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.9375rem", fontWeight: 600 }}>Transaction photos</h3>
              {d.transaction.beforePhotos.length > 0 && (
                <>
                  <div style={{ fontSize: "0.8125rem", color: "var(--color-muted)", marginBottom: "0.4rem" }}>Before</div>
                  <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
                    {d.transaction.beforePhotos.map((url, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={`b-${i}`} src={url} alt="" style={{ width: 100, height: 80, objectFit: "cover", borderRadius: "0.4rem", border: "1px solid var(--color-border)" }} />
                    ))}
                  </div>
                </>
              )}
              {d.transaction.afterPhotos.length > 0 && (
                <>
                  <div style={{ fontSize: "0.8125rem", color: "var(--color-muted)", marginBottom: "0.4rem" }}>After</div>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    {d.transaction.afterPhotos.map((url, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={`a-${i}`} src={url} alt="" style={{ width: 100, height: 80, objectFit: "cover", borderRadius: "0.4rem", border: "1px solid var(--color-border)" }} />
                    ))}
                  </div>
                </>
              )}
              {d.transaction.completionNotes && (
                <p style={{ marginTop: "0.75rem", marginBottom: 0, fontSize: "0.875rem", color: "var(--color-muted)" }}>
                  Completion notes: {d.transaction.completionNotes}
                </p>
              )}
            </section>
          )}
        </div>

        {/* RIGHT: facts + resolve form */}
        <div>
          <section className="card" style={{ marginBottom: "1rem" }}>
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "0.9375rem", fontWeight: 600 }}>Parties</h3>
            <DetailRow
              label="Opened by"
              value={d.openedBy ? <>{d.openedBy.firstName} {d.openedBy.lastName}<br /><span style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>{d.openedBy.email}</span></> : "—"}
            />
            <DetailRow
              label="Buyer"
              value={d.buyer ? <>{d.buyer.firstName} {d.buyer.lastName}<br /><span style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>{d.buyer.email}</span></> : "—"}
            />
            <DetailRow
              label="Requested"
              value={
                d.requestedResolution
                  ? <>{d.requestedResolution.replace(/_/g, " ")} · {fmtMoney(d.requestedAmount)}</>
                  : "—"
              }
            />
            <DetailRow
              label="Evidence deadline"
              value={d.evidenceDeadline ? new Date(d.evidenceDeadline).toLocaleDateString() : "—"}
            />
          </section>

          {d.transaction && (
            <section className="card" style={{ marginBottom: "1rem" }}>
              <h3 style={{ margin: "0 0 0.5rem", fontSize: "0.9375rem", fontWeight: 600 }}>Transaction</h3>
              <DetailRow label="ID" value={<code style={{ fontSize: "0.75rem" }}>{d.transaction.id.slice(0, 12)}</code>} />
              <DetailRow label="Quote" value={fmtMoney(d.transaction.quoteAmount)} />
              <DetailRow label="Total charged" value={fmtMoney(d.transaction.totalCharged)} />
              <DetailRow label="Platform fee" value={fmtMoney(d.transaction.platformFee)} />
              <DetailRow label="Seller payout" value={fmtMoney(d.transaction.sellerPayoutAmount)} />
              <DetailRow label="Status" value={d.transaction.status} />
              <DetailRow label="Escrow" value={d.transaction.escrowStatus} />
              {d.transaction.escrowReleasedAt && (
                <DetailRow
                  label="Escrow released"
                  value={new Date(d.transaction.escrowReleasedAt).toLocaleDateString()}
                />
              )}
            </section>
          )}

          {isResolved ? (
            <section className="card">
              <h3 style={{ margin: "0 0 0.5rem", fontSize: "0.9375rem", fontWeight: 600 }}>Resolution</h3>
              <DetailRow label="Outcome" value={d.outcome ? d.outcome.replace(/_/g, " ") : "—"} />
              <DetailRow label="Refund amount" value={fmtMoney(d.refundAmount)} />
              <DetailRow label="Resolved at" value={d.resolvedAt ? new Date(d.resolvedAt).toLocaleString() : "—"} />
              <p style={{ margin: "0.75rem 0 0", fontSize: "0.875rem", lineHeight: 1.5 }}>
                {d.resolutionSummary ?? <em style={{ color: "var(--color-muted)" }}>No summary recorded.</em>}
              </p>
              {d.transaction?.escrowStatus === "released" && (
                <p style={{ marginTop: "0.75rem", marginBottom: 0, fontSize: "0.8125rem", color: "var(--color-warning)" }}>
                  Note: escrow was already released. Refunds recorded here are accounting-only and don&apos;t reverse the Stripe Transfer.
                </p>
              )}
            </section>
          ) : (
            <ResolveDisputeForm
              disputeId={d.id}
              quoteAmount={d.transaction?.quoteAmount ?? null}
              requestedAmount={d.requestedAmount}
              postReleaseWarning={d.transaction?.escrowStatus === "released"}
            />
          )}
        </div>
      </div>
    </div>
  );
}
