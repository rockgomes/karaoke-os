"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMembershipBySlug } from "@/lib/auth";
import { enrichSong } from "@/lib/metadata";

export type SongState = { error: string | null };

/** One MusicBrainz call a second, so keep a run well inside any host timeout. */
const BATCH_SIZE = 10;

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

  // Look up what the person did not type. Anything they did type is kept.
  const filled = await enrichSong({
    title,
    artist,
    genre: String(formData.get("genre") ?? "").trim() || null,
    year,
  });

  const supabase = await createClient();
  const { error } = await supabase.from("songs").insert({
    library_id: libraryId,
    title,
    artist,
    genre: filled.genre,
    year: filled.year,
    album: filled.album,
    duration: filled.duration,
    cover_url: filled.cover_url,
    musicbrainz_id: filled.musicbrainz_id,
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

/**
 * Fills in details for songs that are missing them.
 *
 * Capped per run because MusicBrainz allows one request a second and a server
 * action that runs for a minute will be cut off by the host. Press it again
 * for the next batch.
 */
export async function fillMissingDetails(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const membership = await requireMembership(slug);

  const supabase = await createClient();

  const { data: libraries } = await supabase
    .from("libraries")
    .select("id")
    .eq("venue_id", membership.venue_id);

  const libraryIds = (libraries ?? []).map((l) => l.id);
  if (!libraryIds.length) return;

  const { data: songs } = await supabase
    .from("songs")
    .select("id, title, artist, album, genre, duration, year, cover_url, musicbrainz_id")
    .in("library_id", libraryIds)
    .or("genre.is.null,duration.is.null,album.is.null,year.is.null,cover_url.is.null")
    .limit(BATCH_SIZE);

  for (const song of songs ?? []) {
    const filled = await enrichSong(song);
    await supabase
      .from("songs")
      .update({
        genre: filled.genre,
        duration: filled.duration,
        album: filled.album,
        year: filled.year,
        cover_url: filled.cover_url,
        musicbrainz_id: filled.musicbrainz_id,
      })
      .eq("id", song.id);
  }

  revalidatePath(`/admin/${slug}`);
  revalidatePath(`/v/${slug}`);
}
