import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_URL = process.env.SORCYN_API_URL ?? "http://localhost:3000";
const ACCESS_COOKIE = "sorcyn_admin_access";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const cookieStore = await cookies();
  const access = cookieStore.get(ACCESS_COOKIE)?.value;
  if (!access) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));

  const upstream = await fetch(`${API_URL}/api/v1/admin/disputes/${id}/resolve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${access}`,
    },
    body: JSON.stringify(body),
  });

  const json = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    return NextResponse.json(
      {
        error:
          json?.error?.detail ??
          json?.error?.message ??
          json?.message ??
          "Failed to resolve dispute.",
      },
      { status: upstream.status },
    );
  }
  return NextResponse.json({ ok: true, data: json?.data });
}
