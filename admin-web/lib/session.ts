// Session helpers — read/clear the admin session cookies on the server.
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "./api";

export interface AdminSession {
  accessToken: string;
  refreshToken: string;
}

export async function getSession(): Promise<AdminSession | null> {
  const store = await cookies();
  const access = store.get(ACCESS_COOKIE)?.value;
  const refresh = store.get(REFRESH_COOKIE)?.value;
  if (!access || !refresh) return null;
  return { accessToken: access, refreshToken: refresh };
}

export async function requireSession(): Promise<AdminSession> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}
