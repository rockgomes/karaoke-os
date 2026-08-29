"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMembershipBySlug } from "@/lib/auth";

export type SongState = { error: string | null };

/** Row level security is the real gate. This just gives a clear message. */
async function requireMembership(slug: string) {
  const membership = await getMembershipBySlug(slug);
  if (!membership) throw new Error("You do not work at this venue.");
  return membership;
}

export async function addSong(
  _prev: SongState,
  formData: FormData,
): Promise<SongState> {
  const slug = String(formData.get("slug") ?? "");
  const libraryId = String(formData.get("library_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const artist = String(formData.get("artist") ?? "").trim();

  if (!title || !artist) return { error: "A song needs a title and an artist." };
  if (!libraryId) return { error: "This venue has no song list yet." };

  await requireMembership(slug);

  const yearRaw = String(formData.get("year") ?? "").trim();
  const year = yearRaw ? Number(yearRaw) : null;
  if (year !== null && (!Number.isInteger(year) || year < 1850 || year > 2100)) {
    return { error: "Year must be a whole number between 1850 and 2100." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("songs").insert({
    library_id: libraryId,
    title,
    artist,
    genre: String(formData.get("genre") ?? "").trim() || null,
    year,
  });

  if (error) return { error: error.message };

  revalidatePath(`/admin/${slug}`);
  revalidatePath(`/v/${slug}`);
  return { error: null };
}

export async function deleteSong(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const songId = String(formData.get("song_id") ?? "");
  await requireMembership(slug);

  const supabase = await createClient();
  await supabase.from("songs").delete().eq("id", songId);

  revalidatePath(`/admin/${slug}`);
  revalidatePath(`/v/${slug}`);
}

/** Opens tonight's session, or closes the one that is open. */
export async function toggleSession(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const membership = await requireMembership(slug);
  const openId = String(formData.get("open_session_id") ?? "");

  const supabase = await createClient();

  if (openId) {
    await supabase
      .from("sessions")
      .update({ closed_at: new Date().toISOString() })
      .eq("id", openId);
  } else {
    await supabase.from("sessions").insert({ venue_id: membership.venue_id });
  }

  revalidatePath(`/admin/${slug}`);
  revalidatePath(`/v/${slug}`);
}
