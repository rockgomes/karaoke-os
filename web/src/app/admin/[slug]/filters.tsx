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

/**
 * A native <select> with our own arrow.
 *
 * The browser draws its arrow hard against the right border and ignores
 * padding-right when placing it, so the control ends up with the label at one
 * end, the arrow jammed against the other, and dead space between. Turning
 * the native arrow off and drawing our own puts both on the same 12px inset
 * as everything else in the toolbar.
 *
 * Still a real <select>: on a phone that means the system picker, which no
 * custom dropdown does better.
 */
function Select({
  id,
  value,
  onChange,
  disabled,
  children,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span className="relative inline-flex">
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        // One fixed width for both, rather than each sizing to its own longest
        // option — that left them different widths and put a wide gap after a
        // short label. A long genre ellipsises when closed; the open list
        // still shows it in full.
        className="h-11 w-40 appearance-none truncate rounded-lg border border-line
                   bg-surface py-0 pl-3 pr-9 text-sm text-ink disabled:opacity-60"
      >
        {children}
      </select>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4
                   -translate-y-1/2 text-ink-faint"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </span>
  );
}

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
      <Select
        id="genre-filter"
        value={genre}
        onChange={(v) => apply("genre", v)}
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
      </Select>

      <label className="sr-only" htmlFor="status-filter">
        Filter by how complete a song is
      </label>
      <Select
        id="status-filter"
        value={status}
        onChange={(v) => apply("status", v)}
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </Select>

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
