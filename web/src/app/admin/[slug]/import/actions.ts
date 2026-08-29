"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMembershipBySlug } from "@/lib/auth";
import { songKey, type ParsedRow } from "@/lib/csv";

export type ImportState = {
  error: string | null;
  added?: number;
  duplicates?: number;
};

// Postgres accepts far more, but a single insert that large is slow enough to
// be cut off by the host. Several smaller ones finish inside the limit.
const CHUNK = 200;

export async function importSongs(
  _prev: ImportState,
  formData: FormData,
): Promise<ImportState> {
  const slug = String(formData.get("slug") ?? "");
  const libraryId = String(formData.get("library_id") ?? "");
  if (!libraryId) return { error: "This venue has no song list yet." };

  const membership = await getMembershipBySlug(slug);
  if (!membership) return { error: "You do not work at this venue." };

  let rows: ParsedRow[];
  try {
    rows = JSON.parse(String(formData.get("rows") ?? "[]"));
  } catch {
    return { error: "Could not read the rows to import. Try again." };
  }
  if (!Array.isArray(rows) || rows.length === 0) {
    return { error: "There is nothing to import." };
  }

  const supabase = await createClient();

  // Skip anything the venue already has. Two bars may both stock a song, but
  // one bar has no use for it twice.
  const { data: existing } = await supabase
    .from("songs")
    .select("title, artist")
    .eq("library_id", libraryId);

  const seen = new Set((existing ?? []).map((s) => songKey(s.title, s.artist)));

  const fresh = [];
  let duplicates = 0;

  for (const row of rows) {
    const key = songKey(row.title, row.artist);
    if (seen.has(key)) {
      duplicates++;
      continue;
    }
    seen.add(key); // also catches a file that repeats a song within itself
    fresh.push({
      library_id: libraryId,
      title: row.title,
      artist: row.artist,
      genre: row.genre,
      duration: row.duration,
      year: row.year,
      album: row.album,
    });
  }

  let added = 0;
  for (let i = 0; i < fresh.length; i += CHUNK) {
    const { error } = await supabase.from("songs").insert(fresh.slice(i, i + CHUNK));
    if (error) {
      return {
        error: `Imported ${added} songs, then stopped: ${error.message}`,
        added,
        duplicates,
      };
    }
    added += Math.min(CHUNK, fresh.length - i);
  }

  revalidatePath(`/admin/${slug}`);
  revalidatePath(`/v/${slug}`);
  return { error: null, added, duplicates };
}
