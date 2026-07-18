"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function ClearButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function clear() {
    if (!confirm("Clear this announcement? It will disappear from the app for all users.")) {
      return;
    }
    setPending(true);
    try {
      const res = await fetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json?.error ?? "Failed to clear announcement.");
        return;
      }
      toast.success("Announcement cleared.");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      className="btn btn-danger"
      disabled={pending}
      onClick={clear}
      style={{ fontSize: "0.8125rem", padding: "0.4rem 0.85rem" }}
    >
      {pending ? "Clearing…" : "Clear"}
    </button>
  );
}
