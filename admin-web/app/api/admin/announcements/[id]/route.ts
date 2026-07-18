import { proxyAdminDelete } from "@/lib/admin-proxy";

// DELETE /api/admin/announcements/:id → clear an announcement banner.
// Forwards to DELETE /api/v1/admin/announcements/:id (#85 endpoint).
export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return proxyAdminDelete(`/api/v1/admin/announcements/${id}`);
}
