import { NextRequest, NextResponse } from "next/server";
import { decodeAdminTokenClaims } from "@/lib/jwt";

const API_URL = process.env.SORCYN_API_URL ?? "http://localhost:3000";

const ACCESS_COOKIE = "sorcyn_admin_access";
const REFRESH_COOKIE = "sorcyn_admin_refresh";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, password } = body ?? {};
  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 },
    );
  }

  const upstream = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const upstreamBody = await upstream.json().catch(() => ({}));

  if (!upstream.ok) {
    return NextResponse.json(
      {
        error:
          upstreamBody?.error?.detail ??
          upstreamBody?.error?.message ??
          "Invalid email or password.",
      },
      { status: upstream.status },
    );
  }

  const data = upstreamBody?.data;
  const user = data?.user;
  const tokens = data?.tokens;

  // Backend strips isAdmin from response bodies — read it from the JWT claim.
  const claims = tokens?.accessToken ? decodeAdminTokenClaims(tokens.accessToken) : null;
  if (!claims?.isAdmin) {
    return NextResponse.json(
      {
        error:
          "This account is not authorized for the admin console. Please sign in with an admin account.",
      },
      { status: 403 },
    );
  }

  const res = NextResponse.json({ ok: true, user: { ...user, isAdmin: true } });

  // 15 min access cookie, 30 day refresh cookie. SameSite=lax so the cookie
  // survives top-level navigation back from any external Stripe / OAuth hop.
  res.cookies.set({
    name: ACCESS_COOKIE,
    value: tokens.accessToken,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 15,
  });
  res.cookies.set({
    name: REFRESH_COOKIE,
    value: tokens.refreshToken,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return res;
}
