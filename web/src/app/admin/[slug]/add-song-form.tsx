"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { Candidate } from "@/lib/metadata";
import { addFromCatalogue, addSong, type SongState } from "./actions";
import SongPicker, { PickedFields } from "./song-picker";

const EMPTY: SongState = { error: null };

const field =
  "mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-ink";

/**
 * Two ways in, and the good one is the default.
 *
 * Searching the catalogue is what keeps the list findable: it settles the
 * spelling of the title and the artist, and brings the album, year, running
 * time and artwork with it. Typing by hand stays available, because a karaoke
 * catalogue holds things the commercial one does not.
 */
export default function AddSongForm({
  slug,
  libraryId,
}: {
  slug: string;
  libraryId: string;
}) {
  const [byHand, setByHand] = useState(false);

  return byHand ? (
    <ManualForm
      slug={slug}
      libraryId={libraryId}
      onBack={() => setByHand(false)}
    />
  ) : (
    <CatalogueForm
      slug={slug}
      libraryId={libraryId}
      onByHand={() => setByHand(true)}
    />
  );
}

function CatalogueForm(props: {
  slug: string;
  libraryId: string;
  onByHand: () => void;
}) {
  const [state, formAction, pending] = useActionState(addFromCatalogue, EMPTY);

  // Remounted on every successful save, which clears the chosen song ready
  // for the next one. A key rather than an effect: React refuses setState
  // inside one, and it is right to.
  return (
    <CataloguePane
      key={state.token ?? "first"}
      {...props}
      state={state}
      formAction={formAction}
      pending={pending}
    />
  );
}

function CataloguePane({
  slug,
  libraryId,
  onByHand,
  state,
  formAction,
  pending,
}: {
  slug: string;
  libraryId: string;
  onByHand: () => void;
  state: SongState;
  formAction: (formData: FormData) => void;
  pending: boolean;
}) {
  const [picked, setPicked] = useState<Candidate | null>(null);

  return (
    <form action={formAction}>
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="library_id" value={libraryId} />
      <PickedFields candidate={picked} />

      <SongPicker slug={slug} picked={picked} onPick={setPicked} />

      {state.error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {state.error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending || !picked}
          className="rounded-lg bg-accent px-4 py-2.5 font-medium text-accent-ink
                     hover:bg-accent-hover disabled:opacity-50"
        >
          {pending ? "Adding…" : "Add this song"}
        </button>
        <button
          type="button"
          onClick={onByHand}
          className="inline-flex h-11 items-center text-sm text-ink-soft
                     underline-offset-4 hover:underline"
        >
          Not in the catalogue? Type it in
        </button>
      </div>
    </form>
  );
}

function ManualForm({
  slug,
  libraryId,
  onBack,
}: {
  slug: string;
  libraryId: string;
  onBack: () => void;
}) {
  const [state, formAction, pending] = useActionState(addSong, EMPTY);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!pending && state.error === null) formRef.current?.reset();
  }, [state, pending]);

  return (
    <form ref={formRef} action={formAction}>
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="library_id" value={libraryId} />

      <p className="mb-3 text-xs text-ink-faint">
        Whatever you leave blank is looked up afterwards, from the title and
        artist you type. Getting either wrong means the lookup misses.
      </p>

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

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-accent px-4 py-2.5 font-medium text-accent-ink
                     hover:bg-accent-hover disabled:opacity-60"
        >
          {pending ? "Adding…" : "Add song"}
        </button>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-11 items-center text-sm text-ink-soft
                     underline-offset-4 hover:underline"
        >
          ← Search the catalogue instead
        </button>
      </div>
    </form>
  );
}
