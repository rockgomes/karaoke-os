import "server-only";
import { fetchJson, formatDurationFromSeconds, yearFrom } from "./shared";

type ItunesSong = {
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
