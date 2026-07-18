// Lightweight JWT claim decoder. We do NOT verify the signature here — the
// backend re-verifies on every API call. This is only used to read the
// `isAdmin` claim out of the access token so the admin-web can gate UI access.

interface AdminTokenClaims {
  sub: string;
  email?: string;
  isAdmin?: boolean;
  exp?: number;
}

export function decodeAdminTokenClaims(token: string): AdminTokenClaims | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    const json =
      typeof atob === "function"
        ? atob(padded)
        : Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(json) as AdminTokenClaims;
  } catch {
    return null;
  }
}

export function isAdminToken(token: string | undefined | null): boolean {
  if (!token) return false;
  return decodeAdminTokenClaims(token)?.isAdmin === true;
}
