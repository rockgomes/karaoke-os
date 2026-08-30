import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMembershipBySlug, requireUser } from "@/lib/auth";
import { fillMissingDetails } from "./actions";
import { BATCH_SIZE } from "./constants";
import AddSongForm from "./add-song-form";
import SongSearch from "./song-search";
import SongTable, { type SortKey } from "./song-table";
import Filters, { STATUSES, type GenreOption, type Status } from "./filters";
import Stats, { StatLink, type Stat } from "./stats";

const PER_PAGE = 25;
const SORTABLE: SortKey[] = ["title", "artist", "genre", "year"];

/** Every field the "fill in details" pass tries to complete. */
const MISSING_ANY =
  "genre.is.null,duration.is.null,album.is.null,year.is.null,cover_url.is.null";
const FILLABLE = ["genre", "duration", "album", "year", "cover_url"] as const;

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
  const genre = (one(search.genre) ?? "").trim();
  const statusParam = one(search.status) as Status | undefined;
  const status: Status =
    statusParam && STATUSES.some((s) => s.value === statusParam)
      ? statusParam
      : "all";
  const sortParam = one(search.sort) as SortKey | undefined;
  const sort: SortKey =
    sortParam && SORTABLE.includes(sortParam) ? sortParam : "artist";
  const dir = one(search.dir) === "desc" ? "desc" : "asc";
  const page = Math.max(1, Number(one(search.page) ?? 1) || 1);

  const supabase = await createClient();

  const { data: libraries } = await supabase
    .from("libraries")
    .select("id, name")
    .eq("venue_id", membership.venue_id)
    .order("created_at");

  const library = libraries?.[0] ?? null;

  // Searching, filtering, sorting and paging all happen in the database. A
  // venue can hold many thousands of songs, and shipping them all to the
  // browser to filter there would be slow long before that.
  type Row = {
    id: string;
    title: string;
    artist: string;
    genre: string | null;
    year: number | null;
    album: string | null;
    duration: string | null;
    cover_url: string | null;
  };

  let songs: Row[] = [];
  let matching = 0;
  let total = 0;
  let incomplete = 0;
  let addedThisWeek = 0;
  let genres: GenreOption[] = [];

  if (library) {
    const libraryId = library.id;

    const listed = (async () => {
      let q = supabase
        .from("songs")
        .select(
          "id, title, artist, genre, year, album, duration, cover_url",
          { count: "exact" },
        )
        .eq("library_id", libraryId);

      if (query) {
        // Commas would be read as argument separators by PostgREST's or().
        const safe = query.replace(/[,()]/g, " ");
        q = q.or(`title.ilike.%${safe}%,artist.ilike.%${safe}%`);
      }

      // A song can carry several comma-joined labels ("Pop, Dance"), so this
      // has to be a contains match rather than an equality one.
      if (genre) q = q.ilike("genre", `%${genre.replace(/[%_]/g, " ")}%`);

      if (status === "incomplete") q = q.or(MISSING_ANY);
      if (status === "complete") {
        for (const column of FILLABLE) q = q.not(column, "is", null);
      }

      return q
        .order(sort, { ascending: dir === "asc", nullsFirst: false })
        .order("title", { ascending: true })
        .range((page - 1) * PER_PAGE, page * PER_PAGE - 1);
    })();

    const [result, statsResult, genreResult] = await Promise.all([
      listed,
      supabase.rpc("library_stats", { target_library: libraryId }),
      supabase.rpc("library_genres", { target_library: libraryId }),
    ]);

    const counts = (statsResult.data ?? [])[0];

    songs = result.data ?? [];
    matching = result.count ?? 0;
    total = Number(counts?.total ?? 0);
    incomplete = Number(counts?.incomplete ?? 0);
    addedThisWeek = Number(counts?.added_this_week ?? 0);
    genres = (genreResult.data ?? []) as unknown as GenreOption[];
  }

  const pages = Math.max(1, Math.ceil(matching / PER_PAGE));
  const filtered = Boolean(query || genre || status !== "all");

  function hrefWith(changes: Record<string, string | null>) {
    const p = new URLSearchParams();
    if (query) p.set("q", query);
    if (genre) p.set("genre", genre);
    if (status !== "all") p.set("status", status);
    p.set("sort", sort);
    p.set("dir", dir);
    if (page > 1) p.set("page", String(page));
    for (const [key, value] of Object.entries(changes)) {
      if (value === null) p.delete(key);
      else p.set(key, value);
    }
    return `?${p}`;
  }

  // Built here, where the current filters are known. Passing a function to a
  // client component is not allowed, so the links are computed up front.
  const sortHrefs = Object.fromEntries(
    SORTABLE.map((key) => [
      key,
      hrefWith({
        sort: key,
        dir: sort === key && dir === "asc" ? "desc" : "asc",
        page: null,
      }),
    ]),
  ) as Record<SortKey, string>;

  const stats: Stat[] = [
    {
      label: "Songs",
      value: total.toLocaleString(),
      detail: filtered ? `${matching.toLocaleString()} match the filters` : null,
    },
    {
      label: "Missing details",
      value: incomplete.toLocaleString(),
      detail:
        incomplete > 0 ? (
          <StatLink href={hrefWith({ status: "incomplete", page: null })}>
            Show them
          </StatLink>
        ) : (
          "Every song is complete"
        ),
    },
    {
      label: "Added this week",
      value: addedThisWeek.toLocaleString(),
      detail: "In the last seven days",
    },
    {
      label: "Genres",
      value: genres.length.toLocaleString(),
      detail: genres.length ? `Most common: ${genres[0].genre}` : "None yet",
    },
  ];

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Songs
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            What guests find when they scan the code on the table.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/admin/${slug}/import`}
            className="rounded-lg border border-line bg-surface px-4 py-2.5 text-sm
 font-medium text-ink hover:bg-surface-2"
          >
            Import a CSV
          </Link>
        </div>
      </div>

      <div className="mt-6">
        <Stats stats={stats} />
      </div>

      {library ? (
        <details className="group mt-6 rounded-xl border border-line bg-surface">
          <summary
            className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-ink
 marker:content-none"
          >
            <span className="text-accent">＋</span> Add a song
            <span className="ml-2 font-normal text-ink-faint group-open:hidden">
              title and artist are enough — the rest is filled in for you
            </span>
          </summary>
          <div className="border-t border-line px-4 py-4">
            <AddSongForm slug={slug} libraryId={library.id} />
          </div>
        </details>
      ) : (
        <p className="mt-6 text-ink-soft">This venue has no song list.</p>
      )}

      <section className="mt-8">
        <div className="flex flex-wrap items-center gap-2">
          <SongSearch total={total} />
          <Filters genres={genres} genre={genre} status={status} />

          {incomplete > 0 && (
            <form action={fillMissingDetails} className="ml-auto flex items-center gap-2">
              <input type="hidden" name="slug" value={slug} />
              {/* Says what it does. It used to read "Fill in details (54)"
                  and then quietly handle ten of them. */}
              <span className="text-xs text-ink-faint">
                {incomplete.toLocaleString()} to go
              </span>
              <button
                type="submit"
                className="rounded-lg border border-line bg-surface px-3 py-2 text-sm
                           font-medium text-ink hover:bg-surface-2"
              >
                Fill in the next {Math.min(BATCH_SIZE, incomplete)}
              </button>
            </form>
          )}
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-line bg-surface">
          {songs.length > 0 ? (
            <SongTable
              slug={slug}
              songs={songs}
              sort={sort}
              dir={dir}
              sortHrefs={sortHrefs}
            />
          ) : (
            <p className="px-4 py-16 text-center text-ink-soft">
              {filtered
                ? "Nothing matches those filters."
                : "No songs yet. Add one above, or import a CSV."}
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
                href={hrefWith({ page: page - 1 === 1 ? null : String(page - 1) })}
                scroll={false}
                className="rounded-md px-2 py-1 text-ink underline-offset-4 hover:underline"
              >
                ← Previous
              </Link>
            ) : (
              <span className="px-2 py-1 text-ink-faint">← Previous</span>
            )}

            <span className="tabular-nums text-ink-soft">
              Page {page} of {pages}
            </span>

            {page < pages ? (
              <Link
                href={hrefWith({ page: String(page + 1) })}
                scroll={false}
                className="rounded-md px-2 py-1 text-ink underline-offset-4 hover:underline"
              >
                Next →
              </Link>
            ) : (
              <span className="px-2 py-1 text-ink-faint">Next →</span>
            )}
          </nav>
        )}
      </section>
    </>
  );
}
