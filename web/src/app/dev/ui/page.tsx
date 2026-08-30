import { notFound } from "next/navigation";
import { Suspense } from "react";
import Filters, { type GenreOption, type Status } from "@/app/admin/[slug]/filters";
import SongTable, { type SongRow, type SortKey } from "@/app/admin/[slug]/song-table";
import Stats, { StatLink, type Stat } from "@/app/admin/[slug]/stats";
import SideNav from "@/components/side-nav";
import { venueNav } from "@/lib/nav";

/*
 * A bench for the staff components, with fixture data and no sign-in.
 *
 * Everything on the admin screens sits behind requireUser(), so checking
 * their layout used to need a live session. Sessions expire, and the
 * alternative — handing a password to whoever is checking — is not one.
 *
 * So the components are rendered here instead, out of the real files, with
 * the real stylesheet. What you measure here is what ships. It does not
 * cover data loading, permissions or server actions; those are exercised by
 * the real pages and by the database tests.
 *
 * Development only. In production this route is a 404.
 */
export const dynamic = "force-dynamic";

const SONGS: SongRow[] = [
  {
    id: "1",
    title: "Take On Me",
    artist: "a-ha",
    album: "Hunting High and Low (Deluxe Edition)",
    genre: "Synthpop",
    year: 1985,
    duration: "3:49",
    cover_url: null,
  },
  {
    id: "2",
    title: "Singin' in the Rain (feat. a Very Long Guest Name Indeed)",
    artist: "Gene Kelly and a Rather Long Orchestra Name",
    album: null,
    genre: "Soundtrack, Jazz, Vocal",
    year: 1952,
    duration: "4:02",
    cover_url: null,
  },
  {
    id: "3",
    title: "Thunderstruck",
    artist: "AC/DC",
    album: "The Razors Edge",
    genre: "Hard Rock",
    year: 1990,
    duration: "4:52",
    cover_url: null,
  },
];

const GENRES: GenreOption[] = [
  { genre: "Pop", songs: 13 },
  { genre: "Rock", songs: 11 },
  { genre: "Singer/Songwriter", songs: 12 },
  { genre: "Alternative", songs: 3 },
];

const STATS: Stat[] = [
  { label: "Songs", value: "55" },
  {
    label: "Missing details",
    value: "43",
    detail: <StatLink href="#">Show them</StatLink>,
  },
  { label: "Added this week", value: "55", detail: "In the last seven days" },
  { label: "Genres", value: "11", detail: "Most common: Pop" },
];

const SORT_HREFS: Record<SortKey, string> = {
  title: "#",
  artist: "#",
  genre: "#",
  year: "#",
};

export default function DevUiPage() {
  // Belt and braces: the route is excluded from the sitemap and the map
  // check, and it refuses to render outside development.
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className="flex min-h-full flex-1 flex-col lg:flex-row">
      <SideNav
        title="The Anchor"
        live
        email="owner@example.test"
        groups={venueNav("the-anchor", {
          venues: [{ name: "The Anchor", slug: "the-anchor" }],
          isPlatformAdmin: true,
        })}
        sessionControl={
          <button
            type="button"
            className="w-full rounded-lg border border-rail-line px-3 py-2 text-sm
                       font-medium text-rail-ink hover:bg-rail-2"
          >
            Close karaoke
          </button>
        }
      />

      <main className="min-w-0 flex-1 bg-ground">
        <div className="mx-auto w-full max-w-[1280px] px-5 py-8 sm:px-8 lg:px-10">
          {/* The furniture below mirrors the songs page, so the vertical
              stack here measures the same as the real one. */}
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-tight">
                Songs
              </h1>
              <p className="mt-1 hidden text-sm text-ink-soft sm:block">
                What guests find when they scan the code on the table.
              </p>
            </div>
            <span
              className="inline-flex h-11 items-center rounded-lg border border-line
                         bg-surface px-4 text-sm font-medium text-ink"
            >
              Import a CSV
            </span>
          </div>

          <div className="mt-6">
            <Stats stats={STATS} />
          </div>

          <details className="group mt-6 rounded-xl border border-line bg-surface">
            <summary
              className="flex min-h-11 cursor-pointer list-none items-center px-4 py-3
                         text-sm font-medium text-ink marker:content-none"
            >
              <span className="text-accent">＋</span>
              <span className="ml-1.5">Add a song</span>
              <span className="ml-2 hidden font-normal text-ink-faint sm:inline sm:group-open:hidden">
                title and artist are enough — the rest is filled in for you
              </span>
            </summary>
          </details>

          <section className="mt-8">
            <div className="flex flex-wrap items-center gap-2">
              <Suspense fallback={null}>
                <Filters genres={GENRES} genre="" status={"all" as Status} />
              </Suspense>
            </div>

            <div className="mt-4 overflow-hidden rounded-xl border border-line bg-surface">
              <SongTable
                slug="the-anchor"
                songs={SONGS}
                sort="artist"
                dir="asc"
                sortHrefs={SORT_HREFS}
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
