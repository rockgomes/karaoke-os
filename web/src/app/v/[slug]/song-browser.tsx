"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import ThemeToggle from "@/components/theme-toggle";
import { toggleFavorite } from "./actions";

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
 *
 * An account is never required. It only buys you the hearts.
 */
export default function SongBrowser({
  slug,
  venueName,
  live,
  songs,
  matching,
  total,
  shown,
  helping,
  wall,
  genres,
  query,
  genre,
  onlyFavourites,
  favouriteIds,
  favouritesHere,
  signedIn,
}: {
  slug: string;
  venueName: string;
  live: boolean;
  songs: GuestSong[];
  matching: number;
  total: number;
  shown: number;
  helping: number;
  /** A handful of this venue's covers, used as the header's texture. */
  wall: string[];
  genres: string[];
  query: string;
  genre: string;
  onlyFavourites: boolean;
  favouriteIds: string[];
  favouritesHere: number;
  signedIn: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const [value, setValue] = useState(query);
  const [picked, setPicked] = useState<GuestSong | null>(null);

  const favourites = new Set(favouriteIds);
  // Where sign-in should send someone back to: this exact view.
  const here = params.toString() ? `${pathname}?${params}` : pathname;
  const signInHref = `/login?next=${encodeURIComponent(here)}`;

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

  function apply(key: "genre" | "fav", next: string) {
    const p = new URLSearchParams(params);
    if (next) p.set(key, next);
    else p.delete(key);
    p.delete("show");
    startTransition(() => router.replace(`${pathname}?${p}`, { scroll: false }));
  }

  function showMore() {
    const p = new URLSearchParams(params);
    p.set("show", String(shown + helping));
    startTransition(() => router.replace(`${pathname}?${p}`, { scroll: false }));
  }

  const filtered = Boolean(query || genre || onlyFavourites);

  return (
    <div className="min-h-full bg-ground">
      <header className="relative isolate overflow-hidden border-b border-line bg-surface">
        {/*
         * The texture is the venue's own album art, blurred hard and pushed
         * back behind a scrim. Not decoration: it is literally what this bar
         * has. A venue with no artwork yet gets a plain band instead.
         */}
        {wall.length > 0 && (
          <div aria-hidden="true" className="absolute inset-0 -z-10">
            <div className="flex h-full w-full scale-125 blur-2xl saturate-150">
              {wall.slice(0, 8).map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={`${src}-${i}`}
                  src={src}
                  alt=""
                  aria-hidden="true"
                  className="h-full min-w-0 flex-1 object-cover opacity-60"
                />
              ))}
            </div>
            {/* The scrim is what keeps the type readable over anything. */}
            <div className="absolute inset-0 bg-surface/80" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface" />
          </div>
        )}

        <div className="mx-auto w-full max-w-2xl px-5 pb-7 pt-8">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className={`h-2 w-2 shrink-0 rounded-full ${
                live ? "lamp-live" : "bg-line-strong"
              }`}
            />
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-ink-soft">
              {live ? "Karaoke is on" : "Karaoke is off right now"}
            </p>
            <div className="ml-auto">
              <ThemeToggle />
            </div>
          </div>

          {/* This is the bar's screen, so the bar's name is the loudest thing
              on it. */}
          <h1
            className="mt-3 text-balance font-display text-5xl font-semibold
                       leading-[0.95] tracking-tight text-ink sm:text-6xl"
          >
            {venueName}
          </h1>
          <p className="mt-3 text-sm text-ink-soft">
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

          <div
            className="-mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1"
            role="group"
            aria-label="Filter the list"
          >
            <Pill
              active={!genre && !onlyFavourites}
              onClick={() => {
                const p = new URLSearchParams(params);
                p.delete("genre");
                p.delete("fav");
                p.delete("show");
                startTransition(() =>
                  router.replace(`${pathname}?${p}`, { scroll: false }),
                );
              }}
            >
              Everything
            </Pill>

            {signedIn && favouritesHere > 0 && (
              <Pill
                active={onlyFavourites}
                onClick={() => apply("fav", onlyFavourites ? "" : "1")}
              >
                <Heart filled className="mr-1.5 inline h-3.5 w-3.5" /> Yours (
                {favouritesHere})
              </Pill>
            )}

            {genres.map((g) => (
              <Pill
                key={g}
                active={genre === g}
                onClick={() => apply("genre", genre === g ? "" : g)}
              >
                {g}
              </Pill>
            ))}
          </div>
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
            {onlyFavourites
              ? "You have not saved a song here yet."
              : filtered
                ? "Nothing matches that. Try the artist instead."
                : "This venue has not added any songs yet."}
          </p>
        ) : (
          <ul className="overflow-hidden rounded-xl border border-line bg-surface">
            {songs.map((song) => (
              <li
                key={song.id}
                className="flex items-center border-b border-line last:border-0"
              >
                <button
                  type="button"
                  onClick={() => setPicked(song)}
                  className="flex min-w-0 flex-1 items-center gap-4 py-3 pl-3 text-left
                             transition-colors hover:bg-surface-2 active:bg-surface-2"
                >
                  <Cover song={song} className="h-16 w-16 sm:h-[72px] sm:w-[72px]" />
                  <span className="min-w-0 flex-1">
                    {/* Big and plain: this is read in a dark room. */}
                    <span className="block truncate text-[17px] font-semibold leading-tight text-ink">
                      {song.title}
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-ink-soft">
                      {song.artist}
                    </span>
                    <span className="mt-0.5 block truncate text-xs tabular-nums text-ink-faint">
                      {[song.year, song.genre, song.duration].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                </button>

                <FavouriteButton
                  slug={slug}
                  song={song}
                  saved={favourites.has(song.id)}
                  signedIn={signedIn}
                  signInHref={signInHref}
                />
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

        <p className="mt-8 text-center text-xs text-ink-faint">
          {signedIn ? (
            <>Your favourites are saved to your account.</>
          ) : (
            <>
              <Link
                href={signInHref}
                className="text-accent underline-offset-4 hover:underline"
              >
                Sign in
              </Link>{" "}
              to keep favourites. You never need an account to browse.
            </>
          )}
        </p>
      </main>

      <DjCard
        slug={slug}
        song={picked}
        venueName={venueName}
        saved={picked ? favourites.has(picked.id) : false}
        signedIn={signedIn}
        signInHref={signInHref}
        onClose={() => setPicked(null)}
      />
    </div>
  );
}

function Heart({
  filled,
  className = "h-5 w-5",
}: {
  filled: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 20.5 4.2 12.9a4.6 4.6 0 1 1 6.5-6.5l1.3 1.3 1.3-1.3a4.6 4.6 0 1 1 6.5 6.5Z" />
    </svg>
  );
}

/**
 * Signed out this is a link to the sign-in page, not a dead button: tapping a
 * heart and having nothing happen is the worst of the three options.
 */
function FavouriteButton({
  slug,
  song,
  saved,
  signedIn,
  signInHref,
}: {
  slug: string;
  song: GuestSong;
  saved: boolean;
  signedIn: boolean;
  signInHref: string;
}) {
  const shared =
    "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg transition-colors";

  if (!signedIn) {
    return (
      <Link
        href={signInHref}
        aria-label={`Sign in to save ${song.title}`}
        className={`${shared} mr-1 text-ink-faint hover:bg-surface-2 hover:text-ink-soft`}
      >
        <Heart filled={false} />
      </Link>
    );
  }

  return (
    <form action={toggleFavorite} className="mr-1">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="song_id" value={song.id} />
      <input type="hidden" name="on" value={String(!saved)} />
      <button
        type="submit"
        aria-pressed={saved}
        aria-label={
          saved ? `Remove ${song.title} from favourites` : `Save ${song.title}`
        }
        className={`${shared} ${
          saved
            ? "text-accent hover:bg-accent-soft"
            : "text-ink-faint hover:bg-surface-2 hover:text-ink-soft"
        }`}
      >
        <Heart filled={saved} />
      </button>
    </form>
  );
}

/** Same song, same colour, every time. */
function hueFor(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) % 360;
  return hash;
}

/** The one or two letters that stand in for a missing sleeve. */
function initials(title: string): string {
  const words = title.replace(/[^\p{L}\p{N} ]/gu, " ").trim().split(/\s+/);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function Cover({
  song,
  className,
  text = "text-base",
}: {
  song: GuestSong;
  className: string;
  text?: string;
}) {
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
      style={{ "--tint": hueFor(song.artist + song.title) } as React.CSSProperties}
      className={`${className} cover-tint flex shrink-0 items-center justify-center
                  rounded-lg border border-line`}
    >
      <span className={`font-display font-semibold text-ink-soft ${text}`}>
        {initials(song.title)}
      </span>
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
  slug,
  song,
  venueName,
  saved,
  signedIn,
  signInHref,
  onClose,
}: {
  slug: string;
  song: GuestSong | null;
  venueName: string;
  saved: boolean;
  signedIn: boolean;
  signInHref: string;
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

            <Cover song={song} className="h-32 w-32 sm:h-40 sm:w-40" text="text-3xl" />

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

            <FavouriteOnCard
              slug={slug}
              song={song}
              saved={saved}
              signedIn={signedIn}
              signInHref={signInHref}
            />
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

function FavouriteOnCard({
  slug,
  song,
  saved,
  signedIn,
  signInHref,
}: {
  slug: string;
  song: GuestSong;
  saved: boolean;
  signedIn: boolean;
  signInHref: string;
}) {
  const shared =
    "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors";

  if (!signedIn) {
    return (
      <Link
        href={signInHref}
        className={`${shared} border-line text-ink-soft hover:bg-surface-2`}
      >
        <Heart filled={false} className="h-4 w-4" />
        Sign in to save this
      </Link>
    );
  }

  return (
    <form action={toggleFavorite}>
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="song_id" value={song.id} />
      <input type="hidden" name="on" value={String(!saved)} />
      <button
        type="submit"
        aria-pressed={saved}
        className={`${shared} ${
          saved
            ? "border-accent bg-accent-soft text-accent"
            : "border-line text-ink-soft hover:bg-surface-2"
        }`}
      >
        <Heart filled={saved} className="h-4 w-4" />
        {saved ? "Saved" : "Save this song"}
      </button>
    </form>
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
