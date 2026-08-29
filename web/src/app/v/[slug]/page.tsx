import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SongBrowser from "./song-browser";

export default async function VenuePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: venue } = await supabase
    .from("venues")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (!venue) notFound();

  // Row level security already hides private libraries from a patron,
  // so this needs no is_public filter of its own.
  const [{ data: libraries }, { data: openSession }] = await Promise.all([
    supabase.from("libraries").select("id, name").eq("venue_id", venue.id),
    supabase
      .from("sessions")
      .select("id, opened_at")
      .eq("venue_id", venue.id)
      .is("closed_at", null)
      .maybeSingle(),
  ]);

  const libraryIds = (libraries ?? []).map((l) => l.id);
  const { data: songs } = libraryIds.length
    ? await supabase
        .from("songs")
        .select("id, title, artist, genre, year, duration, cover_url")
        .in("library_id", libraryIds)
        .order("artist")
        .order("title")
    : { data: [] };

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">{venue.name}</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {openSession ? "Karaoke is on tonight" : "Karaoke is not running right now"}
        </p>
      </header>

      <SongBrowser songs={songs ?? []} />
    </main>
  );
}
