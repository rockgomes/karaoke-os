import "server-only";
import { extractLastfmGenres, type Tag } from "./genre";
import {
  fetchJson,
  formatDurationFromSeconds,
  normalize,
  yearFrom,
} from "./shared";

const BASE = "https://ws.audioscrobbler.com/2.0/";

export function hasLastfmKey(): boolean {
  return Boolean(process.env.LASTFM_API_KEY);
}

function url(params: Record<string, string>): string {
  const search = new URLSearchParams({
    ...params,
    api_key: process.env.LASTFM_API_KEY ?? "",
    format: "json",
  });
  return `${BASE}?${search}`;
}

type TrackInfo = {
  track?: {
    name?: string;
    duration?: string;
    url?: string;
    artist?: { name?: string };
    album?: { title?: string };
    toptags?: { tag?: Tag[] };
  };
  error?: number;
};

export async function fetchTrackInfo(artist: string, title: string) {
  if (!hasLastfmKey()) return null;

  const data = await fetchJson<TrackInfo>(
    url({ method: "track.getInfo", artist: normalize(artist), track: normalize(title) }),
    { timeoutMs: 5000 },
  );

  const track = data?.track;
  if (!track || data?.error) return null;

  return {
    title: track.name || title,
    artist: track.artist?.name || artist,
    album: track.album?.title ?? null,
    duration: formatDurationFromSeconds(Number(track.duration) / 1000),
    genre: extractLastfmGenres(track.toptags?.tag),
  };
}

type AlbumInfo = {
  album?: {
    name?: string;
    image?: { size?: string; "#text"?: string }[];
    wiki?: { published?: string };
    toptags?: { tag?: Tag[] };
  };
  error?: number;
};

export async function fetchAlbumInfo(artist: string, album: string) {
  if (!hasLastfmKey()) return null;

  const data = await fetchJson<AlbumInfo>(
    url({ method: "album.getInfo", artist: normalize(artist), album: normalize(album) }),
    { timeoutMs: 5000 },
  );

  const info = data?.album;
  if (!info || data?.error) return null;

  // The image array runs small -> mega and entries are often blank.
  // Take the largest one that actually carries a URL.
  let image: string | null = null;
  for (const size of ["extralarge", "large", "medium"]) {
    const match = info.image?.find((i) => i.size === size && i["#text"]);
    if (match?.["#text"]) {
      image = match["#text"];
      break;
    }
  }

  return {
    title: info.name ?? album,
    year: yearFrom(info.wiki?.published),
    genre: extractLastfmGenres(info.toptags?.tag),
    image,
  };
}

type ArtistInfo = { artist?: { tags?: { tag?: Tag[] } }; error?: number };

export async function fetchArtistGenre(artist: string): Promise<string | null> {
  if (!hasLastfmKey()) return null;

  const data = await fetchJson<ArtistInfo>(
    url({ method: "artist.getInfo", artist: normalize(artist) }),
    { timeoutMs: 5000 },
  );

  if (!data?.artist || data?.error) return null;
  return extractLastfmGenres(data.artist.tags?.tag);
}
