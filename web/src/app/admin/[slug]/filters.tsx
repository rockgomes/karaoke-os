"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export type GenreOption = { genre: string; songs: number };

export const STATUSES = [
  { value: "all", label: "Every song" },
  { value: "incomplete", label: "Missing details" },
  { value: "complete", label: "Fully filled in" },
] as const;

export type Status = (typeof STATUSES)[number]["value"];

const select =
  "h-11 rounded-lg border border-line bg-surface px-3 text-sm text-ink";

/**
 * Filters live in the URL, like the search box, so a filtered view can be
 * bookmarked and the back button behaves.
 */
export default function Filters({
  genres,
  genre,
  status,
}: {
  genres: GenreOption[];
  genre: string;
  status: Status;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function apply(key: "genre" | "status", value: string) {
    const next = new URLSearchParams(params);
    if (value && value !== "all") next.set(key, value);
    else next.delete(key);
    // Narrowing the list starts at the beginning; page 4 of the old result
    // set means nothing in the new one.
    next.delete("page");
    startTransition(() =>
      router.replace(`${pathname}?${next}`, { scroll: false }),
    );
  }

  const filtered = Boolean(params.get("q") || genre || status !== "all");

  return (
    <>
      <label className="sr-only" htmlFor="genre-filter">
        Filter by genre
      </label>
      <select
        id="genre-filter"
        value={genre}
        onChange={(e) => apply("genre", e.target.value)}
        className={select}
        disabled={genres.length === 0}
      >
        <option value="">
          {genres.length ? "Any genre" : "No genres yet"}
        </option>
        {genres.map((g) => (
          <option key={g.genre} value={g.genre}>
            {g.genre} ({g.songs})
          </option>
        ))}
      </select>

      <label className="sr-only" htmlFor="status-filter">
        Filter by how complete a song is
      </label>
      <select
        id="status-filter"
        value={status}
        onChange={(e) => apply("status", e.target.value)}
        className={select}
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      {filtered && (
        <button
          type="button"
          onClick={() =>
            startTransition(() => router.replace(pathname, { scroll: false }))
          }
          className="inline-flex h-11 items-center rounded-lg px-2 text-sm text-ink-soft underline-offset-4 hover:underline"
        >
          Clear
        </button>
      )}

      <span role="status" className="text-xs text-ink-faint">
        {pending ? "filtering" : ""}
      </span>
    </>
  );
}
