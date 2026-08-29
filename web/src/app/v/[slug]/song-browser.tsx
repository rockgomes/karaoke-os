"use client";

import { useMemo, useState } from "react";

type Song = {
  id: string;
  title: string;
  artist: string;
  genre: string | null;
  year: number | null;
  duration: string | null;
  cover_url: string | null;
};

export default function SongBrowser({ songs }: { songs: Song[] }) {
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return songs;
    return songs.filter(
      (s) =>
        s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q),
    );
  }, [songs, query]);

  return (
    <>
      <label className="sr-only" htmlFor="song-search">
        Search songs or artists
      </label>
      <input
        id="song-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search songs or artists"
        className="w-full rounded-lg border border-line px-4 py-3 text-base"
      />

      <p className="mt-3 text-sm text-ink-soft" aria-live="polite">
        {visible.length} {visible.length === 1 ? "song" : "songs"}
      </p>

      <ul className="mt-4 divide-y divide-line">
        {visible.map((song) => (
          <li key={song.id} className="flex items-center gap-3 py-3">
            {song.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={song.cover_url}
                alt=""
                width={48}
                height={48}
                className="h-12 w-12 shrink-0 rounded object-cover"
              />
            ) : (
              <div className="h-12 w-12 shrink-0 rounded bg-surface-2" />
            )}
            <div className="min-w-0">
              {/* Big and plain: the patron holds this up to the DJ. */}
              <p className="truncate text-base font-semibold">{song.title}</p>
              <p className="truncate text-sm text-ink-soft">{song.artist}</p>
            </div>
          </li>
        ))}
      </ul>

      {visible.length === 0 && (
        <p className="py-12 text-center text-ink-soft">
          No songs match that search.
        </p>
      )}
    </>
  );
}
