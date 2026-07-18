// Shared helper for admin Route Handlers — forwards JSON POSTs to the backend
// with the access cookie injected as Bearer.
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_URL = process.env.SORCYN_API_URL ?? "http://localhost:3000";
const ACCESS_COOKIE = "sorcyn_admin_access";

export async function proxyAdminPost(
  req: NextRequest,
  upstreamPath: string,
): Promise<NextResponse> {
  const cookieStore = await cookies();
  const access = cookieStore.get(ACCESS_COOKIE)?.value;
  if (!access) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  // Body may be empty for actions that take no payload (reactivate, force-logout).
  let body: unknown = undefined;
  try {
    const text = await req.text();
    if (text) body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const upstream = await fetch(`${API_URL}${upstreamPath}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${access}`,
    },
    body: body === undefined ? "{}" : JSON.stringify(body),
  });

  const json = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    return NextResponse.json(
      {
        error:
          json?.error?.detail ??
          json?.error?.message ??
          json?.message ??
          `Upstream request failed (${upstream.status}).`,
      },
      { status: upstream.status },
    );
  }
  return NextResponse.json({ ok: true, ...(json?.data ?? {}) });
}

export async function proxyAdminDelete(
  upstreamPath: string,
): Promise<NextResponse> {
  const cookieStore = await cookies();
  const access = cookieStore.get(ACCESS_COOKIE)?.value;
  if (!access) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const upstream = await fetch(`${API_URL}${upstreamPath}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${access}`,
    },
  });

  const json = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    return NextResponse.json(
      {
        error:
          json?.error?.detail ??
          json?.error?.message ??
          json?.message ??
          `Upstream request failed (${upstream.status}).`,
      },
      { status: upstream.status },
    );
  }
  return NextResponse.json({ ok: true, ...(json?.data ?? {}) });
}
