import "server-only";

export type SongMetadata = {
  title: string;
  artist: string;
  album: string | null;
  genre: string | null;
  duration: string | null;
  year: number | null;
  cover_url: string | null;
  musicbrainz_id: string | null;
};

/** Strip punctuation the search APIs do not handle well. */
export function normalize(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s&'-]/g, "");
}

/** Seconds to M:SS. Rejects nonsense rather than showing "0:00" or "9999:00". */
export function formatDurationFromSeconds(seconds: number): string | null {
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  if (seconds > 10 * 60 * 60) return null;

  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function formatDurationFromMs(ms?: number | null): string | null {
  if (!ms || !Number.isFinite(ms) || ms <= 0) return null;
  return formatDurationFromSeconds(Math.floor(ms / 1000));
}

export function yearFrom(dateLike?: string | null): number | null {
  if (!dateLike) return null;
  const match = dateLike.match(/\b(19|20)\d{2}\b/);
  return match ? Number(match[0]) : null;
}

/** fetch with a timeout, so one slow provider cannot hang the request. */
export async function fetchJson<T>(
  url: string,
  { timeoutMs = 8000, headers = {} }: { timeoutMs?: number; headers?: Record<string, string> } = {},
): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      headers,
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    // A provider being down is normal. The caller falls through to the next.
    return null;
  } finally {
    clearTimeout(timer);
  }
}
