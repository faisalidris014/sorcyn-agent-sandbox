import { apiFetch } from "@/lib/api";

interface Stats {
  totalUsers: number;
  activeUsers: number;
  totalSellers: number;
  totalTransactions: number;
  totalRevenue: number;
  pendingVerifications: number;
  openDisputes: number;
  flaggedReviews: number;
  flaggedMessages: number;
}

interface StatsResponse {
  data: Stats;
}

function StatCard({
  label,
  value,
  emphasis,
  href,
}: {
  label: string;
  value: string | number;
  emphasis?: "primary" | "warning" | "danger";
  href?: string;
}) {
  const colorMap = {
    primary: "var(--color-primary)",
    warning: "var(--color-warning)",
    danger: "var(--color-danger)",
  };
  const valueColor = emphasis ? colorMap[emphasis] : "var(--color-fg)";

  const body = (
    <>
      <div
        style={{
          fontSize: "0.75rem",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          color: "var(--color-muted)",
          marginBottom: "0.625rem",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "1.875rem",
          fontWeight: 700,
          letterSpacing: "-0.02em",
          color: valueColor,
        }}
      >
        {value}
      </div>
    </>
  );

  return href ? (
    <a
      href={href}
      className="card"
      style={{ textDecoration: "none", color: "inherit", display: "block" }}
    >
      {body}
    </a>
  ) : (
    <div className="card">{body}</div>
  );
}

export default async function DashboardPage() {
  const stats = (await apiFetch<StatsResponse>("/api/v1/admin/stats")).data;

  return (
    <div>
      <header style={{ marginBottom: "2rem" }}>
        <h1
          style={{
            fontSize: "1.875rem",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            margin: "0 0 0.5rem",
          }}
        >
          Dashboard
        </h1>
        <p style={{ color: "var(--color-muted)", margin: 0 }}>
          Marketplace health at a glance.
        </p>
      </header>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        <StatCard label="Total users" value={stats.totalUsers.toLocaleString()} />
        <StatCard label="Active users" value={stats.activeUsers.toLocaleString()} />
        <StatCard label="Sellers" value={stats.totalSellers.toLocaleString()} />
        <StatCard
          label="Revenue (MTD platform fees)"
          value={`$${stats.totalRevenue.toFixed(2)}`}
          emphasis="primary"
        />
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
        <StatCard label="Transactions" value={stats.totalTransactions.toLocaleString()} />
        <StatCard
          label="Pending verifications"
          value={stats.pendingVerifications}
          emphasis={stats.pendingVerifications > 0 ? "warning" : undefined}
          href="/verifications"
        />
        <StatCard
          label="Open disputes"
          value={stats.openDisputes}
          emphasis={stats.openDisputes > 0 ? "danger" : undefined}
          href="/disputes"
        />
        <StatCard
          label="Flagged content"
          value={stats.flaggedReviews + stats.flaggedMessages}
          emphasis={stats.flaggedReviews + stats.flaggedMessages > 0 ? "warning" : undefined}
          href="/moderation"
        />
      </section>
    </div>
  );
}
