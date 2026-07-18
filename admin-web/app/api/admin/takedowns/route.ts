import { NextRequest } from "next/server";
import { proxyAdminPost } from "@/lib/admin-proxy";

// POST /api/admin/takedowns → take down a copyrighted image from a post.
// Forwards to POST /api/v1/admin/takedowns (#313 endpoint): removes the image,
// blocklists its perceptual hash for staydown, and strikes the uploader.
export async function POST(req: NextRequest) {
  return proxyAdminPost(req, "/api/v1/admin/takedowns");
}
