import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMembershipBySlug, requireUser } from "@/lib/auth";
import { fillMissingDetails, toggleSession } from "./actions";
import AddSongForm from "./add-song-form";
import SongSearch from "./song-search";
import SongTable, { type SortKey } from "./song-table";

const PER_PAGE = 25;
const SORTABLE: SortKey[] = ["title", "artist", "genre", "year"];

export default async function VenueAdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const search = await searchParams;
  await requireUser();

  const membership = await getMembershipBySlug(slug);
  if (!membership) notFound();

  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const query = (one(search.q) ?? "").trim();
  const sortParam = one(search.sort) as SortKey | undefined;
  const sort: SortKey = sortParam && SORTABLE.includes(sortParam) ? sortParam : "artist";
  const dir = one(search.dir) === "desc" ? "desc" : "asc";
  const page = Math.max(1, Number(one(search.page) ?? 1) || 1);

  const supabase = await createClient();

  const [{ data: libraries }, { data: openSession }] = await Promise.all([
    supabase
      .from("libraries")
      .select("id, name")
      .eq("venue_id", membership.venue_id)
      .order("created_at"),
    supabase
      .from("sessions")
      .select("id, opened_at")
      .eq("venue_id", membership.venue_id)
      .is("closed_at", null)
      .maybeSingle(),
  ]);

  const library = libraries?.[0] ?? null;

  // Searching, sorting and paging all happen in the database. A venue can hold
  // many thousands of songs, and shipping them all to the browser to filter
  // there would be slow long before that.
  type Row = {
    id: string;
    title: string;
    artist: string;
    genre: string | null;
    year: number | null;
    album: string | null;
    duration: string | null;
  };

  let songs: Row[] = [];
  let matching = 0;
  let total = 0;
  let incomplete = 0;

  async function loadSongs(libraryId: string) {
    let q = supabase
      .from("songs")
      .select("id, title, artist, genre, year, album, duration", { count: "exact" })
      .eq("library_id", libraryId);

    if (query) {
      // Commas would be read as argument separators by PostgREST's or().
      const safe = query.replace(/[,()]/g, " ");
      q = q.or(`title.ilike.%${safe}%,artist.ilike.%${safe}%`);
    }

    return q
      .order(sort, { ascending: dir === "asc", nullsFirst: false })
      .order("title", { ascending: true })
      .range((page - 1) * PER_PAGE, page * PER_PAGE - 1);
  }

  if (library) {
    const [result, totalResult, incompleteResult] = await Promise.all([
      loadSongs(library.id),
      supabase
        .from("songs")
        .select("id", { count: "exact", head: true })
        .eq("library_id", library.id),
      supabase
        .from("songs")
        .select("id", { count: "exact", head: true })
        .eq("library_id", library.id)
        .or("genre.is.null,duration.is.null,album.is.null,year.is.null,cover_url.is.null"),
    ]);

    songs = result.data ?? [];
    matching = result.count ?? 0;
    total = totalResult.count ?? 0;
    incomplete = incompleteResult.count ?? 0;
  }

  const pages = Math.max(1, Math.ceil(matching / PER_PAGE));

  function pageHref(target: number) {
    const p = new URLSearchParams();
    if (query) p.set("q", query);
    p.set("sort", sort);
    p.set("dir", dir);
    if (target > 1) p.set("page", String(target));
    return `?${p}`;
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{membership.venues.name}</h1>
          <Link
            href={`/v/${slug}`}
            className="text-sm text-neutral-500 underline-offset-4 hover:underline
                       focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            View what guests see → /v/{slug}
          </Link>
        </div>

        <form action={toggleSession}>
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="open_session_id" value={openSession?.id ?? ""} />
          <button
            type="submit"
            className={`rounded-lg px-4 py-2.5 font-medium text-white
                        focus-visible:outline-2 focus-visible:outline-offset-2
                        focus-visible:outline-blue-600 ${
                          openSession
                            ? "bg-neutral-700 hover:bg-neutral-800"
                            : "bg-green-700 hover:bg-green-800"
                        }`}
          >
            {openSession ? "Close karaoke" : "Open karaoke"}
          </button>
        </form>
      </div>

      <p className="mt-2 text-sm text-neutral-500" aria-live="polite">
        {openSession
          ? "Karaoke is open. Guests see it running."
          : "Karaoke is closed."}
      </p>

      <section className="mt-10">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold">Add a song</h2>
          <Link
            href={`/admin/${slug}/import`}
            className="text-sm text-neutral-500 underline-offset-4 hover:underline
                       focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            or import a CSV
          </Link>
        </div>
        {library ? (
          <AddSongForm slug={slug} libraryId={library.id} />
        ) : (
          <p className="mt-2 text-neutral-500">This venue has no song list.</p>
        )}
      </section>

      <section className="mt-12">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold">
            Songs{" "}
            <span className="font-normal text-neutral-500">
              {query ? `(${matching} of ${total})` : `(${total})`}
            </span>
          </h2>

          {incomplete > 0 && (
            <form action={fillMissingDetails} className="ml-auto">
              <input type="hidden" name="slug" value={slug} />
              <button
                type="submit"
                className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium
                           hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-blue-600
                           dark:border-neutral-700 dark:hover:bg-neutral-900"
              >
                Fill in details ({incomplete})
              </button>
            </form>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <SongSearch total={total} />
        </div>

        <div className="mt-4">
          {songs.length > 0 ? (
            <SongTable
              slug={slug}
              songs={songs}
              sort={sort}
              dir={dir}
              query={query}
              page={page}
            />
          ) : (
            <p className="py-8 text-center text-neutral-500">
              {query ? `Nothing matches “${query}”.` : "No songs yet."}
            </p>
          )}
        </div>

        {pages > 1 && (
          <nav
            className="mt-5 flex items-center justify-between text-sm"
            aria-label="Song list pages"
          >
            {page > 1 ? (
              <Link
                href={pageHref(page - 1)}
                scroll={false}
                className="rounded-md px-2 py-1 underline-offset-4 hover:underline
                           focus-visible:outline-2 focus-visible:outline-blue-600"
              >
                ← Previous
              </Link>
            ) : (
              <span className="px-2 py-1 text-neutral-400">← Previous</span>
            )}

            <span className="text-neutral-500 tabular-nums">
              Page {page} of {pages}
            </span>

            {page < pages ? (
              <Link
                href={pageHref(page + 1)}
                scroll={false}
                className="rounded-md px-2 py-1 underline-offset-4 hover:underline
                           focus-visible:outline-2 focus-visible:outline-blue-600"
              >
                Next →
              </Link>
            ) : (
              <span className="px-2 py-1 text-neutral-400">Next →</span>
            )}
          </nav>
        )}
      </section>
    </main>
  );
}
