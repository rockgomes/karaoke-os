import "server-only";
import { extractMusicBrainzGenres, type Tag } from "./genre";
import {
  fetchJson,
  formatDurationFromMs,
  normalize,
  yearFrom,
  type SongMetadata,
} from "./shared";

const BASE = "https://musicbrainz.org/ws/2";

// MusicBrainz asks for a real User-Agent and one request per second. Both are
// conditions of use, not suggestions: ignore them and they block the IP.
const USER_AGENT = "KaraokeOS/1.0 (https://github.com/rockgomes/karaoke-os)";
const MIN_GAP_MS = 1000;

// Serialises callers within this process. On serverless each instance keeps
// its own gate, so heavy parallel use still needs a real queue.
let lastRequestAt = 0;
let chain: Promise<void> = Promise.resolve();

function rateLimit(): Promise<void> {
  chain = chain.then(async () => {
    const wait = MIN_GAP_MS - (Date.now() - lastRequestAt);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastRequestAt = Date.now();
  });
  return chain;
}

type Recording = {
  id: string;
  title?: string;
  length?: number;
  tags?: Tag[];
  "artist-credit"?: { artist?: { name?: string } }[];
  releases?: { title?: string; date?: string }[];
};

/**
 * MusicBrainz returns releases in no useful order, so the original code's
 * releases[0] picked whatever came first. For "Bohemian Rhapsody" that was
 * the 1991 compilation "Live USA", not A Night at the Opera.
 *
 * The earliest dated release is a far better guess at the record a singer
 * means. Undated releases sort last rather than being dropped, so a recording
 * with no dates at all still yields an album name.
 */
function pickRelease(releases?: { title?: string; date?: string }[]) {
  if (!releases?.length) return undefined;

  return [...releases].sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return a.date.localeCompare(b.date);
  })[0];
}

export async function searchRecording(
  artist: string,
  title: string,
): Promise<Partial<SongMetadata> | null> {
  await rateLimit();

  const query = `recording:"${normalize(title)}" AND artist:"${normalize(artist)}"`;
  const url =
    `${BASE}/recording?query=${encodeURIComponent(query)}` +
    `&fmt=json&limit=1&inc=releases+tags`;

  const data = await fetchJson<{ recordings?: Recording[] }>(url, {
    headers: { "User-Agent": USER_AGENT },
  });

  const recording = data?.recordings?.[0];
  if (!recording) return null;

  const release = pickRelease(recording.releases);

  return {
    title: recording.title || title,
    artist: recording["artist-credit"]?.[0]?.artist?.name || artist,
    album: release?.title ?? null,
    year: yearFrom(release?.date),
    duration: formatDurationFromMs(recording.length),
    genre: extractMusicBrainzGenres(recording.tags),
    musicbrainz_id: recording.id,
  };
}
