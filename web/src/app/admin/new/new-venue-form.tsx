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
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2
                     outline-none focus-visible:ring-2 focus-visible:ring-blue-600
                     dark:border-neutral-700 dark:bg-neutral-900"
        />
      </div>

      <div>
        <label htmlFor="slug" className="block text-sm font-medium">
          Web address
        </label>
        <div className="mt-1 flex items-center gap-1">
          <span className="shrink-0 text-sm text-neutral-500">/v/</span>
          <input
            id="slug"
            name="slug"
            value={effectiveSlug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2
                       outline-none focus-visible:ring-2 focus-visible:ring-blue-600
                       dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>
        <p className="mt-1 text-xs text-neutral-500">
          This is what the QR code at the table points to.
        </p>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !name.trim()}
        className="rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white
                   hover:bg-blue-700 disabled:opacity-60 focus-visible:outline-2
                   focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        {pending ? "Creating…" : "Create venue"}
      </button>
    </form>
  );
}
