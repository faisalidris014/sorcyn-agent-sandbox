import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { apiFetch, ApiError } from "@/lib/api";
import { requireSession } from "@/lib/session";
import { decodeAdminTokenClaims } from "@/lib/jwt";

interface MeResponse {
  data: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  // isAdmin only lives in the JWT claim; the user payload doesn't carry it.
  const claims = decodeAdminTokenClaims(session.accessToken);
  if (!claims?.isAdmin) redirect("/login");

  let me: MeResponse["data"] | null = null;
  try {
    const res = await apiFetch<MeResponse>("/api/v1/users/me");
    me = res.data;
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      redirect("/login");
    }
    throw err;
  }

  if (!me) redirect("/login");

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "240px 1fr",
        minHeight: "100dvh",
      }}
    >
      <Sidebar adminName={`${me.firstName} ${me.lastName}`} />
      <main style={{ padding: "2rem 2.5rem", overflow: "auto" }}>{children}</main>
    </div>
  );
}
