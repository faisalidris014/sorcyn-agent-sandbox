"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Logo } from "@/components/branding/logo";

const NAV = [
  { href: "/", label: "Dashboard", icon: "▦" },
  { href: "/announcements", label: "Announcements", icon: "📣" },
  { href: "/users", label: "Users", icon: "◐" },
  { href: "/disputes", label: "Disputes", icon: "⚖" },
  { href: "/verifications", label: "Verifications", icon: "✓" },
  { href: "/category-requests", label: "Category requests", icon: "🗂" },
  { href: "/moderation", label: "Moderation", icon: "⊘" },
  { href: "/transactions", label: "Transactions", icon: "⇄" },
  { href: "/audit-logs", label: "Audit logs", icon: "≡" },
];

export function Sidebar({ adminName }: { adminName?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    toast.success("Signed out.");
    router.replace("/login");
    router.refresh();
  }

  return (
    <aside
      style={{
        width: 240,
        background: "var(--color-surface)",
        borderRight: "1px solid var(--color-border)",
        display: "flex",
        flexDirection: "column",
        position: "sticky",
        top: 0,
        height: "100dvh",
      }}
    >
      <div style={{ padding: "1.5rem 1.25rem 1rem" }}>
        <Logo size={36} withWordmark />
      </div>

      <nav
        style={{
          flex: 1,
          padding: "0.5rem 0.75rem",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {NAV.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.625rem 0.875rem",
                borderRadius: "0.625rem",
                fontWeight: 500,
                fontSize: "0.9375rem",
                color: active ? "#fff" : "var(--color-fg)",
                background: active
                  ? "linear-gradient(135deg, var(--color-primary), var(--color-primary-soft))"
                  : "transparent",
                textDecoration: "none",
                transition: "background 120ms ease",
                boxShadow: active ? "var(--shadow-primary)" : "none",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 20,
                  display: "inline-grid",
                  placeItems: "center",
                  fontSize: "0.875rem",
                  opacity: active ? 1 : 0.7,
                }}
              >
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div
        style={{
          padding: "1rem 1.25rem",
          borderTop: "1px solid var(--color-border)",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}
      >
        {adminName && (
          <div style={{ fontSize: "0.8125rem", color: "var(--color-muted)" }}>
            Signed in as <strong style={{ color: "var(--color-fg)" }}>{adminName}</strong>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="btn btn-ghost"
          style={{ width: "100%", padding: "0.5rem 0.75rem", justifyContent: "flex-start" }}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
