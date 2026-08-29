"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Add or remove one favourite.
 *
 * A patron is a user row with no membership, so this needs no role of its
 * own. Row level security on `favorites` already limits every read and write
 * to `user_id = auth.uid()`; the check here only avoids a pointless round
 * trip for someone who is not signed in at all.
 */
export async function toggleFavorite(formData: FormData) {
  const songId = String(formData.get("song_id") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const wanted = formData.get("on") === "true";
  if (!songId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Signed out. The button is a link to the sign-in page in that case, so
  // reaching here means a stale form; do nothing rather than error.
  if (!user) return;

  if (wanted) {
    await supabase
      .from("favorites")
      .upsert(
        { user_id: user.id, song_id: songId },
        { onConflict: "user_id,song_id" },
      );
  } else {
    await supabase
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("song_id", songId);
  }

  if (slug) revalidatePath(`/v/${slug}`);
}
