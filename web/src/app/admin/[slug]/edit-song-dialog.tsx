"use client";

import { useActionState, useEffect, useRef } from "react";
import { updateSong, type SongState } from "./actions";

export type EditableSong = {
  id: string;
  title: string;
  artist: string;
  genre: string | null;
  year: number | null;
  album: string | null;
  duration: string | null;
};

const EMPTY: SongState = { error: null };

const field =
  "mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none " +
  "focus-visible:ring-2 focus-visible:ring-blue-600 " +
  "dark:border-neutral-700 dark:bg-neutral-900";

export default function EditSongDialog({
  slug,
  song,
  onClose,
}: {
  slug: string;
  song: EditableSong | null;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [state, formAction, pending] = useActionState(updateSong, EMPTY);

  // showModal gives focus trapping and Escape for free, which a div cannot.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (song && !dialog.open) dialog.showModal();
    if (!song && dialog.open) dialog.close();
  }, [song]);

  useEffect(() => {
    if (!pending && state.error === null && song) onClose();
    // Only react to a finished submission.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, pending]);

  if (!song) return null;

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      className="w-[min(32rem,calc(100vw-2rem))] rounded-xl border border-neutral-200
                 bg-white p-0 text-neutral-900 backdrop:bg-black/40
                 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100"
    >
      <form action={formAction} className="p-5">
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="song_id" value={song.id} />

        <h2 className="text-lg font-semibold">Edit song</h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="edit-title" className="block text-sm font-medium">Title</label>
            <input id="edit-title" name="title" required defaultValue={song.title} className={field} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="edit-artist" className="block text-sm font-medium">Artist</label>
            <input id="edit-artist" name="artist" required defaultValue={song.artist} className={field} />
          </div>
          <div>
            <label htmlFor="edit-genre" className="block text-sm font-medium">Genre</label>
            <input id="edit-genre" name="genre" defaultValue={song.genre ?? ""} className={field} />
          </div>
          <div>
            <label htmlFor="edit-year" className="block text-sm font-medium">Year</label>
            <input id="edit-year" name="year" type="number" min={1850} max={2100}
                   defaultValue={song.year ?? ""} className={field} />
          </div>
          <div>
            <label htmlFor="edit-album" className="block text-sm font-medium">Album</label>
            <input id="edit-album" name="album" defaultValue={song.album ?? ""} className={field} />
          </div>
          <div>
            <label htmlFor="edit-duration" className="block text-sm font-medium">Length</label>
            <input id="edit-duration" name="duration" placeholder="4:11"
                   defaultValue={song.duration ?? ""} className={field} />
          </div>
        </div>

        {state.error && (
          <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
            {state.error}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium
                       hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-blue-600
                       dark:border-neutral-700 dark:hover:bg-neutral-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white
                       hover:bg-blue-700 disabled:opacity-60 focus-visible:outline-2
                       focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            {pending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
