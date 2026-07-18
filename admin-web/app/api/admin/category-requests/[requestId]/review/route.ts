import { NextRequest } from "next/server";
import { proxyAdminPost } from "@/lib/admin-proxy";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ requestId: string }> },
) {
  const { requestId } = await context.params;
  return proxyAdminPost(req, `/api/v1/admin/category-requests/${requestId}/review`);
}
