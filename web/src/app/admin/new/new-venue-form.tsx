"use client";

import { useActionState, useState } from "react";
import { createVenue, type NewVenueState } from "./actions";
import { slugify } from "@/lib/slug";

const EMPTY: NewVenueState = { error: null };

export default function NewVenueForm() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [state, formAction, pending] = useActionState(createVenue, EMPTY);

  // The address follows the name until the user edits it themselves.
  const [slugTouched, setSlugTouched] = useState(false);
  const effectiveSlug = slugTouched ? slug : slugify(name);

  return (
    <form action={formAction} className="mt-8 space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Venue name
        </label>
        <input
          id="name"
          name="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="The Blue Note"
          className="mt-1 w-full rounded-lg border border-line px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="slug" className="block text-sm font-medium">
          Web address
        </label>
        <div className="mt-1 flex items-center gap-1">
          <span className="shrink-0 text-sm text-ink-soft">/v/</span>
          <input
            id="slug"
            name="slug"
            value={effectiveSlug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            className="w-full rounded-lg border border-line px-3 py-2"
          />
        </div>
        <p className="mt-1 text-xs text-ink-soft">
          This is what the QR code at the table points to.
        </p>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !name.trim()}
        className="rounded-lg bg-accent px-4 py-2.5 font-medium text-white
 hover:bg-accent-hover disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create venue"}
      </button>
    </form>
  );
}
