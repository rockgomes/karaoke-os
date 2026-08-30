"use client";

import Link from "next/link";
import { useState } from "react";
import { deleteSongs } from "./actions";
import EditSongDialog, { type EditableSong } from "./edit-song-dialog";

export type SortKey = "title" | "artist" | "genre" | "year";

export type SongRow = EditableSong & { cover_url: string | null };

const COLUMNS: {
  key: SortKey | null;
  label: string;
  className?: string;
}[] = [
  { key: "title", label: "Song" },
  { key: "artist", label: "Artist", className: "hidden md:table-cell" },
  { key: "genre", label: "Genre", className: "hidden lg:table-cell" },
  { key: "year", label: "Year", className: "hidden sm:table-cell" },
  { key: null, label: "Length", className: "hidden sm:table-cell" },
];

/** No artwork yet. A quiet placeholder, not an error. */
function CoverFallback() {
  return (
    <div
      aria-hidden="true"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md
 border border-line bg-surface-2 text-ink-faint"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <path d="M9 18V5l10-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="16" cy="16" r="3" />
      </svg>
    </div>
  );
}

export default function SongTable({
  slug,
  songs,
  sort,
  dir,
  sortHrefs,
}: {
  slug: string;
  songs: SongRow[];
  sort: SortKey;
  dir: "asc" | "desc";
  /**
   * One ready-made link per sortable column, built by the page so that every
   * filter already in the URL survives a sort. A plain object, not a function:
   * a server component cannot hand a function to a client one.
   */
  sortHrefs: Record<SortKey, string>;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<EditableSong | null>(null);

  const allShown = songs.length > 0 && songs.every((s) => selected.has(s.id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <>
      {selected.size > 0 && (
        <form
          action={deleteSongs}
          onSubmit={(e) => {
            const n = selected.size;
            if (!confirm(`Remove ${n} ${n === 1 ? "song" : "songs"} from the list?`)) {
              e.preventDefault();
            } else {
              setSelected(new Set());
            }
          }}
          className="flex items-center gap-3 border-b border-line bg-accent-soft px-4 py-2.5"
        >
          <input type="hidden" name="slug" value={slug} />
          {[...selected].map((id) => (
            <input key={id} type="hidden" name="song_id" value={id} />
          ))}
          <span className="text-sm font-medium text-ink" aria-live="polite">
            {selected.size} selected
          </span>
          <button
            type="submit"
            className="rounded-md px-2 py-1 text-sm font-medium text-danger
 underline-offset-4 hover:underline"
          >
            Remove selected
          </button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="ml-auto rounded-md px-2 py-1 text-sm text-ink-soft
 underline-offset-4 hover:underline"
          >
            Clear
          </button>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th scope="col" className="w-11 py-2.5 pl-4">
                <input
                  type="checkbox"
                  checked={allShown}
                  onChange={() =>
                    setSelected(allShown ? new Set() : new Set(songs.map((s) => s.id)))
                  }
                  aria-label="Select every song on this page"
                  className="h-4 w-4 accent-[var(--accent)]"
                />
              </th>
              {COLUMNS.map((col) => (
                <th
                  key={col.label}
                  scope="col"
                  className={`py-2.5 pr-4 text-xs font-medium uppercase tracking-[0.08em]
                              text-ink-faint ${col.className ?? ""}`}
                  aria-sort={
                    col.key && sort === col.key
                      ? dir === "asc"
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                >
                  {col.key ? (
                    <Link
                      href={sortHrefs[col.key]}
                      scroll={false}
                      className="inline-flex items-center gap-1 underline-offset-4 hover:underline"
                    >
                      {col.label}
                      <span aria-hidden="true" className="text-accent">
                        {sort === col.key ? (dir === "asc" ? "↑" : "↓") : ""}
                      </span>
                    </Link>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
              <th scope="col" className="py-2.5 pr-4 text-right">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>

          <tbody>
            {songs.map((song) => (
              <tr
                key={song.id}
                className="cursor-pointer border-b border-line last:border-0 hover:bg-surface-2"
              >
                <td className="py-2 pl-4">
                  <input
                    type="checkbox"
                    checked={selected.has(song.id)}
                    onChange={() => toggle(song.id)}
                    aria-label={`Select ${song.title}`}
                    className="h-4 w-4 accent-[var(--accent)]"
                  />
                </td>

                <td className="p-0">
                  <button
                    type="button"
                    onClick={() => setEditing(song)}
                    className="flex w-full items-center gap-3 py-2 pr-4 text-left"
                  >
                    {song.cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={song.cover_url}
                        alt=""
                        width={40}
                        height={40}
                        loading="lazy"
                        className="h-10 w-10 shrink-0 rounded-md border border-line object-cover"
                      />
                    ) : (
                      <CoverFallback />
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">{song.title}</p>
                      <p className="truncate text-xs text-ink-faint">
                        {/* On a narrow screen this line carries the artist,
                            because the artist column is hidden there. */}
                        <span className="md:hidden">{song.artist}</span>
                        <span className="hidden md:inline">
                          {song.album ?? "No album"}
                        </span>
                      </p>
                    </div>
                  </button>
                </td>

                <td className="hidden py-2 pr-4 text-ink-soft md:table-cell">
                  {song.artist}
                </td>
                <td className="hidden py-2 pr-4 text-ink-soft lg:table-cell">
                  {song.genre ?? <span className="text-ink-faint">—</span>}
                </td>
                <td className="hidden py-2 pr-4 tabular-nums text-ink-soft sm:table-cell">
                  {song.year ?? <span className="text-ink-faint">—</span>}
                </td>
                <td className="hidden py-2 pr-4 tabular-nums text-ink-soft sm:table-cell">
                  {song.duration ?? <span className="text-ink-faint">—</span>}
                </td>

                <td className="py-2 pr-4 text-right">
                  <button
                    type="button"
                    onClick={() => setEditing(song)}
                    className="rounded-md px-2 py-1 text-sm text-ink-soft
 underline-offset-4 hover:text-ink hover:underline"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <EditSongDialog slug={slug} song={editing} onClose={() => setEditing(null)} />
    </>
  );
}
