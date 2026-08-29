"use client";

import { useActionState, useEffect, useRef } from "react";
import { addSong, type SongState } from "./actions";

const EMPTY: SongState = { error: null };

const field =
  "mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none " +
  "focus-visible:ring-2 focus-visible:ring-blue-600 " +
  "dark:border-neutral-700 dark:bg-neutral-900";

export default function AddSongForm({
  slug,
  libraryId,
}: {
  slug: string;
  libraryId: string;
}) {
  const [state, formAction, pending] = useActionState(addSong, EMPTY);
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the form after a save so the next song can be typed straight in.
  useEffect(() => {
    if (!pending && state.error === null) formRef.current?.reset();
  }, [state, pending]);

  return (
    <form ref={formRef} action={formAction} className="mt-3">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="library_id" value={libraryId} />

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="title" className="block text-sm font-medium">
            Title
          </label>
          <input id="title" name="title" required className={field} />
        </div>
        <div>
          <label htmlFor="artist" className="block text-sm font-medium">
            Artist
          </label>
          <input id="artist" name="artist" required className={field} />
        </div>
        <div>
          <label htmlFor="genre" className="block text-sm font-medium">
            Genre <span className="text-neutral-500">(optional)</span>
          </label>
          <input id="genre" name="genre" className={field} />
        </div>
        <div>
          <label htmlFor="year" className="block text-sm font-medium">
            Year <span className="text-neutral-500">(optional)</span>
          </label>
          <input
            id="year"
            name="year"
            type="number"
            inputMode="numeric"
            min={1850}
            max={2100}
            className={field}
          />
        </div>
      </div>

      {state.error && (
        <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white
                   hover:bg-blue-700 disabled:opacity-60 focus-visible:outline-2
                   focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        {pending ? "Adding…" : "Add song"}
      </button>
    </form>
  );
}
