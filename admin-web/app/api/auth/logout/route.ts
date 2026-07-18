import { NextResponse } from "next/server";

const API_URL = process.env.SORCYN_API_URL ?? "http://localhost:3000";
const ACCESS_COOKIE = "sorcyn_admin_access";
const REFRESH_COOKIE = "sorcyn_admin_refresh";

export async function POST(req: Request) {
  const access = req.headers
    .get("cookie")
    ?.split(";")
    .find((c) => c.trim().startsWith(`${ACCESS_COOKIE}=`))
    ?.split("=")[1];
  const refresh = req.headers
    .get("cookie")
    ?.split(";")
    .find((c) => c.trim().startsWith(`${REFRESH_COOKIE}=`))
    ?.split("=")[1];

  // Best-effort upstream logout (revokes the refresh token in Redis).
  if (access && refresh) {
    await fetch(`${API_URL}/api/v1/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access}`,
      },
      body: JSON.stringify({ refreshToken: refresh }),
    }).catch(() => {
      // Don't fail the local cookie clear if upstream is unavailable
    });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: ACCESS_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  res.cookies.set({
    name: REFRESH_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}
