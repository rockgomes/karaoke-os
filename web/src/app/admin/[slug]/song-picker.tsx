"use client";

import { useEffect, useId, useState, useTransition } from "react";
import type { Candidate } from "@/lib/metadata";
import { searchCatalogue } from "./actions";

/**
 * Search the catalogue and pick a real record.
 *
 * Typing a song by hand is how a list becomes unsearchable. One person writes
 * "Bon Jovi", the next "bon jovi ", a third gets the title wrong, and a guest
 * looking for any of them finds one of the three. Picking a record settles
 * the spelling, the album, the year, the running time and the artwork at once.
 *
 * The chosen record travels as hidden fields inside the caller's form, so the
 * whole thing is one ordinary submit. Nothing is guessed afterwards.
 */
export default function SongPicker({
  slug,
  onPick,
  picked,
  autoFocus,
  initialQuery = "",
}: {
  slug: string;
  onPick: (candidate: Candidate | null) => void;
  picked: Candidate | null;
  autoFocus?: boolean;
  initialQuery?: string;
}) {
  // The add form and the edit dialog can both be on the page at once, so a
  // fixed id would appear twice and the label would point at the wrong box.
  const inputId = useId();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Candidate[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();

  const term = query.trim();
  const searching = term.length >= 2;

  useEffect(() => {
    // Nothing to do until there is something to search for. State is left
    // alone rather than cleared, because setting it here would be a
    // synchronous setState inside an effect; the render below simply ignores
    // stale results while the box is this short.
    if (term.length < 2) return;

    // Debounced: every keystroke would otherwise be a request to Apple.
    const timer = setTimeout(() => {
      startTransition(async () => {
        try {
          setResults(await searchCatalogue(slug, term));
          setFailed(false);
        } catch {
          // The catalogue is someone else's server. Say so, and leave the
          // manual route open rather than blocking on it.
          setFailed(true);
          setResults([]);
        }
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [term, slug]);

  if (picked) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-accent bg-accent-soft p-3">
        <Art candidate={picked} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{picked.title}</p>
          <p className="truncate text-xs text-ink-soft">{describe(picked)}</p>
        </div>
        <button
          type="button"
          onClick={() => onPick(null)}
          className="shrink-0 rounded-md px-2 py-1 text-sm text-ink-soft underline-offset-4 hover:underline"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium">
        Search for the song
      </label>
      <input
        id={inputId}
        type="search"
        value={query}
        autoFocus={autoFocus}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Title and artist, e.g. thunderstruck acdc"
        autoComplete="off"
        className="mt-1 h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink"
      />

      <p className="mt-1 text-xs text-ink-faint" aria-live="polite">
        {!searching
          ? "Two letters is enough to start."
          : pending
            ? "Searching…"
            : failed
              ? "The catalogue did not answer. You can still add the song by hand."
              : results === null
                ? "Searching…"
                : results.length === 0
                  ? "Nothing found. Try the artist, or add it by hand."
                  : `${results.length} match${results.length === 1 ? "" : "es"} — pick the right release.`}
      </p>

      {searching && results && results.length > 0 && (
        <ul className="mt-2 max-h-72 divide-y divide-line overflow-y-auto rounded-lg border border-line">
          {results.map((candidate) => (
            <li key={candidate.id}>
              <button
                type="button"
                onClick={() => onPick(candidate)}
                className="flex w-full items-center gap-3 p-2.5 text-left hover:bg-surface-2"
              >
                <Art candidate={candidate} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink">
                    {candidate.title}
                  </span>
                  <span className="block truncate text-xs text-ink-soft">
                    {describe(candidate)}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** The line under a title: what tells two releases of one song apart. */
function describe(candidate: Candidate): string {
  return [candidate.artist, candidate.album, candidate.year, candidate.duration]
    .filter(Boolean)
    .join(" · ");
}

function Art({ candidate }: { candidate: Candidate }) {
  if (!candidate.cover_url) {
    return (
      <div
        aria-hidden="true"
        className="h-11 w-11 shrink-0 rounded-md border border-line bg-surface-2"
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={candidate.cover_url}
      alt=""
      loading="lazy"
      className="h-11 w-11 shrink-0 rounded-md border border-line object-cover"
    />
  );
}

/** The chosen record, as hidden fields for the surrounding form. */
export function PickedFields({ candidate }: { candidate: Candidate | null }) {
  if (!candidate) return null;
  return (
    <>
      <input type="hidden" name="title" value={candidate.title} />
      <input type="hidden" name="artist" value={candidate.artist} />
      <input type="hidden" name="album" value={candidate.album ?? ""} />
      <input type="hidden" name="year" value={candidate.year ?? ""} />
      <input type="hidden" name="duration" value={candidate.duration ?? ""} />
      <input type="hidden" name="genre" value={candidate.genre ?? ""} />
      <input type="hidden" name="cover_url" value={candidate.cover_url ?? ""} />
    </>
  );
}
