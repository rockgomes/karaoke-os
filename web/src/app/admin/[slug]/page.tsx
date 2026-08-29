import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMembershipBySlug, requireUser } from "@/lib/auth";
import { toggleSession } from "./actions";
import AddSongForm from "./add-song-form";
import SongRow from "./song-row";

export default async function VenueAdminPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await requireUser();

  const membership = await getMembershipBySlug(slug);
  if (!membership) notFound();

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

  const { data: songs } = library
    ? await supabase
        .from("songs")
        .select("id, title, artist, genre, year")
        .eq("library_id", library.id)
        .order("artist")
        .order("title")
    : { data: [] };

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {membership.venues.name}
          </h1>
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
          <input
            type="hidden"
            name="open_session_id"
            value={openSession?.id ?? ""}
          />
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
        <h2 className="text-lg font-semibold">Add a song</h2>
        {library ? (
          <AddSongForm slug={slug} libraryId={library.id} />
        ) : (
          <p className="mt-2 text-neutral-500">This venue has no song list.</p>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">
          Songs{" "}
          <span className="font-normal text-neutral-500">
            ({songs?.length ?? 0})
          </span>
        </h2>

        {songs && songs.length > 0 ? (
          <ul className="mt-3 divide-y divide-neutral-200 dark:divide-neutral-800">
            {songs.map((song) => (
              <SongRow key={song.id} slug={slug} song={song} />
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-neutral-500">No songs yet.</p>
        )}
      </section>
    </main>
  );
}
