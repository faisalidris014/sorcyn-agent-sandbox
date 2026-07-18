// Server-side admin API client. Reads JWT from httpOnly cookie.
import { cookies } from "next/headers";

const API_URL =
  process.env.SORCYN_API_URL ?? "http://localhost:3000";

export const ACCESS_COOKIE = "sorcyn_admin_access";
export const REFRESH_COOKIE = "sorcyn_admin_refresh";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/**
 * Server-side fetch with automatic Bearer-token injection from cookie.
 * Throws ApiError on non-2xx.
 */
export async function apiFetch<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const cookieStore = await cookies();
  const access = cookieStore.get(ACCESS_COOKIE)?.value;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  if (access) headers["Authorization"] = `Bearer ${access}`;

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      detail = body?.error?.detail ?? body?.error?.message ?? body?.message ?? detail;
    } catch {
      // Body not JSON — keep generic detail
    }
    throw new ApiError(res.status, detail);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/**
 * Same as apiFetch, but returns the raw Response so the caller can inspect
 * headers / status without throwing on non-2xx.
 */
export async function apiRequest(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const cookieStore = await cookies();
  const access = cookieStore.get(ACCESS_COOKIE)?.value;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  if (access) headers["Authorization"] = `Bearer ${access}`;
  return fetch(`${API_URL}${path}`, { ...init, headers, cache: "no-store" });
}

export { API_URL };
