"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type GuestSong = {
  id: string;
  title: string;
  artist: string;
  genre: string | null;
  year: number | null;
  duration: string | null;
  cover_url: string | null;
};

/**
 * The whole page a guest sees.
 *
 * The job is not "browse a catalogue". It is: find a song, then tell the DJ
 * which one. So picking a song opens a card built to be held up and read
 * across a loud, dark room — that is the point of the screen, not a detail.
 */
export default function SongBrowser({
  venueName,
  live,
  songs,
  matching,
  total,
  shown,
  helping,
  genres,
  query,
  genre,
}: {
  venueName: string;
  live: boolean;
  songs: GuestSong[];
  matching: number;
  total: number;
  shown: number;
  helping: number;
  genres: string[];
  query: string;
  genre: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const [value, setValue] = useState(query);
  const [picked, setPicked] = useState<GuestSong | null>(null);

  useEffect(() => {
    // Compared against the URL rather than guarded on first render, for the
    // same reason as the admin search: a ref guard fires again when React
    // re-invokes effects, and this one resets how much of the list is shown.
    if (value.trim() === query) return;

    const timer = setTimeout(() => {
      const next = new URLSearchParams(params);
      if (value.trim()) next.set("q", value.trim());
      else next.delete("q");
      next.delete("show");
      startTransition(() =>
        router.replace(`${pathname}?${next}`, { scroll: false }),
      );
    }, 250);

    return () => clearTimeout(timer);
  }, [value, query, params, pathname, router]);

  function chooseGenre(next: string) {
    const p = new URLSearchParams(params);
    if (next) p.set("genre", next);
    else p.delete("genre");
    p.delete("show");
    startTransition(() => router.replace(`${pathname}?${p}`, { scroll: false }));
  }

  function showMore() {
    const p = new URLSearchParams(params);
    p.set("show", String(shown + helping));
    startTransition(() => router.replace(`${pathname}?${p}`, { scroll: false }));
  }

  const filtered = Boolean(query || genre);

  return (
    <div className="min-h-full bg-ground">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto w-full max-w-2xl px-5 pb-5 pt-8">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className={`h-2 w-2 shrink-0 rounded-full ${
                live ? "lamp-live" : "bg-line-strong"
              }`}
            />
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-soft">
              {live ? "Karaoke is on" : "Karaoke is off right now"}
            </p>
          </div>

          <h1 className="mt-2 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-ink">
            {venueName}
          </h1>
          <p className="mt-2 text-sm text-ink-soft">
            Find your song, then show it to the DJ.
          </p>
        </div>
      </header>

      {/* Sticky, because the search box is the whole screen on a phone and it
          should stay under a thumb however far down the list you are. */}
      <div className="sticky top-0 z-10 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto w-full max-w-2xl px-5 py-3">
          <label className="sr-only" htmlFor="song-search">
            Search songs or artists
          </label>
          <div className="relative">
            <input
              id="song-search"
              type="search"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={`Search ${total.toLocaleString()} songs`}
              autoComplete="off"
              className="w-full rounded-xl border border-line bg-ground px-4 py-3 text-base
                         text-ink placeholder:text-ink-faint"
            />
            {pending && (
              <span
                role="status"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-ink-faint"
              >
                searching
              </span>
            )}
          </div>

          {genres.length > 0 && (
            <div
              className="-mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1"
              role="group"
              aria-label="Filter by genre"
            >
              <Pill active={!genre} onClick={() => chooseGenre("")}>
                Everything
              </Pill>
              {genres.map((g) => (
                <Pill
                  key={g}
                  active={genre === g}
                  onClick={() => chooseGenre(genre === g ? "" : g)}
                >
                  {g}
                </Pill>
              ))}
            </div>
          )}
        </div>
      </div>

      <main className="mx-auto w-full max-w-2xl px-5 pb-16">
        <p className="py-3 text-sm text-ink-soft" aria-live="polite">
          {filtered
            ? `${matching.toLocaleString()} ${matching === 1 ? "song" : "songs"} found`
            : `${total.toLocaleString()} songs`}
        </p>

        {songs.length === 0 ? (
          <p className="rounded-xl border border-line bg-surface px-5 py-16 text-center text-ink-soft">
            {filtered
              ? "Nothing matches that. Try the artist instead."
              : "This venue has not added any songs yet."}
          </p>
        ) : (
          <ul className="overflow-hidden rounded-xl border border-line bg-surface">
            {songs.map((song) => (
              <li key={song.id} className="border-b border-line last:border-0">
                <button
                  type="button"
                  onClick={() => setPicked(song)}
                  className="flex w-full items-center gap-3 px-3 py-3 text-left
                             transition-colors hover:bg-surface-2 active:bg-surface-2"
                >
                  <Cover song={song} className="h-12 w-12" />
                  <span className="min-w-0 flex-1">
                    {/* Big and plain: this is read in a dark room. */}
                    <span className="block truncate text-base font-semibold text-ink">
                      {song.title}
                    </span>
                    <span className="block truncate text-sm text-ink-soft">
                      {song.artist}
                      {song.year ? ` · ${song.year}` : ""}
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className="shrink-0 text-sm text-ink-faint"
                  >
                    →
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {shown < matching && (
          <button
            type="button"
            onClick={showMore}
            className="mt-4 w-full rounded-xl border border-line bg-surface px-4 py-3
                       text-sm font-medium text-ink hover:bg-surface-2"
          >
            Show more — {shown.toLocaleString()} of {matching.toLocaleString()}
          </button>
        )}
      </main>

      <DjCard
        song={picked}
        venueName={venueName}
        onClose={() => setPicked(null)}
      />
    </div>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm
                  transition-colors ${
                    active
                      ? "border-accent bg-accent text-accent-ink"
                      : "border-line bg-surface text-ink-soft hover:bg-surface-2"
                  }`}
    >
      {children}
    </button>
  );
}

function Cover({ song, className }: { song: GuestSong; className: string }) {
  if (song.cover_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={song.cover_url}
        alt=""
        loading="lazy"
        className={`${className} shrink-0 rounded-lg border border-line object-cover`}
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      className={`${className} flex shrink-0 items-center justify-center rounded-lg
                  border border-line bg-surface-2 text-ink-faint`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-1/3 w-1/3"
      >
        <path d="M9 18V5l10-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="16" cy="16" r="3" />
      </svg>
    </div>
  );
}

/**
 * The card you hold up to the DJ.
 *
 * Deliberately the loudest thing in the product: one song, no chrome, type as
 * large as it can be without wrapping badly. The screen is also kept awake
 * while it is open, because the walk to the booth is long enough for a phone
 * to lock itself.
 */
function DjCard({
  song,
  venueName,
  onClose,
}: {
  song: GuestSong | null;
  venueName: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (song && !dialog.open) dialog.showModal();
    if (!song && dialog.open) dialog.close();
  }, [song]);

  useEffect(() => {
    if (!song) return;

    // Progressive: unsupported browsers and refused requests simply do
    // nothing, and the card still works.
    let lock: { release: () => Promise<void> } | null = null;
    let cancelled = false;

    navigator.wakeLock
      ?.request("screen")
      .then((sentinel) => {
        if (cancelled) void sentinel.release();
        else lock = sentinel;
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      void lock?.release();
    };
  }, [song]);

  // Long titles need to step down or they wrap into a wall.
  const size = !song
    ? ""
    : song.title.length > 34
      ? "text-4xl sm:text-5xl"
      : song.title.length > 20
        ? "text-5xl sm:text-6xl"
        : "text-6xl sm:text-7xl";

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        // The whole card closes on a tap. Someone walking back from the DJ
        // should not have to find a small button.
        if (e.target === ref.current) onClose();
      }}
      aria-label={song ? `${song.title} by ${song.artist}` : undefined}
      className="dj-card m-0 h-full max-h-none w-full max-w-none bg-surface p-0
                 text-ink backdrop:bg-black/70"
    >
      {song && (
        <div className="flex h-full flex-col">
          {/* The song is centred in whatever room is left; the footer is
              pinned. Doing both with mt-auto left a hole in the middle. */}
          <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-8 text-center">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
              Ask the DJ for
            </p>

            <Cover song={song} className="h-24 w-24 sm:h-32 sm:w-32" />

            <div className="min-w-0">
              <h2
                className={`text-balance font-display font-semibold leading-[0.95] tracking-tight ${size}`}
              >
                {song.title}
              </h2>
              <p className="mt-4 font-display text-2xl text-ink-soft sm:text-3xl">
                {song.artist}
              </p>
              {(song.year || song.duration) && (
                <p className="mt-3 text-sm tabular-nums text-ink-faint">
                  {[song.year, song.duration].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 px-6 pb-8">
            <p className="text-xs uppercase tracking-[0.14em] text-ink-faint">
              {venueName}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full max-w-xs rounded-xl bg-accent px-4 py-3.5 text-base
                         font-medium text-accent-ink hover:bg-accent-hover"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
