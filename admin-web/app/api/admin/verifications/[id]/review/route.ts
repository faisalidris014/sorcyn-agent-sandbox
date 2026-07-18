import { NextRequest } from "next/server";
import { proxyAdminPost } from "@/lib/admin-proxy";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return proxyAdminPost(req, `/api/v1/admin/verifications/${id}/review`);
}
