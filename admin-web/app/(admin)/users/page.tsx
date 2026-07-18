import Link from "next/link";
import { apiFetch } from "@/lib/api";

interface UserRow {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  accountType: "buyer" | "seller" | "both";
  status: "active" | "suspended" | "banned" | "deleted";
  isAdmin: boolean;
  emailVerified: boolean;
  locationCity: string | null;
  locationState: string | null;
  createdAt: string;
  lastLoginAt: string | null;
}

interface ListResponse {
  data: UserRow[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

function statusBadge(status: UserRow["status"]) {
  const cls =
    status === "active"
      ? "badge-success"
      : status === "suspended"
        ? "badge-warning"
        : "badge-danger";
  return <span className={`badge ${cls}`}>{status}</span>;
}

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "banned", label: "Banned" },
] as const;

export default async function UsersListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const params = new URLSearchParams();
  params.set("limit", "25");
  if (sp.page) params.set("page", sp.page);
  if (sp.status && sp.status !== "all") params.set("status", sp.status);
  if (sp.search) params.set("search", sp.search);

  const res = await apiFetch<ListResponse>(`/api/v1/admin/users?${params.toString()}`);
  const users = res.data;
  const meta = res.meta;

  return (
    <div>
      <header style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.875rem", fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 0.5rem" }}>
          Users
        </h1>
        <p style={{ color: "var(--color-muted)", margin: 0 }}>
          {meta.total.toLocaleString()} total users · search, suspend, ban, or reactivate accounts.
        </p>
      </header>

      <form
        method="get"
        style={{
          display: "flex",
          gap: "0.625rem",
          marginBottom: "1rem",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <input
          className="input"
          type="text"
          name="search"
          placeholder="Search by name or email"
          defaultValue={sp.search ?? ""}
          style={{ flex: "1 1 280px", maxWidth: 360 }}
        />
        {sp.status && sp.status !== "all" && <input type="hidden" name="status" value={sp.status} />}
        <button type="submit" className="btn btn-primary">Search</button>
        {sp.search && (
          <Link href="/users" className="btn btn-ghost">Clear</Link>
        )}
      </form>

      <nav style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {STATUS_TABS.map((tab) => {
          const active = (sp.status ?? "all") === tab.value;
          const qs = new URLSearchParams();
          if (tab.value !== "all") qs.set("status", tab.value);
          if (sp.search) qs.set("search", sp.search);
          const href = `/users${qs.toString() ? `?${qs.toString()}` : ""}`;
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

      {users.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--color-muted)" }}>
          No users match this filter.
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Type</th>
                <th>Status</th>
                <th>Location</th>
                <th>Joined</th>
                <th>Last login</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 500 }}>
                    {u.firstName} {u.lastName}
                    {u.isAdmin && (
                      <span className="badge badge-primary" style={{ marginLeft: "0.4rem", fontSize: "0.6875rem" }}>
                        admin
                      </span>
                    )}
                  </td>
                  <td style={{ fontSize: "0.8125rem" }}>
                    {u.email}
                    {!u.emailVerified && (
                      <span style={{ fontSize: "0.6875rem", color: "var(--color-warning)", marginLeft: "0.4rem" }}>
                        unverified
                      </span>
                    )}
                  </td>
                  <td>{u.accountType}</td>
                  <td>{statusBadge(u.status)}</td>
                  <td style={{ fontSize: "0.8125rem", color: "var(--color-muted)" }}>
                    {u.locationCity ? `${u.locationCity}, ${u.locationState ?? ""}` : "—"}
                  </td>
                  <td style={{ fontSize: "0.8125rem", color: "var(--color-muted)" }}>
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ fontSize: "0.8125rem", color: "var(--color-muted)" }}>
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : "—"}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <Link
                      href={`/users/${u.id}`}
                      className="btn btn-outline"
                      style={{ fontSize: "0.8125rem", padding: "0.35rem 0.75rem" }}
                    >
                      Manage
                    </Link>
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
  sp: { status?: string; search?: string };
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
    if (sp.search) qs.set("search", sp.search);
    return `/users?${qs.toString()}`;
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
