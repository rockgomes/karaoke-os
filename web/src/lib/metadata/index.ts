import "server-only";
import { searchRecording } from "./musicbrainz";
import { lookupItunes } from "./itunes";
export { searchItunes, type Candidate } from "./itunes";
import type { SongMetadata } from "./shared";

export type { SongMetadata } from "./shared";

export type EnrichInput = {
  title: string;
  artist: string;
  album?: string | null;
  genre?: string | null;
  duration?: string | null;
  year?: number | null;
  cover_url?: string | null;
  musicbrainz_id?: string | null;
};

/**
 * musicbrainz_id is deliberately not counted here. Including it meant every
 * song spent a one-second MusicBrainz call to fetch an id nothing reads yet,
 * even when every visible field was already filled.
 */
function stillMissing(m: SongMetadata): boolean {
  return !m.genre || !m.duration || !m.album || !m.year || !m.cover_url;
}

/**
 * Fills in whatever is missing. Never overwrites a value that is already there,
 * because a person typed it and they were probably right.
 *
 * Source order, and why:
 *   1. iTunes      — album, year, running time, cover art. One call, no key,
 *                    and it returns the canonical commercial release.
 *   2. MusicBrainz — the recording id, and anything still blank. Last because
 *                    it is capped at one request a second and its top search
 *                    hit is often a live bootleg rather than the studio track.
 */
export async function enrichSong(input: EnrichInput): Promise<SongMetadata> {
  const metadata: SongMetadata = {
    title: input.title,
    artist: input.artist,
    album: input.album ?? null,
    genre: input.genre ?? null,
    duration: input.duration ?? null,
    year: input.year ?? null,
    cover_url: input.cover_url ?? null,
    musicbrainz_id: input.musicbrainz_id ?? null,
  };

  if (!stillMissing(metadata)) return metadata;

  const itunes = await lookupItunes(input.artist, input.title);
  if (itunes) {
    metadata.album ??= itunes.album;
    metadata.year ??= itunes.year;
    metadata.duration ??= itunes.duration;
    metadata.cover_url ??= itunes.cover_url;
    // One broad word ("Rock", "Country"). It is the only genre source now.
    metadata.genre ??= itunes.genre;
  }

  if (stillMissing(metadata)) {
    const mb = await searchRecording(input.artist, input.title);
    if (mb) {
      metadata.musicbrainz_id ??= mb.musicbrainz_id ?? null;
      metadata.duration ??= mb.duration ?? null;
      metadata.year ??= mb.year ?? null;
      metadata.album ??= mb.album ?? null;
      metadata.genre ??= mb.genre ?? null;
    }
  }

  return metadata;
}
