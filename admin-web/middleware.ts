import { NextResponse, type NextRequest } from "next/server";
import { decodeAdminTokenClaims } from "@/lib/jwt";

const API_URL = process.env.SORCYN_API_URL ?? "http://localhost:3000";

const ACCESS_COOKIE = "sorcyn_admin_access";
const REFRESH_COOKIE = "sorcyn_admin_refresh";

const PUBLIC_PATHS = ["/login"];

// Refresh access tokens that have <60s of life remaining, so server-component
// fetches never observe an expired token mid-render.
const REFRESH_BUFFER_SECONDS = 60;

interface RefreshSuccess {
  success: true;
  data: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

async function tryRefresh(refreshToken: string): Promise<RefreshSuccess["data"] | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const body = (await res.json()) as RefreshSuccess;
    return body?.data ?? null;
  } catch {
    return null;
  }
}

function setAuthCookies(response: NextResponse, tokens: RefreshSuccess["data"]) {
  const isProd = process.env.NODE_ENV === "production";
  response.cookies.set({
    name: ACCESS_COOKIE,
    value: tokens.accessToken,
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: 60 * 15,
  });
  response.cookies.set({
    name: REFRESH_COOKIE,
    value: tokens.refreshToken,
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

function clearAuthCookies(response: NextResponse) {
  response.cookies.delete(ACCESS_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;

  // Public routes: redirect signed-in admins away from /login.
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    if (access && pathname === "/login") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Admin routes require an access cookie.
  if (!access) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If the access token is expiring (or already expired), refresh before
  // forwarding the request so the next downstream fetch sees a fresh token.
  const claims = decodeAdminTokenClaims(access);
  const nowSec = Math.floor(Date.now() / 1000);
  const expiresSoon = !claims?.exp || claims.exp - nowSec < REFRESH_BUFFER_SECONDS;

  if (expiresSoon && refresh) {
    const tokens = await tryRefresh(refresh);
    if (!tokens) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      const res = NextResponse.redirect(loginUrl);
      clearAuthCookies(res);
      return res;
    }
    // Forward the request with the new access cookie injected so downstream
    // server-component fetches see the refreshed token immediately.
    const forwardHeaders = new Headers(request.headers);
    const newCookieHeader = request.headers
      .get("cookie")
      ?.split(";")
      .map((c) => c.trim())
      .filter((c) => !c.startsWith(`${ACCESS_COOKIE}=`) && !c.startsWith(`${REFRESH_COOKIE}=`))
      .concat([`${ACCESS_COOKIE}=${tokens.accessToken}`, `${REFRESH_COOKIE}=${tokens.refreshToken}`])
      .join("; ");
    if (newCookieHeader) forwardHeaders.set("cookie", newCookieHeader);
    const res = NextResponse.next({ request: { headers: forwardHeaders } });
    setAuthCookies(res, tokens);
    return res;
  }

  return NextResponse.next();
}

export const config = {
  // Skip Next internals, static assets, and API auth routes (login posts before cookie exists).
  matcher: ["/((?!_next/static|_next/image|favicon|api/auth).*)"],
};
