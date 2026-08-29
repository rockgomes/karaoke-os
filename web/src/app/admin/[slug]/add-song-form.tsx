"use client";

import { useActionState, useEffect, useRef } from "react";
import { addSong, type SongState } from "./actions";

const EMPTY: SongState = { error: null };

const field =
  "mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-ink";

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
    <form ref={formRef} action={formAction}>
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
            Genre <span className="text-ink-faint">(optional)</span>
          </label>
          <input id="genre" name="genre" className={field} />
        </div>
        <div>
          <label htmlFor="year" className="block text-sm font-medium">
            Year <span className="text-ink-faint">(optional)</span>
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
        <p role="alert" className="mt-3 text-sm text-danger">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded-lg bg-accent px-4 py-2.5 font-medium text-accent-ink
 hover:bg-accent-hover disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add song"}
      </button>
    </form>
  );
}
