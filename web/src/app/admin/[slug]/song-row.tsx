"use client";

import { deleteSong } from "./actions";

type Song = {
  id: string;
  title: string;
  artist: string;
  genre: string | null;
  year: number | null;
};

export default function SongRow({ slug, song }: { slug: string; song: Song }) {
  return (
    <li className="flex items-center gap-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{song.title}</p>
        <p className="truncate text-sm text-neutral-500">
          {song.artist}
          {song.genre ? ` · ${song.genre}` : ""}
          {song.year ? ` · ${song.year}` : ""}
        </p>
      </div>

      <form
        action={deleteSong}
        onSubmit={(e) => {
          if (!confirm(`Remove "${song.title}" from the list?`)) {
            e.preventDefault();
          }
        }}
      >
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="song_id" value={song.id} />
        <button
          type="submit"
          className="rounded-md px-2 py-1 text-sm text-red-600 underline-offset-4
                     hover:underline focus-visible:outline-2
                     focus-visible:outline-red-600 dark:text-red-400"
        >
          Remove
        </button>
      </form>
    </li>
  );
}
