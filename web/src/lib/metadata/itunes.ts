import "server-only";
import { fetchJson, formatDurationFromSeconds, yearFrom } from "./shared";

type ItunesSong = {
  trackId?: number;
  trackName?: string;
  artistName?: string;
  collectionName?: string;
  releaseDate?: string;
  trackTimeMillis?: number;
  primaryGenreName?: string;
  artworkUrl100?: string;
};

/**
 * The iTunes Search API: no key, no rate limit worth handling, and it indexes
 * the commercial catalogue rather than every recording that exists.
 *
 * That last part is why it leads here. MusicBrainz is a completist database:
 * asked for "Bohemian Rhapsody" by Queen it returns the top ten by relevance,
 * and all ten are live bootlegs — the studio track is not among them. Taking
 * the first hit gave the album "Live USA" and a 1991 date.
 *
 * iTunes returns the record a singer would actually name. Checked against five
 * standards, it got the year and running time right on all five.
 */
export async function lookupItunes(artist: string, title: string) {
  const term = encodeURIComponent(`${artist} ${title}`);
  const data = await fetchJson<{ results?: ItunesSong[] }>(
    `https://itunes.apple.com/search?term=${term}&media=music&entity=song&limit=1`,
    { timeoutMs: 5000 },
  );

  const hit = data?.results?.[0];
  if (!hit) return null;

  return {
    album: hit.collectionName ?? null,
    year: yearFrom(hit.releaseDate),
    duration: hit.trackTimeMillis
      ? formatDurationFromSeconds(hit.trackTimeMillis / 1000)
      : null,
    // One broad word, e.g. "Rock". The only genre source unless MusicBrainz
    // is also consulted for a song that is still missing other fields.
    genre: hit.primaryGenreName ?? null,
    // The same path serves other sizes; 100px is too small for the UI.
    cover_url: hit.artworkUrl100?.replace("100x100bb", "400x400bb") ?? null,
  };
}

export type Candidate = {
  /** iTunes track id. Only used to key the list in the UI. */
  id: string;
  title: string;
  artist: string;
  album: string | null;
  year: number | null;
  duration: string | null;
  genre: string | null;
  cover_url: string | null;
};

/**
 * Several candidates rather than one, so a person can choose.
 *
 * Automatic matching takes the top hit, and the top hit is often a
 * compilation: "Thunderstruck" comes back on the Iron Man 2 soundtrack, not
 * on The Razors Edge. A machine cannot tell which release a bar means. A
 * person can, at a glance, from the cover and the year.
 */
export async function searchItunes(
  query: string,
  limit = 8,
): Promise<Candidate[]> {
  const term = query.trim();
  if (term.length < 2) return [];

  const data = await fetchJson<{ results?: ItunesSong[] }>(
    `https://itunes.apple.com/search?term=${encodeURIComponent(term)}` +
      `&media=music&entity=song&limit=${limit}`,
    { timeoutMs: 5000 },
  );

  return (data?.results ?? [])
    .filter((hit) => hit.trackName && hit.artistName)
    .map((hit) => ({
      id: String(hit.trackId ?? `${hit.artistName}-${hit.trackName}`),
      title: hit.trackName!,
      artist: hit.artistName!,
      album: hit.collectionName ?? null,
      year: yearFrom(hit.releaseDate),
      duration: hit.trackTimeMillis
        ? formatDurationFromSeconds(hit.trackTimeMillis / 1000)
        : null,
      genre: hit.primaryGenreName ?? null,
      cover_url: hit.artworkUrl100?.replace("100x100bb", "400x400bb") ?? null,
    }));
}
