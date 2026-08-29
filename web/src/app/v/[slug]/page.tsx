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
  const show = Math.min(
    2000,
    Math.max(HELPING, Number(one(search.show) ?? HELPING) || HELPING),
  );

  // Row level security already hides private libraries, and a suspended
  // venue, from a patron. None of this needs a filter of its own.
  const [{ data: libraries }, { data: openSession }, { data: genreRows }] =
    await Promise.all([
      supabase.from("libraries").select("id").eq("venue_id", venue.id),
      supabase
        .from("sessions")
        .select("id")
        .eq("venue_id", venue.id)
        .is("closed_at", null)
        .maybeSingle(),
      supabase.rpc("venue_genres", { target_venue: venue.id }),
    ]);

  const libraryIds = (libraries ?? []).map((l) => l.id);

  let songs: GuestSong[] = [];
  let matching = 0;
  let total = 0;

  if (libraryIds.length) {
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

    const [result, totalResult] = await Promise.all([
      listed.order("artist").order("title").range(0, show - 1),
      supabase
        .from("songs")
        .select("id", { count: "exact", head: true })
        .in("library_id", libraryIds),
    ]);

    songs = (result.data ?? []) as GuestSong[];
    matching = result.count ?? 0;
    total = totalResult.count ?? 0;
  }

  return (
    <SongBrowser
      venueName={venue.name}
      live={Boolean(openSession)}
      songs={songs}
      matching={matching}
      total={total}
      shown={songs.length}
      helping={HELPING}
      genres={(genreRows ?? []).map((g) => g.genre)}
      query={query}
      genre={genre}
    />
  );
}
