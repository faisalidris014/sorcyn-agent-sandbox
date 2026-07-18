import Link from "next/link";
import { apiFetch } from "@/lib/api";

interface AuditLog {
  id: string;
  userId: string | null;
  actorType: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  success: boolean;
  errorMessage: string | null;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string; email: string } | null;
}

interface ListResponse {
  data: AuditLog[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{
    action?: string;
    resourceType?: string;
    userId?: string;
    page?: string;
  }>;
}) {
  const sp = await searchParams;
  const params = new URLSearchParams();
  params.set("limit", "50");
  if (sp.page) params.set("page", sp.page);
  if (sp.action) params.set("action", sp.action);
  if (sp.resourceType) params.set("resourceType", sp.resourceType);
  if (sp.userId) params.set("userId", sp.userId);

  const res = await apiFetch<ListResponse>(`/api/v1/admin/audit-logs?${params.toString()}`);
  const logs = res.data;
  const meta = res.meta;

  return (
    <div>
      <header style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.875rem", fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 0.5rem" }}>
          Audit logs
        </h1>
        <p style={{ color: "var(--color-muted)", margin: 0 }}>
          {meta.total.toLocaleString()} entries · immutable record of admin and system actions.
        </p>
      </header>

      <form
        method="get"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr) auto",
          gap: "0.625rem",
          marginBottom: "1.25rem",
          alignItems: "end",
        }}
      >
        <div>
          <label style={{ display: "block", fontSize: "0.75rem", color: "var(--color-muted)", marginBottom: "0.25rem" }}>
            Action
          </label>
          <input
            className="input"
            type="text"
            name="action"
            placeholder="e.g. user.suspend"
            defaultValue={sp.action ?? ""}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.75rem", color: "var(--color-muted)", marginBottom: "0.25rem" }}>
            Resource type
          </label>
          <input
            className="input"
            type="text"
            name="resourceType"
            placeholder="e.g. user, dispute"
            defaultValue={sp.resourceType ?? ""}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.75rem", color: "var(--color-muted)", marginBottom: "0.25rem" }}>
            User ID
          </label>
          <input
            className="input"
            type="text"
            name="userId"
            placeholder="UUID"
            defaultValue={sp.userId ?? ""}
          />
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button type="submit" className="btn btn-primary">Filter</button>
          {(sp.action || sp.resourceType || sp.userId) && (
            <Link href="/audit-logs" className="btn btn-ghost">Clear</Link>
          )}
        </div>
      </form>

      {logs.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--color-muted)" }}>
          No audit log entries match this filter.
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Resource</th>
                <th>Status</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td style={{ fontSize: "0.8125rem", color: "var(--color-muted)", whiteSpace: "nowrap" }}>
                    {new Date(l.createdAt).toLocaleString()}
                  </td>
                  <td style={{ fontSize: "0.8125rem" }}>
                    {l.user ? (
                      <>
                        <div style={{ fontWeight: 500 }}>
                          {l.user.firstName} {l.user.lastName}
                        </div>
                        <div style={{ color: "var(--color-muted)" }}>{l.user.email}</div>
                      </>
                    ) : (
                      <span style={{ color: "var(--color-muted)" }}>{l.actorType ?? "system"}</span>
                    )}
                  </td>
                  <td>
                    <code style={{ fontSize: "0.8125rem" }}>{l.action}</code>
                  </td>
                  <td style={{ fontSize: "0.8125rem" }}>
                    <div>{l.resourceType}</div>
                    {l.resourceId && (
                      <code style={{ color: "var(--color-muted)", fontSize: "0.75rem" }}>
                        {l.resourceId.slice(0, 8)}
                      </code>
                    )}
                  </td>
                  <td>
                    {l.success ? (
                      <span className="badge badge-success">ok</span>
                    ) : (
                      <span className="badge badge-danger" title={l.errorMessage ?? undefined}>
                        failed
                      </span>
                    )}
                  </td>
                  <td style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>
                    {l.ipAddress ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination meta={meta} sp={sp} />
    </div>
  );
}

function Pagination({
  meta,
  sp,
}: {
  meta: { page: number; totalPages: number; total: number };
  sp: { action?: string; resourceType?: string; userId?: string };
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
    if (sp.action) qs.set("action", sp.action);
    if (sp.resourceType) qs.set("resourceType", sp.resourceType);
    if (sp.userId) qs.set("userId", sp.userId);
    return `/audit-logs?${qs.toString()}`;
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
