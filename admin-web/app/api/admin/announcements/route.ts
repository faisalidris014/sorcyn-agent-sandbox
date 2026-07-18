import { NextRequest } from "next/server";
import { proxyAdminPost } from "@/lib/admin-proxy";

// POST /api/admin/announcements → create an announcement banner.
// Forwards to POST /api/v1/admin/announcements (#85 endpoint).
export async function POST(req: NextRequest) {
  return proxyAdminPost(req, "/api/v1/admin/announcements");
}
