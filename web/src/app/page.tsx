import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: venues } = await supabase
    .from("venues")
    .select("name, slug")
    .order("name");

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Karaoke OS</h1>
      <p className="mt-2 text-neutral-500">
        Scan the code at your table to see the songs the bar has.
      </p>

      <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-neutral-500">
        Venues
      </h2>
      <ul className="mt-3 divide-y divide-neutral-200 dark:divide-neutral-800">
        {(venues ?? []).map((venue) => (
          <li key={venue.slug}>
            <Link
              href={`/v/${venue.slug}`}
              className="block py-3 font-medium underline-offset-4 hover:underline
                         focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              {venue.name}
            </Link>
          </li>
        ))}
      </ul>
      {(venues ?? []).length === 0 && (
        <p className="mt-3 text-neutral-500">No venues yet.</p>
      )}
    </main>
  );
}
