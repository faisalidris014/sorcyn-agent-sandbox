import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { UserActions } from "./user-actions";

interface UserDetail {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  phoneVerified: boolean;
  emailVerified: boolean;
  accountType: "buyer" | "seller" | "both";
  status: "active" | "suspended" | "banned" | "deleted";
  isAdmin: boolean;
  strikeCount: number;
  locationCity: string | null;
  locationState: string | null;
  locationZip: string | null;
  locationCountry: string | null;
  bio: string | null;
  rating: number | string | null;
  totalReviews: number;
  totalTransactions: number;
  stripeCustomerId: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  sessionVersion: number;
  sellerProfile: {
    id: string;
    businessName: string | null;
    categories: string[];
    serviceRadius: number | null;
    isVerified: boolean;
  } | null;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: "1rem",
        padding: "0.5rem 0",
        borderBottom: "1px solid var(--color-border)",
        fontSize: "0.875rem",
      }}
    >
      <span style={{ color: "var(--color-muted)" }}>{label}</span>
      <span style={{ fontWeight: 500, textAlign: "right", wordBreak: "break-word" }}>{value}</span>
    </div>
  );
}

function statusBadge(status: UserDetail["status"]) {
  const cls =
    status === "active"
      ? "badge-success"
      : status === "suspended"
        ? "badge-warning"
        : "badge-danger";
  return <span className={`badge ${cls}`}>{status}</span>;
}

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await apiFetch<{ data: UserDetail }>(`/api/v1/admin/users/${id}`);
  const u = res.data;

  return (
    <div>
      <div style={{ marginBottom: "1.25rem" }}>
        <Link href="/users" style={{ color: "var(--color-muted)", fontSize: "0.875rem", textDecoration: "none" }}>
          ← Back to users
        </Link>
      </div>

      <header style={{ marginBottom: "1.5rem", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 0.25rem" }}>
            {u.firstName} {u.lastName}
            {u.isAdmin && (
              <span className="badge badge-primary" style={{ marginLeft: "0.625rem", fontSize: "0.75rem", verticalAlign: "middle" }}>
                admin
              </span>
            )}
          </h1>
          <p style={{ color: "var(--color-muted)", margin: 0, fontSize: "0.875rem" }}>
            {u.email} · joined {new Date(u.createdAt).toLocaleDateString()}
          </p>
        </div>
        {statusBadge(u.status)}
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "1.5rem", alignItems: "start" }}>
        <div>
          <section className="card" style={{ marginBottom: "1rem" }}>
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "0.9375rem", fontWeight: 600 }}>Account</h3>
            <DetailRow label="ID" value={<code style={{ fontSize: "0.75rem" }}>{u.id}</code>} />
            <DetailRow label="Account type" value={u.accountType} />
            <DetailRow label="Email" value={<>{u.email} {u.emailVerified ? <span className="badge badge-success" style={{ fontSize: "0.6875rem" }}>verified</span> : <span className="badge badge-warning" style={{ fontSize: "0.6875rem" }}>unverified</span>}</>} />
            <DetailRow label="Phone" value={u.phone ? <>{u.phone} {u.phoneVerified ? <span className="badge badge-success" style={{ fontSize: "0.6875rem" }}>verified</span> : <span className="badge badge-warning" style={{ fontSize: "0.6875rem" }}>unverified</span>}</> : "—"} />
            <DetailRow label="Location" value={u.locationCity ? `${u.locationCity}, ${u.locationState ?? ""} ${u.locationZip ?? ""}` : "—"} />
            <DetailRow label="Last login" value={u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "—"} />
            <DetailRow label="Session version" value={u.sessionVersion} />
            <DetailRow
              label="Copyright strikes"
              value={
                u.strikeCount > 0 ? (
                  <span className={`badge ${u.strikeCount >= 3 ? "badge-danger" : "badge-warning"}`}>
                    {u.strikeCount}
                  </span>
                ) : (
                  0
                )
              }
            />
          </section>

          {u.sellerProfile && (
            <section className="card" style={{ marginBottom: "1rem" }}>
              <h3 style={{ margin: "0 0 0.5rem", fontSize: "0.9375rem", fontWeight: 600 }}>Seller profile</h3>
              <DetailRow label="Business name" value={u.sellerProfile.businessName ?? "—"} />
              <DetailRow label="Verified" value={u.sellerProfile.isVerified ? "Yes" : "No"} />
              <DetailRow label="Service radius" value={u.sellerProfile.serviceRadius ? `${u.sellerProfile.serviceRadius} mi` : "—"} />
              <DetailRow label="Categories" value={u.sellerProfile.categories?.length ?? 0} />
            </section>
          )}

          {u.bio && (
            <section className="card">
              <h3 style={{ margin: "0 0 0.5rem", fontSize: "0.9375rem", fontWeight: 600 }}>Bio</h3>
              <p style={{ margin: 0, fontSize: "0.875rem", lineHeight: 1.5 }}>{u.bio}</p>
            </section>
          )}
        </div>

        <div>
          <section className="card" style={{ marginBottom: "1rem" }}>
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "0.9375rem", fontWeight: 600 }}>Activity</h3>
            <DetailRow label="Reviews" value={u.totalReviews} />
            <DetailRow label="Transactions" value={u.totalTransactions} />
            <DetailRow label="Rating" value={u.rating ? Number(u.rating).toFixed(2) : "—"} />
            <DetailRow label="Stripe customer" value={u.stripeCustomerId ? <code style={{ fontSize: "0.75rem" }}>{u.stripeCustomerId}</code> : "—"} />
          </section>

          <UserActions userId={u.id} status={u.status} isAdmin={u.isAdmin} />
        </div>
      </div>
    </div>
  );
}
