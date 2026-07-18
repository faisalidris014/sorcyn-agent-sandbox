"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

// Admin copyright takedown (#313). Removes a specific image from a post, blocklists
// its perceptual hash (staydown), and strikes the uploader — suspending them at the
// strike threshold. The admin supplies the post id + the exact photo URL.
export function TakedownForm() {
  const router = useRouter();
  const [postId, setPostId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);

  async function submit() {
    if (!postId.trim() || !imageUrl.trim()) {
      toast.error("Post ID and image URL are both required.");
      return;
    }
    setPending(true);
    try {
      const body: Record<string, unknown> = {
        postId: postId.trim(),
        imageUrl: imageUrl.trim(),
      };
      if (reason.trim()) body.reason = reason.trim();

      const res = await fetch("/api/admin/takedowns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json?.error ?? "Takedown failed.");
        return;
      }
      const strikeCount = json?.strikeCount;
      const suspended = json?.suspended;
      toast.success(
        suspended
          ? `Image removed. Uploader hit strike ${strikeCount} and was suspended.`
          : `Image removed. Uploader is on strike ${strikeCount}.`,
      );
      setPostId("");
      setImageUrl("");
      setReason("");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <input
        className="input"
        type="text"
        placeholder="Post ID (UUID)"
        value={postId}
        onChange={(e) => setPostId(e.target.value)}
      />
      <input
        className="input"
        type="text"
        placeholder="Image URL (exact photo URL from the post)"
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
      />
      <input
        className="input"
        type="text"
        placeholder="Optional reason for the audit log"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        maxLength={500}
      />
      <button
        className="btn btn-danger"
        disabled={pending}
        onClick={submit}
        style={{ alignSelf: "flex-start" }}
      >
        {pending ? "Taking down…" : "Take down image"}
      </button>
    </div>
  );
}
