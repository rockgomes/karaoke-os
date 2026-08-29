"use client";

import Link from "next/link";
import { useState } from "react";
import { deleteSongs } from "./actions";
import EditSongDialog, { type EditableSong } from "./edit-song-dialog";

export type SortKey = "title" | "artist" | "genre" | "year";

const COLUMNS: { key: SortKey; label: string; hideBelow?: string }[] = [
  { key: "title", label: "Title" },
  { key: "artist", label: "Artist" },
  { key: "genre", label: "Genre", hideBelow: "sm" },
  { key: "year", label: "Year", hideBelow: "sm" },
];

export default function SongTable({
  slug,
  songs,
  sort,
  dir,
  query,
  page,
}: {
  slug: string;
  songs: EditableSong[];
  sort: SortKey;
  dir: "asc" | "desc";
  query: string;
  page: number;
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

  function toggleAll() {
    setSelected(allShown ? new Set() : new Set(songs.map((s) => s.id)));
  }

  /** Sorting is a link, so the view stays shareable and the back button works. */
  function sortHref(key: SortKey) {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    params.set("sort", key);
    params.set("dir", sort === key && dir === "asc" ? "desc" : "asc");
    if (page > 1) params.set("page", String(page));
    return `?${params}`;
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
          className="mb-3 flex items-center gap-3 rounded-lg border border-neutral-300
                     bg-neutral-50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
        >
          <input type="hidden" name="slug" value={slug} />
          {[...selected].map((id) => (
            <input key={id} type="hidden" name="song_id" value={id} />
          ))}
          <span className="text-sm" aria-live="polite">
            {selected.size} selected
          </span>
          <button
            type="submit"
            className="rounded-md px-2 py-1 text-sm font-medium text-red-600 underline-offset-4
                       hover:underline focus-visible:outline-2 focus-visible:outline-red-600
                       dark:text-red-400"
          >
            Remove selected
          </button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="ml-auto rounded-md px-2 py-1 text-sm text-neutral-500 underline-offset-4
                       hover:underline focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            Clear
          </button>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left dark:border-neutral-800">
              <th scope="col" className="w-9 py-2">
                <input
                  type="checkbox"
                  checked={allShown}
                  onChange={toggleAll}
                  aria-label="Select every song on this page"
                  className="h-4 w-4 accent-blue-600"
                />
              </th>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={`py-2 pr-3 font-medium ${col.hideBelow === "sm" ? "hidden sm:table-cell" : ""}`}
                  aria-sort={
                    sort === col.key
                      ? dir === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                >
                  <Link
                    href={sortHref(col.key)}
                    scroll={false}
                    className="inline-flex items-center gap-1 underline-offset-4 hover:underline
                               focus-visible:outline-2 focus-visible:outline-blue-600"
                  >
                    {col.label}
                    <span aria-hidden="true" className="text-neutral-400">
                      {sort === col.key ? (dir === "asc" ? "↑" : "↓") : ""}
                    </span>
                  </Link>
                </th>
              ))}
              <th scope="col" className="py-2 text-right font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>

          <tbody>
            {songs.map((song) => (
              <tr
                key={song.id}
                className="border-b border-neutral-100 last:border-0 dark:border-neutral-900"
              >
                <td className="py-2">
                  <input
                    type="checkbox"
                    checked={selected.has(song.id)}
                    onChange={() => toggle(song.id)}
                    aria-label={`Select ${song.title}`}
                    className="h-4 w-4 accent-blue-600"
                  />
                </td>
                <td className="py-2 pr-3 font-medium">
                  {song.title}
                  <span className="block text-xs text-neutral-500 sm:hidden">
                    {song.artist}
                  </span>
                </td>
                <td className="hidden py-2 pr-3 text-neutral-600 sm:table-cell dark:text-neutral-400">
                  {song.artist}
                </td>
                <td className="hidden py-2 pr-3 text-neutral-600 sm:table-cell dark:text-neutral-400">
                  {song.genre ?? "—"}
                </td>
                <td className="hidden py-2 pr-3 tabular-nums text-neutral-600 sm:table-cell dark:text-neutral-400">
                  {song.year ?? "—"}
                </td>
                <td className="py-2 text-right">
                  <button
                    type="button"
                    onClick={() => setEditing(song)}
                    className="rounded-md px-2 py-1 text-sm underline-offset-4 hover:underline
                               focus-visible:outline-2 focus-visible:outline-blue-600"
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
