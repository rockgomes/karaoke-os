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
  "mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink";

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
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-xl border border-line
                 bg-surface p-0 text-ink backdrop:bg-black/50"
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
          <p role="alert" className="mt-3 text-sm text-danger">
            {state.error}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-line px-4 py-2 text-sm font-medium
 hover:bg-surface-2
 hover:bg-surface-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white
 hover:bg-accent-hover disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
