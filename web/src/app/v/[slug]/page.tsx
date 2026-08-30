import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import SongBrowser, { type GuestSong } from "./song-browser";

/** How many songs a first look shows. "Show more" adds another helping. */
const HELPING = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: venue } = await supabase
    .from("venues")
    .select("name")
    .eq("slug", slug)
    .maybeSingle();

  return venue
    ? { title: `${venue.name} — songs you can sing` }
    : { title: "Karaoke OS" };
}

export default async function VenuePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const search = await searchParams;
  const supabase = await createClient();

  const { data: venue } = await supabase
    .from("venues")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (!venue) notFound();

  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const query = (one(search.q) ?? "").trim();
  const genre = (one(search.genre) ?? "").trim();
  const onlyFavourites = one(search.fav) === "1";
  const show = Math.min(
    2000,
    Math.max(HELPING, Number(one(search.show) ?? HELPING) || HELPING),
  );

  // Row level security already hides private libraries, and a suspended
  // venue, from a patron. None of this needs a filter of its own.
  const [
    { data: libraries },
    { data: openSession },
    { data: genreRows },
    {
      data: { user },
    },
  ] = await Promise.all([
    supabase.from("libraries").select("id").eq("venue_id", venue.id),
    supabase
      .from("sessions")
      .select("id")
      .eq("venue_id", venue.id)
      .is("closed_at", null)
      .maybeSingle(),
    supabase.rpc("venue_genres", { target_venue: venue.id }),
    supabase.auth.getUser(),
  ]);

  const libraryIds = (libraries ?? []).map((l) => l.id);

  // Only this person's own rows come back — that is what the policy on
  // favorites says — so no user filter is needed here.
  const favouriteIds = user
    ? ((await supabase.from("favorites").select("song_id")).data ?? []).map(
        (f) => f.song_id,
      )
    : [];
  const favouriteSet = new Set(favouriteIds);

  let songs: GuestSong[] = [];
  let matching = 0;
  let total = 0;
  let favouritesHere = 0;
  /** A few real covers, used as the texture behind the venue's name. */
  let wall: string[] = [];

  // Asking for favourites when there are none would send an empty IN () list
  // to PostgREST, so answer it without a query.
  const impossible = onlyFavourites && favouriteIds.length === 0;

  if (libraryIds.length && !impossible) {
    // Searching happens in the database. A venue's catalogue can run to
    // thousands of songs, and a phone on bar wifi should not download all of
    // them to filter locally. songs_title_trgm and songs_artist_trgm make the
    // "contains" match fast enough to type against.
    let listed = supabase
      .from("songs")
      .select("id, title, artist, genre, year, duration, cover_url", {
        count: "exact",
      })
      .in("library_id", libraryIds);

    if (query) {
      // Commas would be read as argument separators by PostgREST's or().
      const safe = query.replace(/[,()]/g, " ");
      listed = listed.or(`title.ilike.%${safe}%,artist.ilike.%${safe}%`);
    }

    // A song can carry several comma-joined labels ("Pop, Dance").
    if (genre) listed = listed.ilike("genre", `%${genre.replace(/[%_]/g, " ")}%`);

    if (onlyFavourites) listed = listed.in("id", favouriteIds);

    const [result, totalResult, favouriteCount] = await Promise.all([
      listed.order("artist").order("title").range(0, show - 1),
      supabase
        .from("songs")
        .select("id", { count: "exact", head: true })
        .in("library_id", libraryIds),
      favouriteIds.length
        ? supabase
            .from("songs")
            .select("id", { count: "exact", head: true })
            .in("library_id", libraryIds)
            .in("id", favouriteIds)
        : Promise.resolve({ count: 0 }),
    ]);

    songs = (result.data ?? []) as GuestSong[];
    matching = result.count ?? 0;
    total = totalResult.count ?? 0;
    favouritesHere = favouriteCount.count ?? 0;

    // The header's backdrop is the venue's own records, not stock texture.
    // A venue with no artwork yet simply gets a plain band.
    const covers = await supabase
      .from("songs")
      .select("cover_url")
      .in("library_id", libraryIds)
      .not("cover_url", "is", null)
      .limit(12);
    wall = (covers.data ?? [])
      .map((c) => c.cover_url)
      .filter((c): c is string => Boolean(c));
  } else if (libraryIds.length) {
    const totalResult = await supabase
      .from("songs")
      .select("id", { count: "exact", head: true })
      .in("library_id", libraryIds);
    total = totalResult.count ?? 0;
  }

  return (
    <SongBrowser
      slug={slug}
      venueName={venue.name}
      live={Boolean(openSession)}
      songs={songs}
      matching={matching}
      total={total}
      shown={songs.length}
      helping={HELPING}
      wall={wall}
      genres={(genreRows ?? []).map((g) => g.genre)}
      query={query}
      genre={genre}
      onlyFavourites={onlyFavourites}
      favouriteIds={songs.filter((s) => favouriteSet.has(s.id)).map((s) => s.id)}
      favouritesHere={favouritesHere}
      signedIn={Boolean(user)}
    />
  );
}
