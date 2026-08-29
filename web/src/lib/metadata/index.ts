import "server-only";
import { fetchAlbumInfo, fetchArtistGenre, fetchTrackInfo, hasLastfmKey } from "./lastfm";
import { searchRecording } from "./musicbrainz";
import { lookupItunes } from "./itunes";
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

/** Collect genres from track, then album, then artist, until there are three. */
async function combineAllGenres(
  artist: string,
  title: string,
  album: string | null,
): Promise<string | null> {
  const found: string[] = [];
  const seen = new Set<string>();

  const take = (value: string | null | undefined) => {
    if (!value) return;
    for (const genre of value.split(",").map((g) => g.trim())) {
      // "Pop" alone is what Last.fm returns when it knows nothing useful.
      if (!genre || genre === "Pop" || seen.has(genre)) continue;
      seen.add(genre);
      found.push(genre);
    }
  };

  take((await fetchTrackInfo(artist, title))?.genre);
  if (found.length < 3 && album) take((await fetchAlbumInfo(artist, album))?.genre);
  if (found.length < 3) take(await fetchArtistGenre(artist));

  return found.length ? found.slice(0, 3).join(", ") : null;
}

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
 *   2. Last.fm     — genre. Its tag data supports a real breakdown
 *                    ("Rock, Hard Rock, Glam Rock") where iTunes gives one word.
 *   3. MusicBrainz — the recording id, and anything still blank. Last because
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
  }

  if (!metadata.genre && hasLastfmKey()) {
    metadata.genre = await combineAllGenres(
      input.artist,
      input.title,
      metadata.album,
    );
  }

  // iTunes' single broad word beats no genre at all.
  metadata.genre ??= itunes?.genre ?? null;

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

  // Last resort for artwork.
  if (!metadata.cover_url && hasLastfmKey() && metadata.album) {
    metadata.cover_url =
      (await fetchAlbumInfo(input.artist, metadata.album))?.image ?? null;
  }

  return metadata;
}
