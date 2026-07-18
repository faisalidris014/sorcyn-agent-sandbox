"use client";

import { Suspense, useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Logo } from "@/components/branding/logo";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error ?? "Sign in failed.");
        return;
      }
      toast.success(`Welcome, ${data.user?.firstName ?? "admin"}.`);
      router.replace(from);
      router.refresh();
    } catch {
      toast.error("Network error. Check the API is running on :3000.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: "2rem 1rem",
        background:
          "radial-gradient(ellipse at top, rgba(124, 58, 237, 0.06), transparent 60%), #fff",
      }}
    >
      <div className="card" style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <Logo size={56} />
          <h1
            style={{
              margin: "1rem 0 0.375rem",
              fontSize: "1.5rem",
              fontWeight: 700,
              letterSpacing: "-0.02em",
            }}
          >
            Sorcyn Admin
          </h1>
          <p style={{ color: "var(--color-muted)", margin: 0 }}>
            Sign in with an admin account.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}
        >
          <div>
            <label
              htmlFor="email"
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: 600,
                marginBottom: "0.375rem",
              }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              className="input"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@reversemarketplace.com"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: 600,
                marginBottom: "0.375rem",
              }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              className="input"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting || !email || !password}
            style={{ marginTop: "0.5rem", padding: "0.75rem 1.25rem" }}
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
